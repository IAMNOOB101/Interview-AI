import speakeasy from "speakeasy";
import QRCode from "qrcode";

const APP_NAME = "InterviewAI";

/**
 * Generate a new TOTP secret for a user.
 * Returns the secret (store in DB) and a QR code data URL for the frontend.
 */
export const generateTotpSecret = async (userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${userEmail})`,
    issuer: APP_NAME,
    length: 20,
  });

  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32, // store this in users.totpSecret
    qrCode: qrCodeDataURL, // show this to user once during setup
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * Verify a 6-digit TOTP token against the stored secret.
 * window: 1 allows 30s clock drift on either side.
 */
export const verifyTotpToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: String(token),
    window: 1,
  });
};