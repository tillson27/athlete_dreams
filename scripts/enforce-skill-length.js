#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');
const SOFT_LIMIT_CHARS = 15000;

function getSkillCharacterCounts() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.log('No skills directory found at', SKILLS_DIR);
    return [];
  }

  const skillFolders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const results = [];

  for (const skill of skillFolders) {
    const skillPath = path.join(SKILLS_DIR, skill);
    const mdFiles = fs.readdirSync(skillPath)
      .filter(file => file.endsWith('.md'));

    let totalChars = 0;
    const fileDetails = [];

    for (const mdFile of mdFiles) {
      const filePath = path.join(skillPath, mdFile);
      const content = fs.readFileSync(filePath, 'utf8');
      const chars = content.length;
      totalChars += chars;
      fileDetails.push({ file: mdFile, chars });
    }

    results.push({
      skill,
      totalChars,
      files: fileDetails,
      overSoftLimit: totalChars > SOFT_LIMIT_CHARS
    });
  }

  return results;
}

function main() {
  const results = getSkillCharacterCounts();
  const overLimit = results.filter(r => r.overSoftLimit);

  console.log('\n📏 Skill Length Check\n');
  console.log(`Soft limit per skill: ${SOFT_LIMIT_CHARS.toLocaleString()} characters\n`);

  for (const result of results) {
    const percentage = ((result.totalChars / SOFT_LIMIT_CHARS) * 100).toFixed(0);
    console.log(`  ${result.skill}: ${result.totalChars.toLocaleString()} chars (${percentage}%)`);
  }

  if (overLimit.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log(`\nℹ️  ${overLimit.length} skill(s) over the soft limit:\n`);

    for (const s of overLimit) {
      const over = s.totalChars - SOFT_LIMIT_CHARS;
      console.log(`  • ${s.skill}: ${s.totalChars.toLocaleString()} chars (+${over.toLocaleString()})`);
      for (const file of s.files) {
        console.log(`      ${file.file}: ${file.chars.toLocaleString()} chars`);
      }
    }
    console.log('');
  } else {
    console.log('\n✓ All skills within soft limit\n');
  }
}

main();
