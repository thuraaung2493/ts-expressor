import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import packageInfo from '../src/package.mjs';

const cli = fileURLToPath(new URL('../index.mjs', import.meta.url));
const run = (cwd, args, env = {}) => spawnSync(process.execPath, [cli, ...args], {
  cwd, encoding: 'utf8', timeout: 60_000,
  env: { ...process.env, ...env },
});

async function workspace(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ts-expressor-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('CLI reports the package version and documents the model option', async (t) => {
  const cwd = await workspace(t);
  assert.equal(run(cwd, ['--version']).stdout.trim(), packageInfo.version);
  assert.match(run(cwd, ['make:repository', '--help']).stdout, /--model/);
});

test('generators write template-compatible files and preserve existing files', async (t) => {
  const cwd = await workspace(t);
  for (const folder of ['controllers', 'repositories', 'validateSchema']) {
    await mkdir(join(cwd, 'src/app', folder), { recursive: true });
  }
  for (const args of [
    ['make:controller', 'account'],
    ['make:repository', 'account', '--model', 'user'],
    ['make:schema', 'account'],
  ]) {
    const result = run(cwd, args);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  const controllerPath = join(cwd, 'src/app/controllers/account.controller.ts');
  const controller = await readFile(controllerPath, 'utf8');
  assert.match(controller, /class AccountController/);
  assert.match(controller, /@decorators\/autoBind\.js/);
  const repository = await readFile(join(cwd, 'src/app/repositories/account.repository.ts'), 'utf8');
  assert.match(repository, /class AccountRepository/);
  assert.match(repository, /Prisma\.UserDelegate/);
  assert.match(repository, /prisma\.user/);
  assert.match(await readFile(join(cwd, 'src/app/validateSchema/account.schema.ts'), 'utf8'), /export const accountSchema/);
  await writeFile(controllerPath, '// existing application code\n');
  assert.equal(run(cwd, ['make:controller', 'account']).status, 0);
  assert.equal(await readFile(controllerPath, 'utf8'), '// existing application code\n');
});

test('new uses the pinned tag, prepares files, and installs from the lockfile', async (t) => {
  const cwd = await workspace(t);
  const fixture = join(cwd, 'template');
  await mkdir(join(fixture, '.github/workflows'), { recursive: true });
  const metadata = { name: 'fixture', version: packageInfo.template.version };
  await writeFile(join(fixture, 'package.json'), JSON.stringify(metadata));
  await writeFile(join(fixture, 'package-lock.json'), JSON.stringify({
    ...metadata, lockfileVersion: 3, packages: { '': metadata },
  }));
  await writeFile(join(fixture, '.env.example'), 'PORT=4000\n');
  await writeFile(join(fixture, 'pnpm-lock.yaml'), 'fixture');
  await writeFile(join(fixture, '.github/workflows/release.yml'), 'fixture');
  const git = (...args) => execFileSync('git', args, { cwd: fixture, stdio: 'pipe' });
  git('init', '-b', 'main');
  git('add', '.');
  git('-c', 'user.name=CLI Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Template fixture');
  git('tag', `v${packageInfo.template.version}`);
  await writeFile(join(fixture, 'package.json'), JSON.stringify({ ...metadata, version: '99.0.0' }));
  git('add', '.');
  git('-c', 'user.name=CLI Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'Incompatible main');
  const env = {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: `url.file://${fixture}.insteadOf`,
    GIT_CONFIG_VALUE_0: packageInfo.template.repository,
    npm_config_cache: join(cwd, 'cache'),
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_offline: 'true',
  };
  const result = run(cwd, ['new', 'example'], env);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const app = join(cwd, 'example');
  assert.equal(JSON.parse(await readFile(join(app, 'package.json'))).version, packageInfo.template.version);
  assert.equal(await readFile(join(app, '.env'), 'utf8'), 'PORT=4000\n');
  for (const path of ['.git', '.github', '.env.example', 'pnpm-lock.yaml']) {
    await assert.rejects(readFile(join(app, path)), { code: 'ENOENT' });
  }
  const duplicate = run(cwd, ['new', 'example'], env);
  assert.equal(duplicate.status, 1);
  assert.equal(await readFile(join(app, '.env'), 'utf8'), 'PORT=4000\n');
  const invalid = run(cwd, ['new', '../outside'], env);
  assert.equal(invalid.status, 1);
});

test('failed downloads return failure and clean up only the new directory', async (t) => {
  const cwd = await workspace(t);
  const result = run(cwd, ['new', 'missing'], {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: `url.file://${join(cwd, 'nonexistent')}.insteadOf`,
    GIT_CONFIG_VALUE_0: packageInfo.template.repository,
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  await assert.rejects(readFile(join(cwd, 'missing/package.json')), { code: 'ENOENT' });
});
