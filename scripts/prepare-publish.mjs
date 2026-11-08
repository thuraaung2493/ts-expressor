import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

// Allow retries and the first manual scoped-package publish only when the bytes match.
const [archive] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const result = spawnSync('npm', [
  'view', `${archive.name}@${archive.version}`, 'dist.shasum', '--json',
  '--registry=https://registry.npmjs.org',
], { encoding: 'utf8' });
let publish;
if (result.status === 0) {
  assert.equal(JSON.parse(result.stdout), archive.shasum,
    'This version is already published with different contents. Bump the version.');
  console.log('Identical package already published; continuing to the GitHub release.');
  publish = false;
} else {
  let registryError;
  try {
    registryError = JSON.parse(result.stdout).error?.code;
  } catch {
    // Network and authentication errors must fail instead of being treated as missing versions.
  }
  assert.equal(registryError, 'E404', result.stderr || 'Failed to query the npm registry');
  publish = true;
}
appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\narchive=${archive.filename}\n`);
