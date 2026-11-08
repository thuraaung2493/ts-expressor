# Releasing the CLI and template

The npm package is `@thuraaung2493/ts-expressor`. Its executable is `ts-expressor`, and its GitHub repository remains `thuraaung2493/ts-expressor`.

The next CLI version is **0.0.3**, paired with template **v0.0.1**. The old unscoped `ts-expressor@0.0.2` remains a separate npm package; publishing the scoped package does not update existing installations of the old one.

## How the repositories work together

- Each repository has its own version in `package.json` and `package-lock.json`.
- The CLI records its compatible template version in `package.json` under `template.version` and clones the matching `vX.Y.Z` tag.
- The template's npm lockfile fixes the dependencies installed by the CLI's `npm ci` step.
- PRs and pushes to `main` run CI. Stable version tags run release workflows after repeating CI.
- The template release workflow builds and checks the API with MySQL, then creates a GitHub release.
- The CLI release workflow tests the packaged CLI against the pinned template, requires its published stable GitHub release, publishes to npm, then creates the CLI's GitHub release.

Release related template changes first, then adopt that version in a CLI release. For CLI-only changes, keep the current template pin. Never move or delete tags that have been released; publish a new version to correct a release.

## Initial setup: template v0.0.1

1. Commit and merge the template's workflows, npm lockfile, smoke checks, and build fix into `express-app-template/main`.
2. Wait for its GitHub Actions CI to pass on that commit.
3. From an up-to-date template checkout, tag and push the tested commit:

   ```bash
   git tag -a v0.0.1 -m "Template v0.0.1"
   git push origin v0.0.1
   ```

4. Wait for the template's Release workflow to finish and confirm that GitHub shows a published `v0.0.1` release. A tag alone is insufficient for the CLI's npm release gate.

The CLI's compatibility job requires this tag, so publish the template before expecting the initial CLI CI run to pass.

## Initial setup: npm authentication and the scoped package

Use an npm account with permission to publish under `@thuraaung2493`. GitHub and npm usernames are separate; confirm ownership on npm.

1. Commit and merge the CLI changes, keeping version `0.0.3`. Wait for CI, including the template compatibility job, to pass.
2. In that exact CLI checkout, log in to npm and complete the browser/2FA flow:

   ```bash
   npm login --scope=@thuraaung2493 --registry=https://registry.npmjs.org
   npm whoami
   ```

3. Verify the package locally and perform the first publish to create the new scoped package:

   ```bash
   npm ci
   npm test
   npm run test:template
   npm publish --access public
   ```

   This publishes `@thuraaung2493/ts-expressor@0.0.3`, not the old unscoped package. A scoped public package requires public access; `publishConfig.access` is also set to `public` in the manifest. See [npm's scoped publishing instructions](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

4. Open the new [package page on npm](https://www.npmjs.com/package/@thuraaung2493/ts-expressor), go to Settings, and add a GitHub Actions trusted publisher with these exact values:

   | Setting | Value |
   | --- | --- |
   | Organization or user | `thuraaung2493` |
   | Repository | `ts-expressor` |
   | Workflow filename | `release.yml` |
   | Environment | Leave empty; the workflow does not use a GitHub environment. |
   | Allowed action | Allow direct `npm publish`. |

   The package must exist before configuring its trusted publisher. The workflow grants `id-token: write` and uses Node.js 24 with npm 11. No `NPM_TOKEN` secret is needed for subsequent releases. See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).

5. Tag the same committed contents you published, then push the tag:

   ```bash
   git tag -a v0.0.3 -m "Release @thuraaung2493/ts-expressor 0.0.3"
   git push origin v0.0.3
   ```

   The workflow compares the packed archive's checksum with npm. It skips publishing if identical version `0.0.3` already exists and creates the GitHub release. Different contents under an existing version fail the workflow; bump the version instead.

6. The next new CLI version will publish through OIDC. Configure the trusted publisher shortly before that release: npm currently requires a newly configured publisher to complete its first successful publish within two days. If it expires, recreate it before the next release.

The first local publish uses your npm login and does not have CI provenance. New versions published by the workflow use OIDC and provenance.

## Subsequent releases

### When the template changes

In `express-app-template`, make the changes and update the version:

```bash
npm version patch --no-git-tag-version
```

Commit and merge the changed files, including both package files. After CI passes, create and push the matching tag. For example, if the new template version is `0.0.2`:

```bash
git tag -a v0.0.2 -m "Template v0.0.2"
git push origin v0.0.2
```

Wait for its GitHub release, then update the CLI's `template.version` to `0.0.2`, update the README compatibility table, and release the CLI as described below. A template release does not automatically change published CLI versions.

### Release the CLI

In `ts-expressor`, update the version and run checks:

```bash
npm version patch --no-git-tag-version
npm test
npm run test:template
```

Commit and merge the changes, including both package files. After CI passes, tag that commit with the version in `package.json`. For the next patch after `0.0.3`:

```bash
git tag -a v0.0.4 -m "Release v0.0.4"
git push origin v0.0.4
```

GitHub Actions handles npm publishing and GitHub release creation. Use stable `vX.Y.Z` tags; these workflows intentionally reject prerelease version tags.

## If a release fails

- Fix failed CI checks before publishing a new version. Do not retarget a released template tag.
- For npm authentication failures, check the trusted publisher's case-sensitive repository and workflow filename, its expiry, and direct-publish permission.
- Rerun the failed workflow for temporary service errors. An already published npm version is accepted only when the new archive's checksum matches; release creation also tolerates an existing GitHub release.
- If a published package needs a fix, bump the package version, test it, and publish a new tag. npm versions cannot be overwritten.

Protect `main` with required CI checks and restrict changes to release tags using GitHub repository rulesets. Release tags are the compatibility contract for published CLI versions.
