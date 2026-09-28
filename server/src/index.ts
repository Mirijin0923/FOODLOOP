import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { smsOtpProvider } from './providers/sms.js';

type Channel = 'email' | 'sms';
type Purpose = 'signup' | 'login' | 'password-reset';
type Account = { id: string; name: string; email?: string; phone?: string; passwordHash: string; createdAt: string };
type EmailOtp = { hash: string; expiresAt: number; attempts: number; sentAt: number; purpose: Purpose };
type VerifiedSubject = { channel: Channel; subject: string; purpose: Purpose; expiresAt: number };

const app = express();
const port = Number(process.env.PORT || 4000);
const dataPath = path.join(process.cwd(), 'data', 'accounts.json');
const emailOtps = new Map<string, EmailOtp>();
const verifiedSubjects = new Map<string, VerifiedSubject>();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '16kb' }));
app.use('/auth/otp/send', rateLimit({ windowMs: 60_000, max: 3, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many code requests. Please wait a minute before trying again.' } }));

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^9\d{9}$/.test(digits)) return `+63${digits}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  return null;
};
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const key = (channel: Channel, subject: string) => `${channel}:${subject}`;
const makeToken = () => crypto.randomBytes(32).toString('base64url');
const makeCode = () => crypto.randomInt(100000, 1_000_000).toString();
const publicUser = (account: Account) => ({ id: account.id, name: account.name, email: account.email, phone: account.phone });

async function accounts(): Promise<Account[]> {
  try { return JSON.parse(await fs.readFile(dataPath, 'utf8')) as Account[]; } catch { return []; }
}
async function saveAccounts(value: Account[]) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
}
function issueVerifiedToken(channel: Channel, subject: string, purpose: Purpose) {
  const token = makeToken();
  verifiedSubjects.set(token, { channel, subject, purpose, expiresAt: Date.now() + 10 * 60_000 });
  return token;
}
function consumeVerifiedToken(token: string, channel: Channel, subject: string, purpose: Purpose) {
  const verified = verifiedSubjects.get(token);
  verifiedSubjects.delete(token);
  return !!verified && verified.channel === channel && verified.subject === subject && verified.purpose === purpose && verified.expiresAt > Date.now();
}

app.post('/auth/otp/send', async (req, res) => {
  const { channel, destination, purpose } = req.body as { channel?: Channel; destination?: string; purpose?: Purpose };
  if (!destination || !['email', 'sms'].includes(channel ?? '') || !['signup', 'login', 'password-reset'].includes(purpose ?? '')) return res.status(400).json({ error: 'Invalid verification request.' });
  const subject = channel === 'sms' ? normalizePhone(destination) : normalizeEmail(destination);
  if (!subject || (channel === 'email' && !emailOk(subject))) return res.status(400).json({ error: channel === 'sms' ? 'Enter a valid Philippine mobile number.' : 'Enter a valid email address.' });
  try {
    if (channel === 'sms') {
      await smsOtpProvider.sendOtp(subject);
    } else {
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) throw new Error('Email verification is not configured.');
      const current = emailOtps.get(key(channel, subject));
      if (current && Date.now() - current.sentAt < 60_000) return res.status(429).json({ error: 'Please wait one minute before requesting another code.', retryAfterSeconds: Math.ceil((60_000 - (Date.now() - current.sentAt)) / 1000) });
      const code = makeCode();
      emailOtps.set(key(channel, subject), { hash: await bcrypt.hash(code, 12), expiresAt: Date.now() + 10 * 60_000, attempts: 0, sentAt: Date.now(), purpose });
      const { error } = await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: subject, subject: 'Your FoodLoop verification code', html: `<p>Your FoodLoop verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. Do not share this code.</p>` });
      if (error) throw new Error('Email provider could not deliver the verification code.');
    }
    return res.status(202).json({ sent: true, channel, destination: channel === 'sms' ? subject.slice(0, -4).replace(/./g, '•') + subject.slice(-4) : subject.replace(/(^.).*(@.*$)/, '$1•••$2'), expiresInSeconds: 600, resendAfterSeconds: 60 });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Verification service is temporarily unavailable.' });
  }
});

app.post('/auth/otp/verify', async (req, res) => {
  const { channel, destination, purpose, code } = req.body as { channel?: Channel; destination?: string; purpose?: Purpose; code?: string };
  if (!destination || !code || !['email', 'sms'].includes(channel ?? '') || !['signup', 'login', 'password-reset'].includes(purpose ?? '')) return res.status(400).json({ error: 'Invalid verification request.' });
  const subject = channel === 'sms' ? normalizePhone(destination) : normalizeEmail(destination);
  if (!subject) return res.status(400).json({ error: 'Invalid verification destination.' });
  try {
    if (channel === 'sms') {
      if (!(await smsOtpProvider.verifyOtp(subject, code))) return res.status(400).json({ error: 'That verification code is invalid or expired.' });
    } else {
      const otpKey = key(channel, subject); const record = emailOtps.get(otpKey);
      if (!record || record.purpose !== purpose || record.expiresAt <= Date.now()) return res.status(400).json({ error: 'That verification code is invalid or expired.' });
      if (record.attempts >= 5) return res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' });
      record.attempts += 1;
      if (!(await bcrypt.compare(code, record.hash))) return res.status(400).json({ error: 'That verification code is incorrect.' });
      emailOtps.delete(otpKey);
    }
    return res.json({ verified: true, verificationToken: issueVerifiedToken(channel, subject, purpose) });
  } catch { return res.status(503).json({ error: 'Unable to verify the code. Please try again.' }); }
});

app.post('/auth/signup', async (req, res) => {
  const { name, email, phone, password, verificationToken } = req.body as { name?: string; email?: string; phone?: string; password?: string; verificationToken?: string };
  const normalizedEmail = email ? normalizeEmail(email) : undefined; const normalizedPhone = phone ? normalizePhone(phone) : undefined;
  const channel: Channel | null = normalizedPhone ? 'sms' : normalizedEmail ? 'email' : null; const subject = normalizedPhone ?? normalizedEmail;
  if (!name?.trim() || !password || password.length < 8 || !channel || !subject || !verificationToken) return res.status(400).json({ error: 'Name, a verified email or phone number, and an 8-character password are required.' });
  if (!consumeVerifiedToken(verificationToken, channel, subject, 'signup')) return res.status(401).json({ error: 'Verification expired. Request and verify a new code.' });
  const all = await accounts(); if (all.some((account) => account.email === normalizedEmail || account.phone === normalizedPhone)) return res.status(409).json({ error: 'An account already exists for that email or phone number.' });
  const account: Account = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, phone: normalizedPhone, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString() };
  await saveAccounts([...all, account]); return res.status(201).json({ user: publicUser(account) });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }; const account = (await accounts()).find((item) => item.email === normalizeEmail(email ?? ''));
  if (!account || !password || !(await bcrypt.compare(password, account.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' });
  return res.json({ user: publicUser(account) });
});

app.post('/auth/phone-login', async (req, res) => {
  const { phone, verificationToken } = req.body as { phone?: string; verificationToken?: string }; const normalizedPhone = normalizePhone(phone ?? '');
  if (!normalizedPhone || !verificationToken || !consumeVerifiedToken(verificationToken, 'sms', normalizedPhone, 'login')) return res.status(401).json({ error: 'Verification expired. Request and verify a new code.' });
  const account = (await accounts()).find((item) => item.phone === normalizedPhone); return res.json({ registered: !!account, user: account ? publicUser(account) : undefined });
});

app.post('/auth/reset-password', async (req, res) => {
  const { email, phone, password, verificationToken } = req.body as { email?: string; phone?: string; password?: string; verificationToken?: string }; const normalizedEmail = email ? normalizeEmail(email) : undefined; const normalizedPhone = phone ? normalizePhone(phone) : undefined; const channel: Channel | null = normalizedPhone ? 'sms' : normalizedEmail ? 'email' : null; const subject = normalizedPhone ?? normalizedEmail;
  if (!password || password.length < 8 || !channel || !subject || !verificationToken) return res.status(400).json({ error: 'A verified email or phone number and an 8-character password are required.' });
  if (!consumeVerifiedToken(verificationToken, channel, subject, 'password-reset')) return res.status(401).json({ error: 'Verification expired. Request and verify a new code.' });
  const all = await accounts(); const index = all.findIndex((account) => channel === 'sms' ? account.phone === subject : account.email === subject); if (index < 0) return res.status(404).json({ error: 'No account was found for that contact.' });
  all[index] = { ...all[index], passwordHash: await bcrypt.hash(password, 12) }; await saveAccounts(all); return res.json({ reset: true });
});

app.listen(port, () => console.log(`FoodLoop auth server listening on ${port}`));
