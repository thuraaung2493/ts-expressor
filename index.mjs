#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import makeController from './src/commands/make/makeController.mjs';
import makeRepository from './src/commands/make/makeRepository.mjs';
import makeValidateSchema from './src/commands/make/makeValidateSchema.mjs';
import newApp from './src/commands/newApp.mjs';
import { log } from './src/logs.mjs';
import packageInfo from './src/package.mjs';

const program = new Command();

program
  .name('ts-expressor')
  .version(packageInfo.version)
  .description(
    'A powerful CLI tool for quickly scaffolding TypeScript-based Express applications, complete with built-in file management commands for streamlined development.'
  )
  .usage('command [options] [name]')
  .action(() => {
    log(
      figlet.textSync('TS Express App', {
        horizontalLayout: 'fitted',
        width: 120,
      })
    );

    log('npx @thuraaung2493/ts-expressor new <name>', 'Create New App - ');
    log('npx @thuraaung2493/ts-expressor make:controller <name>', 'Create Controller - ');
    log('npx @thuraaung2493/ts-expressor make:repository <name>', 'Create Repository - ');
    log('npx @thuraaung2493/ts-expressor make:schema <name>', 'Create Validate Schema - ');
  });

program.addCommand(newApp());
program.addCommand(makeController());
program.addCommand(makeValidateSchema());
program.addCommand(makeRepository());

program.parse(process.argv);
