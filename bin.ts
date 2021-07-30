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
  .command({
    command: "-",
    describe: "Configure to shell",
    handler: () => {
      let buf = ``;

      buf += `alias commit-help="node ${__filename}";\n\n`;

      /*
      Sample Fn:

      feat() {
        prefix_conventional_commit="$(mm m -r) $*"
        echo
        echo "Commit message:"
        echo "    $prefix_conventional_commit"
        echo
        echo "[Press enter to continue]"
        read;
        git commit -m "$prefix_conventional_commit"
      }
      */
      const defTypeFn = (fnName: string) => {
        // buf += `#shell fn: $ ${fnName} $*\n\n`;
        buf += `function ${fnName}() {\n`;
        buf += `  prefix_conventional_commit="$(commit-help commit --type ${fnName} -r) $*";\n`;
        buf += `  echo;\n`;
        buf += `  echo "Commit message:";\n`;
        buf += `  echo "    $prefix_conventional_commit";\n`;
        buf += `  echo;\n`;
        buf += `  echo "[Press enter to continue]";\n`;
        buf += `  read;\n`;
        buf += `  git commit -m "$prefix_conventional_commit";\n`;
        buf += `};\n\n`;
      };

      defTypeFn("feat");
      defTypeFn("fix");
      defTypeFn("refactor");

      // buf += `echo mm loaded\n`;
      buf += `\n`;
      buf += `# \n`;
      buf += `# Copy the next line to your shell config file\n`;
      buf += `# eval $(node ${__filename} -)\n`;
      buf += `# \n`;

      process.stdout.write(buf);
    },
  })
  .demandCommand(1, "You must provide a command")
  .showHelpOnFail(true).argv;
