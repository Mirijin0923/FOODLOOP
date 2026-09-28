const baseUrl = process.env.EXPO_PUBLIC_AUTH_API_URL;
export type Channel = 'email' | 'sms';
export type Purpose = 'signup' | 'login' | 'password-reset';
type ApiError = Error & { status?: number };

async function call<T>(path: string, body: object): Promise<T> {
  if (!baseUrl) throw new Error('Authentication service is not configured. Set EXPO_PUBLIC_AUTH_API_URL.');
  let response: Response;
  try { response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  catch { throw new Error('Network error. Check your connection and try again.'); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(payload.error ?? 'Request failed.') as ApiError; error.status = response.status; throw error; }
  return payload as T;
}
export const authApi = {
  sendOtp: (channel: Channel, destination: string, purpose: Purpose) => call<{ resendAfterSeconds: number }>('/auth/otp/send', { channel, destination, purpose }),
  verifyOtp: (channel: Channel, destination: string, purpose: Purpose, code: string) => call<{ verificationToken: string }>('/auth/otp/verify', { channel, destination, purpose, code }),
  signup: (data: object) => call<{ user: { name: string; email?: string; phone?: string } }>('/auth/signup', data),
  login: (email: string, password: string) => call<{ user: { name: string; email?: string; phone?: string } }>('/auth/login', { email, password }),
  phoneLogin: (phone: string, verificationToken: string) => call<{ registered: boolean; user?: { name: string; email?: string; phone?: string } }>('/auth/phone-login', { phone, verificationToken }),
  resetPassword: (data: object) => call('/auth/reset-password', data),
};
