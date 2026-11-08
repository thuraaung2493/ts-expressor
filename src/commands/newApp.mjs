import { input } from '@inquirer/prompts';
import cp from 'child_process';
import { Command } from 'commander';
import figlet from 'figlet';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import util from 'node:util';
import ora from 'ora';
import { errorLog, log } from '../logs.mjs';
import packageInfo from '../package.mjs';

const execFile = util.promisify(cp.execFile);

const newApp = () => {
  const newAppCommand = new Command('new');

  newAppCommand
    .description('Create TypeScript-based Express application.')
    .usage('<name>')
    .argument('[name]', 'Application name')
    .action(action);

  return newAppCommand;
};

const action = async (arg) => {
  log(
    figlet.textSync('TS Express App', {
      horizontalLayout: 'fitted',
      width: 120,
    })
  );
  const name = await getAppName(arg);

  if (!name || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
    errorLog('Use an application name containing only letters, numbers, hyphens, or underscores, starting with a letter or number.');
    process.exitCode = 1;
    return;
  }

  log(`🚀 Creating ${name}...`);

  let appPath;
  try {
    const targetPath = join(process.cwd(), name);
    await mkdir(targetPath);
    appPath = targetPath;

    await gitClone(appPath);

    await setupFiles(appPath);

    await installPackage(appPath);

    output(name);
  } catch (error) {
    errorLog(`Failed! error: ${error.message}`);
    if (appPath) {
      await rm(appPath, { recursive: true, force: true });
    }
    process.exitCode = 1;
  }
};

const getAppName = async (name) => {
  try {
    return name
      ? name
      : await input({
          message: 'What is the name of your project?',
        });
  } catch (error) {
    errorLog('⚠ Cancelled.');
    process.exit(1);
  }
};

const gitClone = async (appPath) => {
  const { repository, version } = packageInfo.template;
  await withSpinner(`Downloading template v${version} ...`, async () => {
    await execFile('git', [
      'clone', '--depth', '1', '--branch', `v${version}`, '--single-branch',
      '--quiet', repository, appPath,
    ]);
    const templatePackage = JSON.parse(
      await readFile(join(appPath, 'package.json'), 'utf8')
    );
    if (templatePackage.version !== version) {
      throw new Error(`Template version mismatch: expected ${version}, received ${templatePackage.version}.`);
    }
  });
};

const setupFiles = async (appPath) => {
  await withSpinner('Setting up files ...', async () => {
    await rm(join(appPath, '.git'), { recursive: true, force: true });
    await rm(join(appPath, '.github'), { recursive: true, force: true });
    await rm(join(appPath, 'pnpm-lock.yaml'), { force: true });
    await rename(join(appPath, '.env.example'), join(appPath, '.env'));
  });
};

const installPackage = async (appPath) => {
  await withSpinner('Installing dependencies ...', () =>
    execFile('npm', ['ci'], { cwd: appPath })
  );
};

const withSpinner = async (message, task) => {
  const spinner = ora(message).start();
  try {
    await task();
    spinner.succeed();
  } catch (error) {
    spinner.fail();
    throw error;
  }
};

const output = (name) => {
  log('Your application is ready 🥳', 'greenBright');
  log('Run your app with:');
  log(`       cd ${name}`);
  log(`       npm run dev`);
  log('npm run build', 'Project Build: ');
  log('npm start', 'Project Start: ');
};

export default newApp;
