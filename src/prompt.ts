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

/**
 * Numbered-list multi-selection; returns the chosen indices.
 * Empty input accepts the preselected defaults.
 */
export async function promptMultiSelect(
  question: string,
  choices: string[],
  preselected: number[]
): Promise<number[]> {
  console.error(`\n${question}`);
  choices.forEach((choice, i) => {
    const mark = preselected.includes(i) ? "x" : " ";
    console.error(`  ${i + 1}. [${mark}] ${choice}`);
  });
  for (;;) {
    const answer = await promptText(
      `Enter numbers separated by commas, "a" for all, or press Enter for the defaults:`
    );
    if (!answer) return preselected;
    if (/^a(ll)?$/i.test(answer)) return choices.map((_, i) => i);
    const parts = answer.split(/[\s,]+/).filter(Boolean);
    const indices = parts.map((p) => Number.parseInt(p, 10) - 1);
    if (
      indices.length > 0 &&
      indices.every((i) => Number.isInteger(i) && i >= 0 && i < choices.length)
    ) {
      return [...new Set(indices)].sort();
    }
    console.error(`Please enter numbers between 1 and ${choices.length}, separated by commas.`);
  }
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
