import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error("ENCRYPTION_KEY or NEXTAUTH_SECRET must be set");
  }
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns a base64 string containing: iv + authTag + ciphertext
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + ciphertext into a single base64 string
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);
    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback: return plain text if encryption fails
  }
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Expects base64 input: iv (16) + authTag (16) + ciphertext
 */
export function decrypt(encryptedText: string): string {
  try {
    // If it looks like a URL (not encrypted), return as-is
    if (encryptedText.startsWith("http://") || encryptedText.startsWith("https://")) {
      return encryptedText;
    }

    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, "base64");

    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const ciphertext = combined.subarray(32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedText; // Fallback: return as-is if decryption fails
  }
}

/**
 * Encrypt all document URL fields in an object.
 * Only encrypts non-empty string values that look like URLs.
 */
export function encryptDocUrls(obj: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string" && result[field].startsWith("http")) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypt all document URL fields in an object.
 * Only decrypts non-empty string values that don't look like URLs.
 */
export function decryptDocUrls(obj: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string" && !result[field].startsWith("http")) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}
