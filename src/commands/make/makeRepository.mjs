import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import handlebars from 'handlebars';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { errorLog, info, log } from '../../logs.mjs';

const action = (options) => async (arg) => {
  const name = await getRepositoryName(arg);

  checkFileExists(name);

  const content = await prepareContent(name, options);

  const path = await createFile(content, name);

  output(path.replace(process.cwd(), '.'));
};

const checkFileExists = (name) => {
  const outputFile = getOutputFile(name);

  if (existsSync(outputFile)) {
    info({ message: 'Repository already exists.', type: 'error' });
    process.exit(0);
  }
};

const output = (path) => {
  log(`Repository [${path}] created successfully.`);
};

const createFile = async (content, name) => {
  const outputFile = getOutputFile(name);

  await writeFile(outputFile, content, 'utf-8');

  return outputFile;
};

const getOutputFile = (name) => {
  return resolve(
    process.cwd(),
    'src/app/repositories/',
    `${name.toLowerCase()}.repository.ts`
  );
};

const prepareContent = async (name, options) => {
  const __dir = new URL('./', import.meta.url).pathname;
  const templateFile = resolve(__dir, '../../../templates/repository.hbs');
  const templateContent = await readFile(templateFile, { encoding: 'utf8' });
  const compiledTemplate = handlebars.compile(templateContent);
  const model = options.model || name;
  return compiledTemplate({
    name: capitalized(name),
    model: model.toLowerCase(),
    capitalizedModel: capitalized(model)
  });
};

const capitalized = (str) => `${str[0].toUpperCase()}${str.slice(1)}`;

const getRepositoryName = async (name) => {
  try {
    return name
      ? name
      : await input({
          message: 'What should the repository be named? (user)',
        });
  } catch (error) {
    errorLog('Cancel.');
    process.exit(1);
  }
};

const makeRepository = () => {
  const make = new Command('make:repository');

  make
    .description(
      'Create a new repository class. Example: ts-expressor make:repository user.'
    )
    .usage('[options] <name>')
    .argument('[name]', 'Repository name')
    .option('-m, --model <model>', 'Model name (eg: user)')
    .action(action(make.opts()));

  return make;
};

export default makeRepository;
