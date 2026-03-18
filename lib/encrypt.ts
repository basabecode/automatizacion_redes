import crypto from 'crypto'

/**
 * Derive a 32-byte AES key from NEXTAUTH_SECRET using SHA-256.
 * This ensures the key is always exactly 256 bits regardless of secret length.
 */
function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET no está configurado. No se pueden cifrar ni descifrar tokens.')
  return crypto.createHash('sha256').update(secret).digest()
}

const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a plain-text string using AES-256-GCM.
 * Returns a colon-separated hex string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypts a value previously encrypted with `encrypt()`.
 * Returns the original plain-text string.
 */
export function decrypt(encoded: string): string {
  const parts = encoded.split(':')
  if (parts.length !== 3) {
    // Might be an old plain-text token — return as-is (backward compat)
    return encoded
  }
  const [ivHex, tagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

/**
 * Returns true if the value looks like an encrypted token (iv:tag:cipher).
 */
export function isEncrypted(value: string): boolean {
  return value.split(':').length === 3
}
