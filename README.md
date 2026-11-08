<p align="center">
  <img src="assets/branding/logo.png" alt="ts-expressor logo" width="120" />
</p>

# @thuraaung2493/ts-expressor

A CLI for scaffolding TypeScript-based Express APIs and generating controllers, Prisma repositories, and Zod validation schemas.

`@thuraaung2493/ts-expressor` is used as the companion CLI for [express-app-template](https://github.com/thuraaung2493/express-app-template). The `new` command downloads that template, and the file generators follow its directory structure, imports, and conventions. Use the generators inside an application created from the template, or a project with the same setup.

![ts-expressor — an open-source project by Thura Aung](assets/branding/social-preview.jpg)

An open-source project by [Thura Aung](https://thuraaung2493.github.io/).

## Features

- Create an Express + TypeScript application from `express-app-template`.
- Generate controller classes with the template's `@AutoBind` decorator.
- Generate Prisma repositories with `create`, `first`, and `all` methods.
- Generate Zod validation schemas ready for your request fields.
- Enter names interactively when a command is run without a name.

The application template includes routing, Prisma ORM, Passport JWT authentication, Zod validation, Multer file uploads, Winston logging, Socket.io, and API response helpers. These features live in the template; this package provides the scaffolding commands.

## Requirements

- Node.js 18 or newer, as required by the CLI's dependencies.
- npm to run the CLI and install generated application dependencies.
- Git and network access to GitHub and the npm registry when creating an application.
- A MySQL database for the template's default Prisma schema.

## Installation

Run the CLI with `npx`:

```bash
npx @thuraaung2493/ts-expressor --help
```

Or install it globally:

```bash
npm install -g @thuraaung2493/ts-expressor
ts-expressor --help
```

The examples below use `npx @thuraaung2493/ts-expressor`. With a global installation, you can use `ts-expressor` in its place.

The npm package is now scoped as `@thuraaung2493/ts-expressor`, starting with version `0.0.3`. The globally installed executable remains `ts-expressor`. If you previously installed the unscoped package, migrate with:

```bash
npm uninstall -g ts-expressor
npm install -g @thuraaung2493/ts-expressor
```

## Quick start

### 1. Create an application

```bash
npx @thuraaung2493/ts-expressor new my-express-app
cd my-express-app
```

The `new` command:

1. Clones the template release tag configured in the CLI's `package.json` with a shallow Git clone (`v0.0.1` for CLI `0.0.3`).
2. Removes the template's `.git` and `.github` directories and `pnpm-lock.yaml`.
3. Renames `.env.example` to `.env`.
4. Installs the template's locked dependencies with `npm ci`.

Run this command from the parent directory where you want the application created. Use a new directory name, such as `my-express-app`, containing letters, numbers, hyphens, or underscores and starting with a letter or number. Existing directories are rejected. If creation fails, the CLI cleans up the directory it created and returns a failure exit code.

You can also run `npx @thuraaung2493/ts-expressor new` to enter the application name at a prompt. The pinned template is fetched from GitHub each time; its contents are not bundled with the CLI.

### 2. Configure the environment and database

Edit the generated `.env` file before starting the application:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection URL for Prisma, for example `mysql://user:password@localhost:3306/mydb`. |
| `APP_ENV` | Application environment; the template example uses `local`. |
| `PORT` | HTTP server port; the template example uses `4000`. |
| `PASSPORT_SECRET_KEY` | Secret used for JWT signing and verification. Replace the template value with your own secret. |
| `TOKEN_EXPIRE_TIME` | JWT expiration duration, such as `1h`. |
| `SALT_ROUNDS` | bcrypt hashing cost; the template example uses `10`. |

With your local MySQL database available and `DATABASE_URL` configured, generate the Prisma client and apply the template's migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

The template configures the Prisma schema location as `src/database/schema.prisma` in its `package.json`. The CLI installs dependencies, but does not configure your database or run migrations.

### 3. Start developing

```bash
npm run dev
```

The generated `.env` uses port `4000`, so the server listens at `http://localhost:4000` unless you change `PORT`.

To compile and run the built application:

```bash
npm run build
npm start
```

## Generated application structure

After creating an application, its main folders and files are:

```text
my-express-app/
├── .env                         # Local application and database configuration
├── package.json                 # Application dependencies and npm scripts
├── package-lock.json            # Locked dependency versions used by npm ci
├── tsconfig.json                # TypeScript settings and import aliases
├── scripts/                     # Release validation and API smoke checks
├── src/
│   ├── index.ts                 # Starts the HTTP and Socket.io servers
│   ├── app.ts                   # Express setup, middleware, and route loading
│   ├── ws.ts                    # Socket.io server setup
│   ├── app/
│   │   ├── controllers/         # Request handlers; make:controller output
│   │   ├── repositories/        # Prisma access; make:repository output
│   │   ├── validateSchema/      # Zod schemas; make:schema output
│   │   ├── services/            # Application business logic
│   │   ├── dtos/                # Objects used to shape response data
│   │   ├── enums/               # Shared application enum values
│   │   ├── events/
│   │   │   ├── handlers/        # Socket event handlers
│   │   │   └── listeners/       # Socket event listeners
│   │   └── middleware/
│   │       ├── multer/          # File upload configuration
│   │       ├── passport/        # JWT strategy and authentication middleware
│   │       └── responses/       # API response helpers
│   ├── config/                  # Application, authentication, and logging config
│   ├── database/
│   │   ├── schema.prisma        # Database provider and model definitions
│   │   └── migrations/          # Prisma database migration history
│   ├── decorators/              # AutoBind decorator used by controllers
│   ├── routes/                  # Route definitions, including auth routes
│   ├── types/                   # Shared types and Express type extensions
│   └── utils/                   # Logging, hashing, JWT, and validation utilities
└── storage/
    ├── app/                     # Application file storage
    └── logs/                    # Application log files
```

Dependency installation creates `node_modules/`. Running `npm run build` creates `dist/`, which is used by `npm start`.

## Command reference

| Command | Description |
| --- | --- |
| `new [name]` | Create an application from `express-app-template` and install its dependencies. |
| `make:controller [name]` | Generate a controller in `src/app/controllers/`. |
| `make:repository [name]` | Generate a Prisma repository in `src/app/repositories/`. |
| `make:schema [name]` | Generate a Zod schema in `src/app/validateSchema/`. |

Names are optional on the command line; omitting a name opens an interactive prompt. Run `npx @thuraaung2493/ts-expressor` without a command to see the command overview.

For help with a specific command:

```bash
npx @thuraaung2493/ts-expressor make:repository --help
```

### Generate a controller

Run generators from your application's root directory, where its `package.json` and `src/` directory are located:

```bash
npx @thuraaung2493/ts-expressor make:controller product
```

Creates `src/app/controllers/product.controller.ts`:

```ts
import AutoBind from '@decorators/autoBind.js';
import { type Request, type Response } from 'express';

@AutoBind
class ProductController {
  async name(req: Request, res: Response) {
    //
  }
}

export default new ProductController();
```

Replace the placeholder `name` method with your request handlers and connect them to routes in `src/routes/`. Controller generation creates the file only; it does not register routes.

### Generate a repository

```bash
npx @thuraaung2493/ts-expressor make:repository product
```

Creates `src/app/repositories/product.repository.ts`, containing a `ProductRepository` class exported as an instance. By default, it targets the Prisma `Product` model through `prisma.product` and provides:

| Method | Prisma operation |
| --- | --- |
| `create(data)` | `prisma.product.create({ data })` |
| `first(where)` | `prisma.product.findFirst({ where })` |
| `all(args)` | `prisma.product.findMany(args)` |

To use a different Prisma model, pass `-m` or `--model`:

```bash
npx @thuraaung2493/ts-expressor make:repository account --model user
```

This creates `src/app/repositories/account.repository.ts` with an `AccountRepository` class that uses the Prisma `User` model and `prisma.user` delegate.

The generator does not add Prisma models or migrations. Define the model in `src/database/schema.prisma` and regenerate the Prisma client before using the repository. The template already includes a `User` model and `user.repository.ts`; choose another repository name if you want to keep that file.

### Generate a validation schema

```bash
npx @thuraaung2493/ts-expressor make:schema product
```

Creates `src/app/validateSchema/product.schema.ts`:

```ts
import { z } from 'zod';

export const productSchema = z
  .object({})
  .required();
```

Add your request fields to the empty object, then import the schema into your controller or validation flow. Generating a schema does not automatically apply it to a route.

### Naming and file behavior

- Use simple singular names such as `product` or `account`. Filenames are lowercased, while class names capitalize only the first character; the CLI does not convert kebab-case or snake_case to PascalCase.
- Schema export names use the supplied name directly, followed by `Schema`. Use a name that forms a valid TypeScript identifier.
- Generator paths are relative to the current working directory and are fixed to the template's layout.
- Destination directories must already exist; generators do not create missing folders.
- If a destination file already exists, the generator prints a message and leaves it unchanged. There is no overwrite option.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `ts-expressor: command not found` | Use `npx @thuraaung2493/ts-expressor`, or check that npm's global executable directory is on your `PATH`. |
| Application creation fails | Check Git, access to GitHub and npm, and write permission in the parent directory. Use a fresh target directory. |
| A generator reports `ENOENT` | Run it from the application root and confirm the expected destination directory exists. |
| Generated controller imports cannot be resolved | Check that the project includes the template's `@decorators/*` alias and `AutoBind` decorator. |
| Prisma model types or delegates cannot be found | Check the model name in `src/database/schema.prisma`, then run `npx prisma generate`. |
| The application cannot connect to the database | Check that MySQL is running and the credentials and database in `.env` match your local setup. |

## Local development

To work on the CLI itself:

```bash
git clone https://github.com/thuraaung2493/ts-expressor.git
cd ts-expressor
npm install
node index.mjs --help
```

The CLI uses JavaScript ES modules and requires no build step. Command implementations are in `src/commands/`; generated file contents come from the Handlebars templates in `templates/`.

To try a local generator inside a template application, change to that application's root and run `node /absolute/path/to/ts-expressor/index.mjs make:schema example`. Use a disposable application when checking generated output.

Run `npm test` for CLI and generator tests. Run `npm run test:template` to pack and install the CLI, create an application from the pinned template tag, generate files, and compile the result. The compatibility check needs GitHub and npm access, and the template tag must already exist.

## Releases and compatibility

| CLI package | Template source |
| --- | --- |
| Legacy `ts-expressor@0.0.2` | The template's moving default branch. |
| `@thuraaung2493/ts-expressor@0.0.3` | Template tag `v0.0.1`. |

The versions have separate histories. Release the template first, then release a CLI version that points to that template version. CLI-only changes can keep the same template pin. Never move or delete a template tag used by a published CLI.

GitHub Actions checks pull requests and pushes to `main`. Pushing a stable `vX.Y.Z` tag reruns the checks and starts a release. The template workflow creates a GitHub release; the CLI workflow requires that template release, publishes to npm, and creates its own GitHub release. Version tags must match `package.json` and `package-lock.json`.

See [RELEASING.md](RELEASING.md) for the initial scoped-package publish, npm trusted-publisher setup, and the release sequence for both repositories.

## Support and license

- [Report a CLI issue](https://github.com/thuraaung2493/ts-expressor/issues).
- [View the application template](https://github.com/thuraaung2493/express-app-template) for application code and template-specific issues.

Licensed under ISC, as declared in `package.json`.
