#! /usr/bin/env node
const package = require('../package.json')
const { Command } = require('commander')
const { CreateCommand } = require('../src/command')

const program = new Command()

program
  .version(package.version, '-v, --version', 'display version for cv-cli')
  .usage('<command> [options]')

program
  .option('-y, --yes', 'run default action')
  .option('-f, --force', 'force all the questions')

program
  .command('create <name>')
  .description('create a new vue project by cv-cli')
  .option('-f, --force', '忽略文件检查，如果已经存在会被覆盖')
  .action((source, destination) => {
    new CreateCommand(source, destination)
  })

try {
  program.parse(process.argv)
} catch (error) {
  console.error('error: ', error)
}