import { hostname, platform } from "os";
import { spawn } from "child_process";

interface DeviceAuthStartResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryOpenBrowser(url: string): boolean {
  const commands: Record<string, [string, string[]]> = {
    darwin: ["open", [url]],
    linux: ["xdg-open", [url]],
    win32: ["cmd", ["/c", "start", "", url]],
  };
  const cmd = commands[platform()];
  if (!cmd) return false;
  try {
    const child = spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch (_) {
    return false;
  }
}

async function postJson(
  baseUrl: string,
  path: string,
  body: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(baseUrl + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try {
    if (text) json = JSON.parse(text);
  } catch (_) {}
  return { status: res.status, json };
}

/**
 * RFC 8628 device-authorization flow. Prints the user code + verification URL,
 * optionally opens a browser, then polls until approved/denied/expired.
 * Returns the issued CLI token.
 */
export async function runDeviceFlow(
  baseUrl: string,
  opts: { noBrowser?: boolean } = {}
): Promise<string> {
  const start = await postJson(baseUrl, "/api/cli/device-auth", {
    clientName: `magnet CLI on ${hostname()}`,
  });
  if (start.status !== 200) {
    throw new Error(
      `Failed to start login: ${start.json?.error ?? `HTTP ${start.status}`}`
    );
  }
  const auth = start.json as DeviceAuthStartResponse;

  console.error(`\n  Confirm code ${auth.user_code} to log in.\n`);

  let browserOpened = false;
  if (!opts.noBrowser) {
    browserOpened = tryOpenBrowser(auth.verification_uri_complete);
  }
  if (browserOpened) {
    console.error(`  Opening ${auth.verification_uri_complete} ...`);
  } else {
    console.error(`  On any device, visit:`);
    console.error(`    ${auth.verification_uri}`);
    console.error(`  and enter code ${auth.user_code}`);
  }
  console.error(`\n  Waiting for approval (Ctrl+C to cancel)...`);

  const deadline = Date.now() + auth.expires_in * 1000;
  let intervalMs = auth.interval * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);
    const poll = await postJson(baseUrl, "/api/cli/device-auth/token", {
      device_code: auth.device_code,
    });

    if (poll.status === 200 && poll.json?.access_token) {
      return poll.json.access_token as string;
    }

    switch (poll.json?.error) {
      case "authorization_pending":
        continue;
      case "slow_down":
        intervalMs =
          (typeof poll.json.interval === "number"
            ? poll.json.interval
            : auth.interval + 5) * 1000;
        continue;
      case "access_denied":
        throw new Error("Login request was denied in the browser.");
      case "expired_token":
        throw new Error("Login timed out. Run magnet login to try again.");
      default:
        throw new Error(
          `Login failed: ${poll.json?.error ?? `HTTP ${poll.status}`}`
        );
    }
  }
  throw new Error("Login timed out. Run magnet login to try again.");
}
