export interface StoredUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  isOwner?: boolean;
  role?: string;
  expiresAt: number;
}

const STORAGE_KEY = 'bakery-user';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function saveUser(user: Omit<StoredUser, 'expiresAt'>, ttlMs = DEFAULT_TTL) {
  const data: StoredUser = { ...user, expiresAt: Date.now() + ttlMs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUser(): StoredUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data: StoredUser = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}
