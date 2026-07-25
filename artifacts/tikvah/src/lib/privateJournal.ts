import type { EmotionAnalysis } from './emotions';
import { analyzeEmotion } from './emotions';

const JOURNAL_STORAGE_KEY = 'tikvah-private-journal-v1';
const JOURNAL_KEY_STORAGE_KEY = 'tikvah-private-journal-key-v1';
const LEGACY_STORAGE_KEY = 'tikvah-entries';

export type JournalEntry = {
  id: string;
  text: string;
  timestamp: string;
  anonymousId: string;
  emotion?: EmotionAnalysis;
};

type JournalPayload = {
  anonymousId: string;
  entries: JournalEntry[];
};

type EncryptedJournal = {
  version: 1;
  iv: string;
  ciphertext: string;
};

type LegacyEntry = {
  id?: number;
  text?: string;
  date?: string;
};

function toBase64(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  view.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function requireCrypto() {
  if (!window.crypto?.subtle || !window.crypto.getRandomValues) {
    throw new Error('Private journal encryption is not available in this browser.');
  }
  return window.crypto;
}

async function getEncryptionKey() {
  const cryptoApi = requireCrypto();
  const savedKey = localStorage.getItem(JOURNAL_KEY_STORAGE_KEY);

  if (savedKey) {
    return cryptoApi.subtle.importKey(
      'raw',
      fromBase64(savedKey),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  const key = await cryptoApi.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const rawKey = await cryptoApi.subtle.exportKey('raw', key);
  localStorage.setItem(JOURNAL_KEY_STORAGE_KEY, toBase64(rawKey));
  return key;
}

function createAnonymousId() {
  const cryptoApi = requireCrypto();
  return `anon-${cryptoApi.randomUUID()}`;
}

export async function readPrivateJournal(): Promise<JournalPayload> {
  const encrypted = localStorage.getItem(JOURNAL_STORAGE_KEY);

  if (encrypted) {
    const record = JSON.parse(encrypted) as EncryptedJournal;
    const key = await getEncryptionKey();
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(record.iv) },
      key,
      fromBase64(record.ciphertext),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as JournalPayload;
    const entries = payload.entries.map(entry => (
      entry.emotion ? entry : { ...entry, emotion: analyzeEmotion(entry.text) }
    ));
    if (entries.some((entry, index) => entry !== payload.entries[index])) {
      const upgradedPayload = { ...payload, entries };
      await writePrivateJournal(upgradedPayload);
      return upgradedPayload;
    }
    return payload;
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) {
    return { anonymousId: createAnonymousId(), entries: [] };
  }

  const legacyEntries = JSON.parse(legacy) as LegacyEntry[];
  const anonymousId = createAnonymousId();
  const entries: JournalEntry[] = legacyEntries
    .filter(entry => typeof entry.text === 'string' && entry.text.trim())
    .map(entry => {
      const parsedDate = entry.date ? new Date(entry.date) : new Date();
      const timestamp = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();
      return {
        id: `entry-${entry.id ?? window.crypto.randomUUID()}`,
        text: entry.text!.trim(),
        timestamp,
        anonymousId,
        emotion: analyzeEmotion(entry.text!.trim()),
      };
    });

  const payload = { anonymousId, entries };
  await writePrivateJournal(payload);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return payload;
}

export async function writePrivateJournal(payload: JournalPayload) {
  const cryptoApi = requireCrypto();
  const key = await getEncryptionKey();
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await cryptoApi.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  );
  const record: EncryptedJournal = {
    version: 1,
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(record));
}

export function createJournalEntry(text: string, anonymousId: string): JournalEntry {
  const cryptoApi = requireCrypto();
  return {
    id: `entry-${cryptoApi.randomUUID()}`,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    anonymousId,
  };
}

export function clearPrivateJournal() {
  localStorage.removeItem(JOURNAL_STORAGE_KEY);
  localStorage.removeItem(JOURNAL_KEY_STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}