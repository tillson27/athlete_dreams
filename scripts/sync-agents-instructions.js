#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const agentsMdHeader = require('./agents-md-header');
const { getRepoRoot, collectAgentsFiles } = require('./repo-paths');

const repoRoot = getRepoRoot(__dirname);

const aiDocContent =
    '# USE @AGENTS.md (`AGENTS.md`)\n\n' +
    '* USE @AGENTS.md (`AGENTS.md`).\n' +
    '* AGENTS.md documents are hierarchical and additive: apply the closest `AGENTS.md` to the file(s) you are editing plus all parent `AGENTS.md` files up to the repo root.\n' +
    '* On conflicts, the most specific document wins: **file/dir-level > package/root-level (e.g., app/) > repo root**.\n' +
    '* Common roots with their own `AGENTS.md`: `app/`, `client/`, `common/`, `cdk/`, etc.\n';

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

  const agentsFiles = collectAgentsFiles(repoRoot);

  await Promise.all(agentsFiles.map(syncAgentInstructionFiles));
  console.log(`Synced ${agentsFiles.length} AGENTS.md files to CLAUDE.md and GEMINI.md`);
}

main().catch((error) => {
  console.error('Failed to sync AGENTS.md to CLAUDE.md and GEMINI.md', error);
  process.exitCode = 1;
});
