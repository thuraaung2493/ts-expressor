import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import handlebars from 'handlebars';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { errorLog, info, log } from '../../logs.mjs';

const action = async (arg) => {
  const name = await getControllerName(arg);

  checkFileExists(name);

  const content = await prepareContent(name);

  const path = await createFile(content, name);

  output(path.replace(process.cwd(), '.'));
};

const checkFileExists = (name) => {
  const outputFile = getOutputFile(name);

  if (existsSync(outputFile)) {
    info({ message: 'Controller already exists.', type: 'error' });
    process.exit(0);
  }
};

const output = (path) => {
  log(`Controller [${path}] created successfully.`);
};

const createFile = async (content, name) => {
  const outputFile = getOutputFile(name);

  await writeFile(outputFile, content, 'utf-8');

  return outputFile;
};

const getOutputFile = (name) => {
  return resolve(
    process.cwd(),
    'src/app/controllers/',
    `${name.toLowerCase()}.controller.ts`
  );
};

const prepareContent = async (name) => {
  const __dir = new URL('./', import.meta.url).pathname;
  const templateFile = resolve(__dir, '../../../templates/controller.hbs');
  const templateContent = await readFile(templateFile, { encoding: 'utf8' });
  const compiledTemplate = handlebars.compile(templateContent);
  return compiledTemplate({
    name: `${name[0].toUpperCase()}${name.slice(1)}`,
  });
};

const getControllerName = async (name) => {
  try {
    return name
      ? name
      : await input({
          message: 'What should the controller be named?',
        });
  } catch (error) {
    errorLog('Cancel.');
    process.exit(1);
  }
};

const makeController = () => {
  const make = new Command('make:controller');

  make
    .description(
      'Create a new controller class. Example: ts-expressor make:controller user.'
    )
    .usage('[options] <name>')
    .argument('[name]', 'Controller name')
    .action(action);

  return make;
};

export default makeController;
