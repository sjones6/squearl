#!/usr/bin/env node

const { program } = require('commander');
const { schedule, login, logout, whoami } = require('./squearl');


program
  .command('login')
  .description('set your squearl credentials')
  .action(() => login());

program
  .command('logout')
  .description('logout from squearl')
  .action(() => logout());

program.version('0.0.0');
program
  .command('schedule')
  .description('schedule a tweet/thread')
  .action(() => schedule());

program
  .command('whoami')
  .description('print out which twitter/squearl user you\'re logged in as')
  .action(() => whoami());

program.parse(process.argv);
