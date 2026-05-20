#!/usr/bin/env node

/**
 * agents-md-header.js — Inject/update the Instruction Precedence header
 * at the top of every AGENTS.md in the brain repo.
 *
 * The header is auto-generated based on the file's position in the directory
 * tree. It builds the chain from the file itself up to the repo root AGENTS.md.
 *
 * Called standalone or from sync-ai.js.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".next",
  "out",
  "coverage",
  "build",
]);

const HEADER_START = "> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**";
const SEPARATOR = "\n\n---\n\n";

/**
 * Build the chain of AGENTS.md files from the given file up to repo root.
 * Returns array from most specific (this file) to least specific (root).
 */
function buildChain(agentsPath) {
  const chain = [];
  let dir = path.dirname(agentsPath);

  while (true) {
    const candidate = path.join(dir, "AGENTS.md");
    if (fs.existsSync(candidate)) {
      const rel = path.relative(REPO_ROOT, candidate);
      chain.push(rel === "AGENTS.md" ? rel : rel);
    }
    if (dir === REPO_ROOT) break;
    dir = path.dirname(dir);
  }

  return chain;
}

/**
 * Format a chain entry for display.
 */
function formatChainEntry(relPath, isThisFile) {
  if (relPath === "AGENTS.md") {
    return "`AGENTS.md` _(root)_";
  }
  if (isThisFile) {
    return `\`${relPath}\` _(this file)_`;
  }
  return `\`${relPath}\``;
}

/**
 * Generate the header block for a given AGENTS.md file.
 */
function generateHeader(agentsPath) {
  const chain = buildChain(agentsPath);
  const thisRel = path.relative(REPO_ROOT, agentsPath);
  const isRoot = thisRel === "AGENTS.md";

  const chainStr = isRoot
    ? "`AGENTS.md` _(root — this file)_"
    : chain.map((rel, i) => formatChainEntry(rel, i === 0)).join(" > ");

  const description = isRoot
    ? "This is the repo root `AGENTS.md`. All other `AGENTS.md` files inherit from this one. Most specific wins on conflict."
    : "Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.";

  const lines = [
    HEADER_START,
    ">",
    `> ${description}`,
    ">",
    `> **Chain:** ${chainStr}`,
  ];

  return lines.join("\n");
}

/**
 * Strip existing header from content if present.
 */
function stripHeader(content) {
  if (content.startsWith(HEADER_START)) {
    const sepIndex = content.indexOf("\n---\n");
    if (sepIndex !== -1) {
      let afterSep = sepIndex + "\n---\n".length;
      while (afterSep < content.length && content[afterSep] === "\n") {
        afterSep++;
      }
      return content.slice(afterSep);
    }
  }
  return content;
}

/**
 * Process a single AGENTS.md file: inject or update the header.
 */
function processFile(agentsPath) {
  let content = fs.readFileSync(agentsPath, "utf8");
  const stripped = stripHeader(content);
  const header = generateHeader(agentsPath);
  const newContent = header + SEPARATOR + stripped;

  if (newContent !== content) {
    fs.writeFileSync(agentsPath, newContent, "utf8");
    return true;
  }
  return false;
}

/**
 * Find all AGENTS.md files in the repo.
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
        stack.push(path.join(currentDir, entry.name));
        continue;
      }

      if (entry.isFile() && entry.name === "AGENTS.md") {
        results.push(path.join(currentDir, entry.name));
      }
    }
  }

  return results;
}

function main() {
  const files = collectAgentsFiles(REPO_ROOT);
  let updated = 0;

  for (const file of files) {
    const wasUpdated = processFile(file);
    const rel = path.relative(REPO_ROOT, file);
    if (wasUpdated) {
      console.log(`  updated: ${rel}`);
      updated++;
    } else {
      console.log(`  ok: ${rel}`);
    }
  }

  console.log(`\n  → ${updated}/${files.length} AGENTS.md file(s) updated`);
  return updated;
}

if (require.main === module) {
  console.log("agents-md-header: injecting precedence headers");
  main();
} else {
  module.exports = { main, processFile, collectAgentsFiles };
}
