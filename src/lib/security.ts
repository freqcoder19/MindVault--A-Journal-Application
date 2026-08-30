import { SecurityAuditLog } from '../types';

// Convert string to UTF-8 buffer
function str2buf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert buffer to string
function buf2str(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Derive a strong AES-GCM key from user passkey
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext with AES-GCM
export async function encryptText(plaintext: string, passkey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passkey, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    str2buf(plaintext)
  );

  // Pack salt + iv + ciphertext as Base64
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return `VAULT_V1:${saltHex}:${ivHex}:${cipherB64}`;
}

// Decrypt ciphertext with AES-GCM
export async function decryptText(encryptedBlob: string, passkey: string): Promise<string> {
  if (!encryptedBlob.startsWith('VAULT_V1:')) {
    throw new Error('Unrecognized vault encryption payload format');
  }

  const parts = encryptedBlob.split(':');
  if (parts.length !== 4) {
    throw new Error('Malformed vault payload');
  }

  const saltHex = parts[1];
  const ivHex = parts[2];
  const cipherB64 = parts[3];

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const binaryCipher = atob(cipherB64);
  const cipherBytes = new Uint8Array(binaryCipher.length);
  for (let i = 0; i < binaryCipher.length; i++) {
    cipherBytes[i] = binaryCipher.charCodeAt(i);
  }

  const key = await deriveKey(passkey, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes
  );

  return buf2str(decrypted);
}

// Hash passkey for local PIN verification
export async function hashPasskey(passkey: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', str2buf(passkey));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize user prompt to prevent accidental secret leakage
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // strip raw script angle brackets
    .trim();
}
