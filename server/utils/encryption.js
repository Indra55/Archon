const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY environment variable is required");
    }
    // Ensure key is 32 bytes (256 bits)
    return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64 string: iv:encrypted:tag
 */
function encrypt(plaintext) {
    if (!plaintext) return null;
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    // Store as iv:encrypted:tag (all hex)
    return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;
    const key = getEncryptionKey();
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

module.exports = { encrypt, decrypt };
