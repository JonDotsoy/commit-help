#!/usr/bin/env node

import yargs from "yargs";
import { listGitStatus } from "./listGitStatus";
import { readConfig } from "./readConfig";
import { preparePrefixCommit } from "./lib/preparePrefixCommit";
import { App } from "./app";

yargs
  .command({
    command: "init",
    describe: "Init mmrc file in current directory",
    handler: () => {
      const app = new App();

      if (app.initializeMMRC()) {
        console.log(`Created mmrc file in ${process.cwd()}`);
      } else {
        console.log(`mmrc file already exists in ${process.cwd()}`);
      }
    },
  })
  .command({
    command: "ls",
    describe: "List all git status",
    handler: () => {
      const status = listGitStatus();

      console.log(status);
    },
  })
  .command({
    command: "scopes",
    describe: "List all scopes",
    handler: () => {
      const config = readConfig();
      const status = listGitStatus();

      console.log("## config");
      console.log();
      console.log(config);
      console.log();
      console.log("## status");
      console.log();
      console.log(status);
    },
  })
  .command<{ r: boolean; "only-name": boolean; type: string }>({
    command: "commit",
    aliases: ["m"],
    describe: "Commit all changes",
    builder: {
      r: {
        type: "boolean",
        default: false,
        describe: "Print without newline.",
      },
      "only-name": {
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

      const prefixConventionalCommit = preparePrefixCommit(
        config,
        status,
        argv.type
      );

      if (argv.r) {
        process.stdout.write(prefixConventionalCommit);
      } else {
        console.log(prefixConventionalCommit);
      }
    },
  })
  .demandCommand(1, "You must provide a command")
  .showHelpOnFail(true).argv;
