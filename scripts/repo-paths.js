#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".next",
  "out",
  "coverage",
  "build",
]);

/**
 * Resolve the repository root for THIS checkout.
 *
 * Why: nested git worktrees (under `.claude/worktrees/`) live physically inside
 * the main checkout. A path-only `resolve(scriptDir, "..")` is correct, but
 * `git rev-parse --show-toplevel` is the authoritative source and keeps the two
 * script entry points consistent whether they run from the main checkout or a
 * worktree. Falls back to the path calculation when git is unavailable.
 */
function getRepoRoot(scriptDir) {
  try {
    const toplevel = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: scriptDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (toplevel) {
      return path.resolve(toplevel);
    }
  } catch {
    // git missing or scriptDir not in a repo — fall through to path logic.
  }
  return path.resolve(scriptDir, "..");
}

/**
 * A directory is a separate git checkout when it carries its own `.git` entry
 * (a directory for a clone, a file for a linked worktree). Pruning these below
 * the root prevents a main-checkout traversal from descending into nested
 * worktrees and mis-stamping their committed `AGENTS.md` files.
 */
function isNestedGitCheckout(dir) {
  return fs.existsSync(path.join(dir, ".git"));
}

/**
 * Collect every `AGENTS.md` that belongs to a single checkout, rooted at
 * `startDir`. Ignored build/vendor directories and nested git checkouts are
 * pruned so results never cross a worktree boundary.
 */
function collectAgentsFiles(startDir) {
  const results = [];
  const stack = [startDir];

  while (stack.length) {
    const currentDir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const childDir = path.join(currentDir, entry.name);
        if (isNestedGitCheckout(childDir)) continue;
        stack.push(childDir);
        continue;
      }

      if (entry.isFile() && entry.name === "AGENTS.md") {
        results.push(path.join(currentDir, entry.name));
      }
    }
  }

  return results;
}

module.exports = { IGNORED_DIRS, getRepoRoot, collectAgentsFiles };
