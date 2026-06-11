import { createInterface } from "readline/promises";

function rl() {
  return createInterface({ input: process.stdin, output: process.stderr });
}

export function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stderr.isTTY);
}

export async function promptText(question: string): Promise<string> {
  const iface = rl();
  try {
    return (await iface.question(`${question} `)).trim();
  } finally {
    iface.close();
  }
}

export async function promptConfirm(
  question: string,
  defaultYes = false
): Promise<boolean> {
  const answer = await promptText(`${question} ${defaultYes ? "(Y/n)" : "(y/N)"}`);
  if (!answer) return defaultYes;
  return /^y(es)?$/i.test(answer);
}

/** Numbered-list selection; returns the chosen index. */
export async function promptSelect(
  question: string,
  choices: string[]
): Promise<number> {
  console.error(`\n${question}`);
  choices.forEach((choice, i) => {
    console.error(`  ${i + 1}. ${choice}`);
  });
  for (;;) {
    const answer = await promptText(`Enter a number (1-${choices.length}):`);
    const n = Number.parseInt(answer, 10);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
      return n - 1;
    }
    console.error(`Please enter a number between 1 and ${choices.length}.`);
  }
}
