import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/prepare-publish.mjs', import.meta.url));

test('release retries skip identical archives and reject conflicts or registry failures', async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), 'ts-expressor-release-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await writeFile(join(cwd, 'npm'), `#!/usr/bin/env node
process.stdout.write(process.env.TEST_NPM_RESPONSE);
process.exitCode = Number(process.env.TEST_NPM_STATUS);
`, { mode: 0o755 });
  const archive = join(cwd, 'archive.json');
  await writeFile(archive, JSON.stringify([{
    name: '@thuraaung2493/ts-expressor', version: '0.0.3',
    filename: 'package.tgz', shasum: 'identical-content',
  }]));
  for (const [name, status, response, expected, output] of [
    ['new-version', 1, { error: { code: 'E404' } }, 0, 'publish=true'],
    ['retry', 0, 'identical-content', 0, 'publish=false'],
    ['conflict', 0, 'different-content', 1, null],
    ['network-error', 1, { error: { code: 'ENOTFOUND' } }, 1, null],
    ['authentication-error', 1, { error: { code: 'E401' } }, 1, null],
  ]) {
    const outputFile = join(cwd, `${name}.out`);
    const result = spawnSync(process.execPath, [script, archive], {
      encoding: 'utf8', env: {
        ...process.env, PATH: cwd + delimiter + process.env.PATH,
        TEST_NPM_RESPONSE: JSON.stringify(response), TEST_NPM_STATUS: String(status),
        GITHUB_OUTPUT: outputFile,
      },
    });
    assert.equal(result.status, expected, `${name}: ${result.stderr}`);
    if (output) {
      assert.match(await readFile(outputFile, 'utf8'), new RegExp(output));
    } else {
      await assert.rejects(readFile(outputFile), { code: 'ENOENT' });
    }
  }
});
