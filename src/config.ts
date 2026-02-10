const DEFAULT_BASE_URL = "https://www.magnet.run";
const DEFAULT_LIST_LIMIT = 50;

const API_KEY_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function getApiKeyOrError(): string | Error {
  const key = (process.env.MAGNET_API_KEY ?? "").trim();
  if (!key) return new Error("missing Magnet API key. Set MAGNET_API_KEY");
  if (!API_KEY_REGEX.test(key))
    return new Error(
      "invalid MAGNET_API_KEY: must be a valid UUID (e.g. xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)"
    );
  return key;
}

export function getApiKey(): string {
  const key = getApiKeyOrError();
  if (key instanceof Error) {
    console.error(key.message);
    process.exit(1);
  }
  return key;
}

export function getBaseUrl(): string {
  let u = process.env.MAGNET_API_URL ?? DEFAULT_BASE_URL;
  u = u.trim().replace(/\/+$/, "");
  return u;
}

export const DEFAULT_LIST_LIMIT_VALUE = DEFAULT_LIST_LIMIT;
