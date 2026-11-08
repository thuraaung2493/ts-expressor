# Releasing the CLI and Template

This document describes the release process for `@thuraaung2493/ts-expressor` and its companion `express-app-template` repository.

The release process uses semantic versioning, GitHub Actions, npm trusted publishing, and immutable Git tags.

## Repositories

| Component | Repository                                                                    | Distribution    |
| --------- | ----------------------------------------------------------------------------- | --------------- |
| CLI       | [ts-expressor](https://github.com/thuraaung2493/ts-expressor)                 | npm             |
| Template  | [express-app-template](https://github.com/thuraaung2493/express-app-template) | GitHub releases |

The CLI package is published as `@thuraaung2493/ts-expressor`, and its executable remains `ts-expressor`.

The old unscoped `ts-expressor` package is separate from the scoped package. Publishing the scoped package does not update the unscoped package.

## Versioning and Compatibility

The CLI and template maintain independent versions.

- Each repository defines its version in `package.json` and `package-lock.json`.
- The CLI declares its compatible template version under `template.version` in `package.json`.
- The CLI clones the template using the corresponding `vX.Y.Z` Git tag.
- The template's `package-lock.json` determines the dependencies installed through `npm ci`.
- Released Git tags must remain immutable.

The CLI and template do not need matching version numbers.

### Versioning rules

| Change                               | Required action                           |
| ------------------------------------ | ----------------------------------------- |
| CLI bug fix                          | Patch CLI version                         |
| CLI branding or documentation change | Patch CLI version                         |
| CLI backward-compatible feature      | Minor CLI version                         |
| CLI breaking change                  | Major CLI version                         |
| Template bug fix                     | Patch template version                    |
| Template backward-compatible feature | Minor template version                    |
| Template breaking change             | Major template version                    |
| CLI adopts a new template release    | Update `template.version` and release CLI |

During the `0.x` development phase, choose version increments deliberately because incompatible changes can still occur between minor versions.

For CLI-only changes, do not change `template.version`.

When the template changes, release the template first and then update the CLI's compatibility pin.

## Release Architecture

Both repositories use GitHub Actions for continuous integration and releases.

### Continuous integration

Pull requests and pushes to `main` run CI.

The CLI CI validates the CLI and checks compatibility with its pinned template.

The template CI validates Prisma, builds the application, and runs API smoke tests against MySQL.

### Release workflows

Stable Git tags following `vX.Y.Z` trigger the corresponding release workflow.

The template release workflow:

1. Runs CI.
2. Validates the version against the package manifests.
3. Creates a published GitHub release.

The CLI release workflow:

1. Runs CI.
2. Validates the version against the package manifests.
3. Requires a published stable release of the pinned template.
4. Installs dependencies with `npm ci`.
5. Packages the CLI and checks whether that exact version is already published.
6. Publishes to npm using OIDC trusted publishing when the version is new.
7. Creates a GitHub release.

The workflows do not support prerelease tags such as `v1.0.0-beta.1`.

## Prerequisites

Before releasing either repository:

- Have permission to push to the repository and create release tags.
- Ensure the intended changes are merged into `main`.
- Ensure CI passes on the intended release commit.
- Ensure `package.json` and `package-lock.json` have matching versions.
- Ensure the working tree is clean before tagging.
- Verify the required template release exists before releasing the CLI.

For CLI publishing, the npm package must have a valid trusted-publisher configuration.

## npm Trusted Publishing

The CLI uses npm trusted publishing with GitHub Actions and OpenID Connect (OIDC).

Publishing through GitHub Actions does not require an `NPM_TOKEN` secret.

### Configuration

Open the [npm package settings](https://www.npmjs.com/package/@thuraaung2493/ts-expressor) and configure a GitHub Actions trusted publisher.

| Setting              | Value                      |
| -------------------- | -------------------------- |
| Organization or user | `thuraaung2493`            |
| Repository           | `ts-expressor`             |
| Workflow filename    | `release.yml`              |
| Environment          | Leave empty                |
| Allowed action       | Allow direct `npm publish` |

The `.github/workflows/release.yml` workflow grants `id-token: write`, uses Node.js 24, and installs npm 11.

The package must already exist on npm before its trusted publisher can be configured.

A new trusted-publisher configuration must complete its first successful publish within two days. If it expires, delete the expired configuration and create a new one before releasing.

After the first successful OIDC publish, the validated configuration can be reused for subsequent releases.

See the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for details.

## Releasing the CLI

Use this process for CLI changes, including code, features, bug fixes, documentation, and branding.

### 1. Update the version

From the `ts-expressor` repository, select the appropriate semantic version increment.

For a patch release:

```bash
npm version patch --no-git-tag-version
```

For a minor release:

```bash
npm version minor --no-git-tag-version
```

For a major release:

```bash
npm version major --no-git-tag-version
```

This updates `package.json` and `package-lock.json` without automatically creating a Git tag.

For CLI-only changes, leave `template.version` unchanged.

### 2. Run local checks

```bash
npm ci
npm test
npm run test:template
npm pack --dry-run
```

Inspect the package contents before releasing.

If branding assets have changed, ensure the package includes the expected files:

- `assets/branding/logo.png`
- `assets/branding/social-preview.jpg`

Review all files included in the package and exclude unintended or sensitive files.

### 3. Commit and merge

Commit the changes, including both package manifests.

```bash
git status
git add package.json package-lock.json
```

Stage all other intended changes, including source files, assets, and documentation.

```bash
git commit -m "chore: prepare CLI release"
```

Push the changes and merge them into `main` through the normal repository workflow.

Wait until all required CI checks pass.

### 4. Create the release tag

Update the local checkout to the tested commit on `main`.

```bash
git checkout main
git pull --ff-only origin main
```

Read the version directly from `package.json`.

```bash
VERSION=$(node -p "require('./package.json').version")
```

Create and push the release tag.

```bash
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"
```

The release tag must point to the exact commit that passed CI.

Do not manually publish the CLI through npm for normal releases.

### 5. Verify the release

Open the [GitHub Actions page](https://github.com/thuraaung2493/ts-expressor/actions) and confirm the Release workflow succeeds.

Verify the published npm version:

```bash
npm view @thuraaung2493/ts-expressor version
```

Inspect the npm distribution tags:

```bash
npm dist-tag ls @thuraaung2493/ts-expressor
```

Test the latest published CLI:

```bash
npx --yes @thuraaung2493/ts-expressor@latest --help
```

Confirm that the [GitHub release](https://github.com/thuraaung2493/ts-expressor/releases) exists and matches the published version.

## Releasing the Template

The template is distributed through GitHub releases and is not published to npm.

### 1. Update the version

From the `express-app-template` repository, update the version using the appropriate semantic version increment.

For a patch release:

```bash
npm version patch --no-git-tag-version
```

For a minor or major release, use `minor` or `major` instead.

Commit both package manifests with the template changes.

### 2. Run local checks

```bash
npm ci
npx prisma validate
npm run build
```

Run the database-dependent smoke tests using a disposable MySQL database, following the template's README instructions.

The CI workflow also validates the API and database migrations.

### 3. Commit and merge

Commit and push the intended changes.

Merge them into `main` after review and wait until CI passes.

### 4. Create the release tag

From the tested commit on `main`:

```bash
git checkout main
git pull --ff-only origin main
VERSION=$(node -p "require('./package.json').version")
git tag -a "v$VERSION" -m "Template v$VERSION"
git push origin "v$VERSION"
```

The GitHub Actions release workflow will rerun CI, validate the release version, and create the GitHub release.

### 5. Verify the template release

Open the [template releases page](https://github.com/thuraaung2493/express-app-template/releases).

Confirm that the release:

- Matches the version in `package.json`.
- Is published rather than a draft.
- Is not marked as a prerelease.
- Points to the tested commit.

A Git tag without a published stable GitHub release is insufficient for the CLI release workflow.

## Updating CLI Template Compatibility

When the CLI needs to adopt a newer template release:

1. Release the new template version.
2. Confirm its GitHub release is published and stable.
3. Update the CLI's `template.version` in `package.json`.
4. Update the CLI README compatibility information.
5. Run the CLI tests and template compatibility checks.
6. Release a new CLI version using the normal CLI release process.

The template version must match the existing release tag without its leading `v`.

Do not update the template pin to an unreleased version.

Previously published CLI versions retain their original template compatibility configuration.

## Release Failures and Recovery

### CI failure

Fix the failing checks before publishing.

If no release artifacts have been published, correct the changes on `main`, rerun CI, and create a new release tag for the corrected commit.

Do not move a tag that has already been released.

### npm authentication failure

Check:

- Trusted-publisher repository and workflow filename.
- Case-sensitive configuration values.
- Direct `npm publish` permission.
- Configuration expiry.
- GitHub Actions `id-token: write` permission.
- Supported Node.js and npm versions.

Do not add an npm publishing token to the workflow as a workaround.

### Template compatibility failure

Verify that the CLI's `template.version` refers to a published stable GitHub release.

The corresponding template tag must exist and remain accessible.

### npm version already exists

The CLI workflow compares the packed archive checksum against the version already published on npm.

If the archive is identical, publishing is skipped and GitHub release creation can continue.

If the archive differs, the workflow fails because npm does not permit overwriting published versions.

Publish a new version to correct an already published package.

### Temporary service failure

For temporary GitHub or npm service issues, rerun the failed workflow.

The release process supports an already published matching npm archive and an existing GitHub release.

Verify the artifacts before rerunning.

### Published release requires correction

If a published release contains incorrect files or behavior:

1. Correct the issue in a new commit.
2. Increment the affected package version.
3. Run CI.
4. Create and push a new release tag.

Never replace published npm versions or move released Git tags.

## Release Security

- Protect `main` with required CI checks.
- Restrict creation and modification of release tags using GitHub rulesets.
- Use npm OIDC trusted publishing instead of long-lived publishing tokens.
- Avoid publishing secrets or development-only files.
- Review package contents before publishing.
- Keep dependency lockfiles committed.
- Do not reuse released version numbers.
- Do not move or delete published release tags.

## Release Checklist

Before creating a CLI or template release:

- [ ] Changes are complete and reviewed.
- [ ] Package version is updated.
- [ ] `package.json` and `package-lock.json` agree.
- [ ] Template compatibility is correct.
- [ ] Local checks pass.
- [ ] Intended files are included.
- [ ] Changes are merged into `main`.
- [ ] CI passes on the intended commit.
- [ ] Trusted publishing is configured if releasing the CLI.
- [ ] Release tag matches the package version.
- [ ] Release workflow succeeds.
- [ ] Published artifacts are verified.

Release tags define the compatibility contract between published CLI versions and their corresponding template releases.
