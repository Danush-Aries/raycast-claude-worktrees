# Claude Worktrees for Raycast

> Spawn, switch, and cleanup parallel Claude Code sessions in git worktrees. One keystroke.

![Raycast palette](docs/hero.png)

<!-- Placeholder: replace docs/hero.png with a real screenshot of the Raycast root search showing all 5 commands. -->

## The problem

Five half-finished branches. Three Warp tabs. Two Cursor windows. Zero idea which one was working on the auth refactor.

Running multiple Claude Code sessions in parallel is the fastest way to ship — but it turns your filesystem into a graveyard of forgotten worktrees, and your dock into a tab-cycling nightmare.

## The solution

Five Raycast commands. Every one is one keystroke away.

| Command | What it does |
| --- | --- |
| **New Session** | Prompts for a task name → creates `~/worktrees/<slug>` on a new `feat/<slug>` branch → opens a Warp tab in it and runs `claude`. |
| **List Sessions** | All worktrees with age (days since last commit), branch, status. Open in Warp, Cursor, VS Code, Finder — or delete. |
| **Resume Session** | Same list, sorted "most recent first", one-shot launch. |
| **Cleanup Sessions** | Pick a threshold (7d / 14d / 30d) → preview → nuke all at once. |
| **Diff Two Worktrees** | Pick any two → `diff -r --brief` opens in Terminal. |

## Install

Local (dev) install — the extension is not yet on the Raycast store:

1. `git clone https://github.com/Danush-Aries/raycast-claude-worktrees ~/Developer/raycast-claude-worktrees`
2. `cd ~/Developer/raycast-claude-worktrees && pnpm install` (or `npm install`)
3. `pnpm dev` — this registers the extension with Raycast in development mode.
4. Open Raycast → search "New Session" — you're in.

To keep it permanent after `pnpm dev` exits, use Raycast's **Import Extension** command and point it at this folder.

## Preferences

Open Raycast → `⌘ ,` → Extensions → Claude Worktrees:

- **Worktree Root** — where new worktrees are created (default `~/worktrees`)
- **Default Repo Root** — the repo to `git worktree add` from (blank = auto-detect)
- **Terminal** — Warp / Terminal.app / iTerm

## Demo

![Demo](docs/demo.gif)

<!-- Placeholder: 15-second screen capture of new-session → list-sessions → resume → cleanup. -->

## Requirements

- macOS (uses AppleScript to drive Warp / Terminal / iTerm)
- `git` >= 2.5
- `claude` CLI on `$PATH` (or change the command in the "New Session" form)
- Optional: [Warp](https://warp.dev), [Cursor](https://cursor.sh), [iTerm](https://iterm2.com)

## Credit

Inspired by [`sarth6/xlaude-raycast`](https://github.com/sarth6/xlaude-raycast) — go star it if you dig this workflow.

## Raycast store submission checklist

Not submitting yet, but for future me:

- [ ] Replace `assets/command-icon.png` with a 512x512 branded icon
- [ ] Add proper screenshots to `metadata/` (Raycast expects 3-6, 2000x1250)
- [ ] Fill out real `author` field with your Raycast username
- [ ] `npm run publish` (or `npx @raycast/api publish`) opens a PR against [raycast/extensions](https://github.com/raycast/extensions)
- [ ] Extension name must be unique across the store — check first
- [ ] Add `CHANGELOG.md` in the format Raycast expects
- [ ] Response to the store review may take 1–2 weeks

## License

MIT — see [LICENSE](LICENSE).
