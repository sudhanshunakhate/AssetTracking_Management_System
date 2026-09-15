/**
 * Encrypts sensitive auth payloads with the server RSA-OAEP-256 public key
 * so DevTools Network shows ciphertext instead of plaintext credentials.
 *
 * Uses Web Crypto when available (HTTPS / localhost). Falls back to node-forge
 * on plain HTTP LAN hosts where browsers leave crypto.subtle undefined.
 */

import forge from 'node-forge'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

type PublicKeyResponse = {
  alg: string
  publicKey: string
  keySize: number
}

type SubtleKeyCache = { kind: 'subtle'; key: CryptoKey }
type ForgeKeyCache = { kind: 'forge'; key: forge.pki.rsa.PublicKey; spkiB64: string }

let cachedKey: SubtleKeyCache | ForgeKeyCache | null = null
let keyFetch: Promise<SubtleKeyCache | ForgeKeyCache> | null = null

function hasSubtleCrypto(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined'
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(bin)
}

function randomNonce(): string {
  const buf = new Uint8Array(16)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

function spkiBase64ToForgePublicKey(spkiB64: string): forge.pki.rsa.PublicKey {
  const der = forge.util.decode64(spkiB64)
  const asn1 = forge.asn1.fromDer(der)
  return forge.pki.publicKeyFromAsn1(asn1) as forge.pki.rsa.PublicKey
}

async function fetchPublicKeyMaterial(): Promise<SubtleKeyCache | ForgeKeyCache> {
  if (cachedKey) return cachedKey
  if (keyFetch) return keyFetch
  keyFetch = (async () => {
    const res = await fetch(`${API_BASE}/auth/public-key`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      keyFetch = null
      throw new Error('Unable to load encryption key')
    }
    const body = (await res.json()) as PublicKeyResponse
    if (!body.publicKey) {
      keyFetch = null
      throw new Error('Encryption key response was empty')
    }

    if (hasSubtleCrypto()) {
      const spki = Uint8Array.from(atob(body.publicKey), (c) => c.charCodeAt(0))
      const key = await crypto.subtle.importKey(
        'spki',
        spki,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
      )
      cachedKey = { kind: 'subtle', key }
    } else {
      cachedKey = {
        kind: 'forge',
        key: spkiBase64ToForgePublicKey(body.publicKey),
        spkiB64: body.publicKey,
      }
    }
    keyFetch = null
    return cachedKey
  })()
  return keyFetch
}

/** Clears cached key (e.g. after server restart when decrypt fails). */
export function clearPayloadPublicKeyCache() {
  cachedKey = null
  keyFetch = null
}

function encryptWithForge(publicKey: forge.pki.rsa.PublicKey, plainUtf8: string): string {
  const encrypted = publicKey.encrypt(plainUtf8, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  })
  return forge.util.encode64(encrypted)
}

export async function encryptAuthPayload(fields: Record<string, string>): Promise<{ cipher: string }> {
  const material = await fetchPublicKeyMaterial()
  const plain = JSON.stringify({
    ...fields,
    ts: Date.now(),
    nonce: randomNonce(),
  })

  try {
    if (material.kind === 'subtle') {
      const encoded = new TextEncoder().encode(plain)
      const cipherBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, material.key, encoded)
      return { cipher: bytesToBase64(cipherBuf) }
    }
    return { cipher: encryptWithForge(material.key, plain) }
  } catch {
    // Key may be stale after backend restart — refetch once.
    clearPayloadPublicKeyCache()
    const fresh = await fetchPublicKeyMaterial()
    if (fresh.kind === 'subtle') {
      const encoded = new TextEncoder().encode(plain)
      const cipherBuf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, fresh.key, encoded)
      return { cipher: bytesToBase64(cipherBuf) }
    }
    return { cipher: encryptWithForge(fresh.key, plain) }
  }
}
