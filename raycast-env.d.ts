/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Worktree Root - Directory where new worktrees are created. */
  "worktreeRoot": string,
  /** Default Repo Root - Path to the git repo to worktree from (defaults to CWD of most recent). */
  "repoRoot": string,
  /** Terminal - Where to launch Claude. */
  "terminal": "warp" | "terminal" | "iterm"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `new-session` command */
  export type NewSession = ExtensionPreferences & {}
  /** Preferences accessible in the `list-sessions` command */
  export type ListSessions = ExtensionPreferences & {}
  /** Preferences accessible in the `resume-session` command */
  export type ResumeSession = ExtensionPreferences & {}
  /** Preferences accessible in the `cleanup-sessions` command */
  export type CleanupSessions = ExtensionPreferences & {}
  /** Preferences accessible in the `diff-worktrees` command */
  export type DiffWorktrees = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `new-session` command */
  export type NewSession = {}
  /** Arguments passed to the `list-sessions` command */
  export type ListSessions = {}
  /** Arguments passed to the `resume-session` command */
  export type ResumeSession = {}
  /** Arguments passed to the `cleanup-sessions` command */
  export type CleanupSessions = {}
  /** Arguments passed to the `diff-worktrees` command */
  export type DiffWorktrees = {}
}

