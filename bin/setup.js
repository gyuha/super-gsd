#!/usr/bin/env node
// super-gsd installer — copies hooks, .agents, and .codex into target project

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const RESET  = '\x1b[0m';

// bin/setup.js lives at <pkg>/bin/setup.js, so dirname(__dirname) == pkg root
const PKG_ROOT = path.dirname(path.dirname(path.resolve(__filename)));

function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      force:  { type: 'boolean', default: false },
      gemini: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  if (positionals[0] !== 'install') {
    process.stdout.write('Usage: npx @gyuha/super-gsd install [--gemini] [--force]\n');
    process.stdout.write('\n');
    process.stdout.write('  install    Copy hooks, .agents/skills, and .codex into current project\n');
    process.stdout.write('  --gemini   Also copy .gemini/settings.json\n');
    process.stdout.write('  --force    Overwrite existing files\n');
    process.exit(1);
  }

  const DEST_ROOT = process.cwd();

  // Items: { src: relative-from-PKG_ROOT, dest: relative-from-DEST_ROOT, type: 'file'|'dir' }
  const items = [
    { src: '.codex/hooks.json',  dest: '.codex/hooks.json',  type: 'file' },
    { src: 'hooks',              dest: 'hooks',              type: 'dir'  },
    { src: '.agents',            dest: '.agents',            type: 'dir'  },
  ];

  if (values.gemini) {
    items.push({ src: '.gemini/settings.json', dest: '.gemini/settings.json', type: 'file' });
  }

  let copied  = 0;
  let skipped = 0;
  let errors  = 0;

  for (const item of items) {
    const srcPath  = path.join(PKG_ROOT, item.src);
    const destPath = path.join(DEST_ROOT, item.dest);
    const existed  = fs.existsSync(destPath);

    if (existed && !values.force) {
      process.stdout.write(
        YELLOW + '⚠ ' + item.dest + ' already exists — skipping (use --force to overwrite)' + RESET + '\n'
      );
      skipped++;
      continue;
    }

    try {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });

      if (item.type === 'dir') {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }

      const label = existed ? ' (overwritten)' : '';
      process.stdout.write(GREEN + '✓ ' + item.dest + label + RESET + '\n');
      copied++;
    } catch (e) {
      process.stderr.write('[error] ' + item.dest + ': ' + e.message + '\n');
      errors++;
    }
  }

  process.stdout.write('\nInstallation complete.\n');
  process.stdout.write('  Copied:  ' + copied + ' items\n');
  process.stdout.write('  Skipped: ' + skipped + ' items (already exist)\n');
  if (errors > 0) {
    process.stdout.write('  Errors:  ' + errors + ' (see above)\n');
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write('[error] ' + e.message + '\n');
    process.exit(1);
  }
}
