import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import handlebars from 'handlebars';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { errorLog, info, log } from '../../logs.mjs';

const action = async (arg) => {
  const name = await getSchemaName(arg);

  checkFileExists(name);

  const content = await prepareContent(name);

  const path = await createFile(content, name);

  output(path.replace(process.cwd(), '.'));
};

const checkFileExists = (name) => {
  const outputFile = getOutputFile(name);

  if (existsSync(outputFile)) {
    info({ message: 'Validate schema already exists.', type: 'error' });
    process.exit(0);
  }
};

const output = (path) => {
  log(`Validate schema [${path}] created successfully.`);
};

const createFile = async (content, name) => {
  const outputFile = getOutputFile(name);

  await writeFile(outputFile, content, 'utf-8');

  return outputFile;
};

const getOutputFile = (name) => {
  return resolve(
    process.cwd(),
    'src/app/validateSchema/',
    `${name.toLowerCase()}.schema.ts`
  );
};

const prepareContent = async (name) => {
  const __dir = new URL('./', import.meta.url).pathname;
  const templateFile = resolve(__dir, '../../../templates/validateSchema.hbs');
  const templateContent = await readFile(templateFile, { encoding: 'utf8' });
  const compiledTemplate = handlebars.compile(templateContent);
  return compiledTemplate({ name });
};

const getSchemaName = async (name) => {
  try {
    return name
      ? name
      : await input({
          message: 'What should the validate-schema be named?',
        });
  } catch (error) {
    errorLog('Cancel.');
    process.exit(1);
  }
};

const makeValidateSchema = () => {
  const make = new Command('make:schema');

  make
    .description(
      'Create a new validate schema file. Example: ts-expressor make:schema user.'
    )
    .usage('[options] <name>')
    .argument('[name]', 'Validate schema name')
    .action(action);

  return make;
};

export default makeValidateSchema;
