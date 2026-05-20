#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const agentsMdHeader = require('./agents-md-header');

const repoRoot = path.resolve(__dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', '.next', 'out', 'coverage', 'build']);

const aiDocContent =
    '# USE @AGENTS.md (`AGENTS.md`)\n\n' +
    '* USE @AGENTS.md (`AGENTS.md`).\n' +
    '* AGENTS.md documents are hierarchical and additive: apply the closest `AGENTS.md` to the file(s) you are editing plus all parent `AGENTS.md` files up to the repo root.\n' +
    '* On conflicts, the most specific document wins: **file/dir-level > package/root-level (e.g., app/) > repo root**.\n' +
    '* Common roots with their own `AGENTS.md`: `app/`, `client/`, `common/`, `cdk/`, etc.\n';

async function collectAgents(startDir) {
  const agents = [];
  const stack = [startDir];

  while (stack.length) {
    const currentDir = stack.pop();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) continue;
        stack.push(path.join(currentDir, entry.name));
        continue;
      }

      if (entry.isFile() && entry.name === 'AGENTS.md') {
        agents.push(path.join(currentDir, entry.name));
      }
    }
  }

  return agents;
}

async function syncAgentInstructionFiles(agentsPath) {
  const baseDir = path.dirname(agentsPath);
  const claudePath = path.join(baseDir, 'CLAUDE.md');
  const geminiPath = path.join(baseDir, 'GEMINI.md');
  await Promise.all([
    fs.writeFile(claudePath, aiDocContent, 'utf8'),
    fs.writeFile(geminiPath, aiDocContent, 'utf8')
  ]);
}

async function main() {
  console.log('agents-md-header: injecting precedence headers');
  agentsMdHeader.main();
  console.log('');

  const agentsFiles = await collectAgents(repoRoot);

  await Promise.all(agentsFiles.map(syncAgentInstructionFiles));
  console.log(`Synced ${agentsFiles.length} AGENTS.md files to CLAUDE.md and GEMINI.md`);
}

main().catch((error) => {
  console.error('Failed to sync AGENTS.md to CLAUDE.md and GEMINI.md', error);
  process.exitCode = 1;
});
