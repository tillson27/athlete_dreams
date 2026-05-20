#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const AGENTS_MD_PATH = path.join(__dirname, '..', 'AGENTS.md');

function main() {
  console.log('\n📅 Expired Rules Check\n');

  if (!fs.existsSync(AGENTS_MD_PATH)) {
    console.log('✓ No AGENTS.md found at repo root — skipping\n');
    return;
  }

  const content = fs.readFileSync(AGENTS_MD_PATH, 'utf8');
  const expiresPattern = /EXPIRES:\s*(\d{4}-\d{2}-\d{2})/g;
  const expired = [];
  const upcoming = [];
  const now = new Date();

  let match;
  while ((match = expiresPattern.exec(content)) !== null) {
    const date = new Date(`${match[1]}T00:00:00`);
    if (now >= date) {
      expired.push(match[1]);
    } else {
      const daysRemaining = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      upcoming.push({ date: match[1], daysRemaining });
    }
  }

  if (expired.length > 0) {
    console.error('❌ EXPIRED RULES DETECTED\n');
    for (const date of expired) {
      console.error(`   Rule with EXPIRES: ${date} has passed (today: ${now.toISOString().split('T')[0]}).`);
    }
    console.error('\n   Action required: remove or refresh the expired rules in AGENTS.md.\n');
    process.exit(1);
  }

  if (upcoming.length > 0) {
    for (const { date, daysRemaining } of upcoming) {
      console.log(`✓ Rule with EXPIRES: ${date} active (expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'})`);
    }
    console.log('');
  } else {
    console.log('✓ No expiring rules found\n');
  }
}

main();
