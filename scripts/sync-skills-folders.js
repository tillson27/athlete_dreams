#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, '.ai', 'skills');
const destinations = [
  path.join(repoRoot, '.claude', 'skills'),
  path.join(repoRoot, '.codex', 'skills')
];

const README_CONTENT = `> **NOTE:** This directory is auto-generated from \`.ai/skills/\`.
> Do not edit files here directly; edit the source in \`.ai/skills/\` and run \`node scripts/sync-skills-folders.js\`.
`;

async function syncSkills() {
  // Verify source exists
  try {
    await fs.stat(sourceDir);
  } catch {
    console.error('.ai/skills/ does not exist. Create it first.');
    process.exitCode = 1;
    return;
  }

  for (const destDir of destinations) {
    // Clear and recreate destination
    await fs.rm(destDir, { recursive: true, force: true });
    await fs.mkdir(destDir, { recursive: true });

    // Copy source to destination
    await fs.cp(sourceDir, destDir, { recursive: true });

    // Add README to each skill subdirectory
    const entries = await fs.readdir(destDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await fs.writeFile(path.join(destDir, entry.name, 'README.md'), README_CONTENT);
      }
    }

    console.log(`Synced .ai/skills/ -> ${path.relative(repoRoot, destDir)}/`);
  }
}

syncSkills().catch((error) => {
  console.error('Failed to sync skills:', error.message);
  process.exitCode = 1;
});
