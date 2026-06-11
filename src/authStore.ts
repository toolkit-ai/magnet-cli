import { mkdir, readFile, writeFile, chmod } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface StoredCredential {
  token: string;
  userEmail?: string;
  createdAt: string;
}

interface AuthFile {
  version: 1;
  credentials: Record<string, StoredCredential>;
}

const AUTH_DIR = join(homedir(), ".magnet");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

async function readAuthFile(): Promise<AuthFile> {
  try {
    const raw = await readFile(AUTH_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.credentials) {
      return parsed as AuthFile;
    }
  } catch (_) {}
  return { version: 1, credentials: {} };
}

async function writeAuthFile(data: AuthFile): Promise<void> {
  await mkdir(AUTH_DIR, { recursive: true, mode: 0o700 });
  await writeFile(AUTH_FILE, JSON.stringify(data, null, 2) + "\n", {
    mode: 0o600,
  });
  // mkdir/writeFile modes are ignored if the path already exists
  await chmod(AUTH_FILE, 0o600);
}

export async function getStoredCredential(
  baseUrl: string
): Promise<StoredCredential | null> {
  const data = await readAuthFile();
  return data.credentials[baseUrl] ?? null;
}

export async function saveCredential(
  baseUrl: string,
  credential: Omit<StoredCredential, "createdAt">
): Promise<void> {
  const data = await readAuthFile();
  data.credentials[baseUrl] = {
    ...credential,
    createdAt: new Date().toISOString(),
  };
  await writeAuthFile(data);
}

export async function removeCredential(baseUrl: string): Promise<boolean> {
  const data = await readAuthFile();
  if (!data.credentials[baseUrl]) return false;
  delete data.credentials[baseUrl];
  await writeAuthFile(data);
  return true;
}

export function authFilePath(): string {
  return AUTH_FILE;
}
