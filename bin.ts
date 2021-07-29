#!/usr/bin/env node

import yargs from "yargs"
import { listGitStatus } from "./listGitStatus"
import { readConfig } from "./readConfig"
import fs from "fs"


readConfig()


yargs
  .command({
    command: 'init',
    describe: 'Init mmrc file in current directory',
    handler: () => {
      const mmrcFileExists = fs.existsSync(`${process.cwd()}/.mmrc.json`)

      if (mmrcFileExists) {
        console.log(`mmrc file already exists in ${process.cwd()}`)
        return
      }
      fs.writeFileSync(`${process.cwd()}/.mmrc.json`, JSON.stringify({
        scopes: []
      }, null, 2))
      console.log(`Created mmrc file in ${process.cwd()}`)
    }
  })
  .command({
    command: "ls",
    describe: "List all git status",
    handler: () => {
      const status = listGitStatus()

      console.log(status)
    }
  })
  .command<{ r: boolean, 'only-name': boolean, type: string }>({
    command: "commit",
    aliases: ["m"],
    describe: "Commit all changes",
    builder: {
      r: {
        type: "boolean",
        default: false,
        describe: "Print without newline.",
      },
      'only-name': {
        type: "boolean",
        default: false,
        describe: "Only print scope name.",
      },
      type: {
        type: "string",
        default: "feat",
        describe: "Type of commit message.",
      },
    },
    handler: (argv) => {
      const config = readConfig();
      const status = listGitStatus();

      const prefixConventionalCommit = preparePrefixCommit(config, status, argv.type)

      if (argv.r) {
        process.stdout.write(prefixConventionalCommit)
      } else {
        console.log(prefixConventionalCommit)
      }
    }
  })
  .demandCommand(1, "You must provide a command")
  .showHelpOnFail(true)
  .argv


function preparePrefixCommit(config: ReturnType<typeof readConfig>, status: ReturnType<typeof listGitStatus>, type: string = "feat") {
  const filesMatch = status
    .map(({ flag, path, flagDesc, dirname }) => {
      const scope = config.scopes.find((c) => c.exp.test(path)) ?? null
      if (!scope) return null
      return {
        flag,
        path,
        flagDesc,
        dirname,
        scope,
        // [``]: scope.exp.exec(path),
      }
    })
    .filter(<T>(c: T): c is Exclude<T, null> => c !== null)
    .sort((a, b) => a.dirname.length - b.dirname.length)
    .filter(c => ['M '].includes(c.flag))

  const firstMatch = filesMatch?.[0];

  if (!firstMatch) {
    return `${type}:`
  } else {
    return `${type}(${firstMatch.scope.name}):`
  }
}
