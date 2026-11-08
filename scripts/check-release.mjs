import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const tag = process.argv[2];
assert.match(tag ?? '', /^v\d+\.\d+\.\d+$/, 'Use a stable release tag such as v0.0.3');
assert.equal(tag, `v${packageInfo.version}`, 'Tag must match package.json');
assert.equal(lock.version, packageInfo.version, 'Lockfile version must match package.json');
assert.equal(lock.packages[''].version, packageInfo.version);
assert.equal(lock.name, packageInfo.name, 'Lockfile name must match package.json');
console.log(`Validated ${packageInfo.name}@${packageInfo.version}`);
