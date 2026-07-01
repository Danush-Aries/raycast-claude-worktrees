import { execa } from "execa";
import { homedir } from "node:os";
import { existsSync } from "node:fs";
import path from "node:path";
import { getPreferenceValues } from "@raycast/api";

export type Worktree = {
  path: string;
  head: string;
  branch: string;
  bare: boolean;
  detached: boolean;
  locked: boolean;
  prunable: boolean;
  ageDays: number;
  lastCommitDate: Date | null;
  lastCommitMessage: string;
};

type Prefs = {
  worktreeRoot?: string;
  repoRoot?: string;
  terminal?: "warp" | "terminal" | "iterm";
};

export function prefs(): Required<Prefs> {
  const p = getPreferenceValues<Prefs>();
  return {
    worktreeRoot: expandHome(p.worktreeRoot || "~/worktrees"),
    repoRoot: expandHome(p.repoRoot || ""),
    terminal: (p.terminal as Prefs["terminal"]) || "warp",
  };
}

export function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return path.join(homedir(), p.slice(2));
  return p;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `session-${Date.now()}`;
}

async function detectRepoRoot(preferred?: string): Promise<string> {
  if (preferred && existsSync(path.join(preferred, ".git"))) return preferred;
  try {
    const { stdout } = await execa("git", ["rev-parse", "--show-toplevel"], { cwd: process.env.HOME });
    return stdout.trim();
  } catch {
    return preferred || homedir();
  }
}

export async function listWorktrees(repoRoot?: string): Promise<Worktree[]> {
  const root = await detectRepoRoot(repoRoot || prefs().repoRoot);
  let stdout = "";
  try {
    const res = await execa("git", ["worktree", "list", "--porcelain"], { cwd: root });
    stdout = res.stdout;
  } catch {
    return [];
  }
  const blocks = stdout.split(/\n\n+/).filter((b) => b.trim().length > 0);
  const worktrees: Worktree[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const wt: Partial<Worktree> = { locked: false, prunable: false, detached: false, bare: false };
    for (const line of lines) {
      if (line.startsWith("worktree ")) wt.path = line.slice("worktree ".length).trim();
      else if (line.startsWith("HEAD ")) wt.head = line.slice("HEAD ".length).trim();
      else if (line.startsWith("branch ")) wt.branch = line.slice("branch ".length).trim();
      else if (line === "bare") wt.bare = true;
      else if (line === "detached") wt.detached = true;
      else if (line.startsWith("locked")) wt.locked = true;
      else if (line.startsWith("prunable")) wt.prunable = true;
    }
    if (!wt.path) continue;
    const meta = await getLastCommit(wt.path);
    worktrees.push({
      path: wt.path,
      head: wt.head || "",
      branch: wt.branch || "(detached)",
      bare: wt.bare || false,
      detached: wt.detached || false,
      locked: wt.locked || false,
      prunable: wt.prunable || false,
      ageDays: meta.ageDays,
      lastCommitDate: meta.date,
      lastCommitMessage: meta.subject,
    });
  }
  return worktrees;
}

async function getLastCommit(worktreePath: string): Promise<{ ageDays: number; date: Date | null; subject: string }> {
  try {
    const { stdout } = await execa("git", ["log", "-1", "--format=%ct%n%s"], { cwd: worktreePath });
    const [tsRaw, ...subjParts] = stdout.split("\n");
    const ts = parseInt(tsRaw, 10);
    if (isNaN(ts)) return { ageDays: 0, date: null, subject: "" };
    const date = new Date(ts * 1000);
    const ageDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return { ageDays, date, subject: subjParts.join("\n").trim() };
  } catch {
    return { ageDays: 0, date: null, subject: "" };
  }
}

export async function createWorktree(opts: {
  taskName: string;
  branchName?: string;
  repoRoot?: string;
}): Promise<{ worktreePath: string; branch: string }> {
  const slug = slugify(opts.branchName || opts.taskName);
  const p = prefs();
  const root = await detectRepoRoot(opts.repoRoot || p.repoRoot);
  const worktreePath = path.join(p.worktreeRoot, slug);
  const branch = `feat/${slug}`;

  await execa("mkdir", ["-p", p.worktreeRoot]);

  if (existsSync(worktreePath)) {
    throw new Error(`Worktree path already exists: ${worktreePath}`);
  }

  await execa("git", ["worktree", "add", "-b", branch, worktreePath, "HEAD"], { cwd: root });

  return { worktreePath, branch };
}

export async function removeWorktree(worktreePath: string, repoRoot?: string): Promise<void> {
  const root = await detectRepoRoot(repoRoot || prefs().repoRoot);
  if (isDangerousPath(worktreePath)) {
    throw new Error(`Refusing to remove suspicious path: ${worktreePath}`);
  }
  await execa("git", ["worktree", "remove", "--force", worktreePath], { cwd: root });
}

function isDangerousPath(p: string): boolean {
  const abs = path.resolve(p);
  const home = homedir();
  if (abs === "/" || abs === home) return true;
  if (abs.length < home.length) return true;
  return false;
}

export async function launchInTerminal(worktreePath: string, command = "claude"): Promise<void> {
  const p = prefs();
  const abs = path.resolve(worktreePath);
  const warpInstalled = existsSync("/Applications/Warp.app");

  if (p.terminal === "warp" && warpInstalled) {
    const url = `warp://action/new_tab?path=${encodeURIComponent(abs)}`;
    await execa("open", [url]);
    setTimeout(() => {
      execa("osascript", [
        "-e",
        `tell application "System Events" to keystroke "${command.replace(/"/g, '\\"')}"`,
      ]).catch(() => undefined);
      setTimeout(() => {
        execa("osascript", ["-e", `tell application "System Events" to key code 36`]).catch(() => undefined);
      }, 250);
    }, 600);
    return;
  }

  if (p.terminal === "iterm" && existsSync("/Applications/iTerm.app")) {
    const script = `
      tell application "iTerm"
        create window with default profile
        tell current session of current window
          write text "cd ${escapeAppleScript(abs)} && ${command}"
        end tell
      end tell
    `;
    await execa("osascript", ["-e", script]);
    return;
  }

  const script = `
    tell application "Terminal"
      activate
      do script "cd ${escapeAppleScript(abs)} && ${command}"
    end tell
  `;
  await execa("osascript", ["-e", script]);
}

function escapeAppleScript(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function openInEditor(worktreePath: string, editor: "cursor" | "code" | "finder"): Promise<void> {
  const abs = path.resolve(worktreePath);
  if (editor === "finder") {
    await execa("open", [abs]);
    return;
  }
  await execa("open", ["-a", editor === "cursor" ? "Cursor" : "Visual Studio Code", abs]);
}
