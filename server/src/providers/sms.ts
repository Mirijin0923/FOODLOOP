/**
 * Provider boundary for Philippine-compatible SMS services.
 * Implement this interface for Semaphore, Vonage, Globe Labs, etc. without
 * changing the authentication routes or Expo client.
 */
export type SmsOtpProvider = {
  sendOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
};

class SmsProviderNotConfiguredError extends Error {
  constructor() {
    super('SMS verification is not configured yet. Please use email verification or configure an SMS provider.');
    this.name = 'SmsProviderNotConfiguredError';
  }
}

const unconfiguredSmsProvider: SmsOtpProvider = {
  async sendOtp() { throw new SmsProviderNotConfiguredError(); },
  async verifyOtp() { throw new SmsProviderNotConfiguredError(); },
};

// Replace only this export after choosing a provider. Credentials stay in
// server/.env and the rest of the OTP architecture remains unchanged.
export const smsOtpProvider: SmsOtpProvider = unconfiguredSmsProvider;
