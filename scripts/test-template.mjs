import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import packageInfo from '../src/package.mjs';

const workspace = mkdtempSync(join(tmpdir(), 'ts-expressor-compatibility-'));
const run = (command, args, cwd) => execFileSync(command, args, {
  cwd, stdio: 'inherit', timeout: 600_000,
});

try {
  // Exercise the published package layout, including its bundled templates.
  const [archive] = JSON.parse(execFileSync('npm', [
    'pack', '--json', '--pack-destination', workspace,
  ], { encoding: 'utf8' }));
  const tools = join(workspace, 'tools');
  run('npm', ['install', '--prefix', tools, join(workspace, archive.filename), '--no-audit', '--no-fund'], workspace);
  const cli = join(tools, 'node_modules', packageInfo.name, 'index.mjs');
  run(process.execPath, [cli, 'new', 'sample-app'], workspace);
  const app = join(workspace, 'sample-app');
  const templatePackage = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  assert.equal(templatePackage.version, packageInfo.template.version);
  for (const args of [
    ['make:controller', 'account'],
    ['make:repository', 'account', '--model', 'user'],
    ['make:schema', 'account'],
  ]) {
    run(process.execPath, [cli, ...args], app);
  }
  run('npm', ['exec', '--', 'prisma', 'generate'], app);
  run('npm', ['run', 'build'], app);
  assert.ok(existsSync(join(app, 'dist/index.js')), 'Build must produce the npm start entry point');
  console.log(`CLI ${packageInfo.version} is compatible with template v${packageInfo.template.version}`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
