#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { BRAND_WORDMARK } = require('./brand-wordmark');

const BRAND_TS_PATH = path.join(__dirname, '..', 'client', 'lib', 'brand.ts');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'brand');

/**
 * Horizontal lockup proportions, held as ratios of the mark's height so the
 * export stays in step with `components/site/Logo.tsx`, which expresses the same
 * relationship in Tailwind classes: mark `h-8` (32px), wordmark `text-xl` (20px),
 * `gap-2.5` (10px).
 */
const LOCKUP_GAP_RATIO = 10 / 32;

/**
 * Read one `export const NAME = ...;` out of `client/lib/brand.ts` as raw source.
 *
 * Why source parsing rather than an import: `brand.ts` is TypeScript inside the
 * `client` workspace, and this script must run from the repo root with no build
 * step and no transpiler dependency.
 */
function readDeclaration(source, name) {
  const match = new RegExp(`export const ${name}\\s*=\\s*([\\s\\S]*?);\\n`).exec(source);
  if (!match) {
    throw new Error(`${name} not found in client/lib/brand.ts`);
  }
  return match[1];
}

/**
 * Concatenate the single-quoted string literals in a declaration. The mark paths
 * are authored as multiple literals joined with `+`, one per glyph fragment.
 */
function readStringConstant(source, name) {
  const declaration = readDeclaration(source, name);
  const literals = declaration.match(/'([^']*)'/g);
  if (!literals) {
    throw new Error(`${name} is not a string constant`);
  }
  return literals.map((literal) => literal.slice(1, -1)).join('');
}

function readNumberConstant(source, name) {
  const value = Number(readDeclaration(source, name).trim());
  if (!Number.isFinite(value)) {
    throw new Error(`${name} is not a numeric constant`);
  }
  return value;
}

function buildMarkSvg(brand, letterColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${brand.viewBox}" width="${brand.width}" height="${brand.height}" role="img" aria-label="Athlete Arc">
  <path d="${brand.letterPath}" fill="${letterColor}"/>
  <path d="${brand.arcPath}" fill="${brand.arcColor}"/>
</svg>
`;
}

const round = (value) => Math.round(value * 100) / 100;

function buildLockupSvg(brand, letterColor) {
  const gap = brand.height * LOCKUP_GAP_RATIO;
  const wordmarkLeft = brand.width + gap;

  // Sit the wordmark's optical centre on the mark's centre, then correct for the
  // path's own left side bearing so the visual gap is exactly `gap`.
  const offsetX = wordmarkLeft - BRAND_WORDMARK.minX;
  const offsetY = brand.height / 2 - (BRAND_WORDMARK.minY + BRAND_WORDMARK.maxY) / 2;

  // Round up: a viewBox flush with the final glyph clips its antialiased edge in
  // some renderers.
  const totalWidth = Math.ceil(wordmarkLeft + BRAND_WORDMARK.width);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${brand.height}" width="${totalWidth}" height="${brand.height}" role="img" aria-label="Athlete Arc">
  <path d="${brand.letterPath}" fill="${letterColor}"/>
  <path d="${brand.arcPath}" fill="${brand.arcColor}"/>
  <g transform="translate(${round(offsetX)} ${round(offsetY)})">
    <path d="${BRAND_WORDMARK.path}" fill="${letterColor}"/>
  </g>
</svg>
`;
}

function main() {
  const source = fs.readFileSync(BRAND_TS_PATH, 'utf8');

  const brand = {
    viewBox: readStringConstant(source, 'BRAND_MARK_VIEW_BOX'),
    width: readNumberConstant(source, 'BRAND_MARK_WIDTH'),
    height: readNumberConstant(source, 'BRAND_MARK_HEIGHT'),
    letterPath: readStringConstant(source, 'BRAND_MARK_LETTER_PATH'),
    arcPath: readStringConstant(source, 'BRAND_MARK_ARC_PATH'),
    inkColor: readStringConstant(source, 'BRAND_INK_COLOR'),
    paperColor: readStringConstant(source, 'BRAND_PAPER_COLOR'),
    arcColor: readStringConstant(source, 'BRAND_ARC_COLOR'),
  };

  const outputs = [
    ['athlete-arc-mark.svg', brand.inkColor, buildMarkSvg],
    ['athlete-arc-mark-light.svg', brand.paperColor, buildMarkSvg],
    ['athlete-arc-lockup.svg', brand.inkColor, buildLockupSvg],
    ['athlete-arc-lockup-light.svg', brand.paperColor, buildLockupSvg],
  ];

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const [fileName, letterColor, build] of outputs) {
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), build(brand, letterColor), 'utf8');
    console.log(`✓ docs/brand/${fileName}  (letter ${letterColor}, arc ${brand.arcColor})`);
  }
}

main();
