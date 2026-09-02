/**
 * Zero-Knowledge Client-Side Vault Encryption Utility
 * Uses Web Crypto API (AES-GCM 256-bit + PBKDF2 Key Derivation)
 * Ensures that sensitive journal entries can be encrypted client-side
 * before syncing to Firestore, with zero key leakage to any server.
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJournalData(data: any, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const jsonString = JSON.stringify(data);
  const enc = new TextEncoder();
  const plaintext = enc.encode(jsonString);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  );

  const saltHex = bufferToHex(salt.buffer);
  const ivHex = bufferToHex(iv.buffer);
  const cipherBase64 = bufferToBase64(ciphertext);

  return `VAULT_V1:${saltHex}:${ivHex}:${cipherBase64}`;
}

export async function decryptJournalData(encryptedPayload: string, passphrase: string): Promise<any> {
  if (!encryptedPayload.startsWith('VAULT_V1:')) {
    throw new Error('Invalid or unsupported vault ciphertext format');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 4) {
    throw new Error('Corrupted ciphertext envelope');
  }

  const [, saltHex, ivHex, cipherBase64] = parts;
  const salt = hexToBuffer(saltHex);
  const iv = hexToBuffer(ivHex);
  const ciphertext = base64ToBuffer(cipherBase64);

  const key = await deriveKey(passphrase, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decrypted);
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
  }
}

export async function computeSHA256Checksum(text: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return bufferToHex(hashBuffer);
}
