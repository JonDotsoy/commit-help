#!/usr/bin/env node

import { listGitStatus } from "./listGitStatus";
import { readConfig } from "./readConfig";
import { preparePrefixCommit } from "./lib/preparePrefixCommit";
import { App } from "./app";
import fs from "fs";
import { compile } from "./template/template";

const runSymbol = Symbol("CMD.run");

abstract class CMD {
  #argv: string[] = [];

  get argv() {
    return this.#argv;
  }

  abstract command: string;
  abstract describe: string;
  abstract handler(): Promise<void>;

  async [runSymbol](argv: string[]) {
    this.#argv = argv;
    await this.handler();
  }
}

class CmdRun {
  #command?: string;
  cmds: CMD[] = [];

  constructor(command?: string) {
    if (command) {
      this.setCommand(command);
    }
  }

  setCommand(command: string) {
    this.#command = command;
    return this;
  }

  add(...cmds: CMD[]) {
    this.cmds.push(...cmds);
    return this;
  }

  async help() {}

  async showHelp() {
    console.log(
      `Usage: ${this.#command ?? process.argv[1]} <command> [options]`
    );
    console.log("");
    console.log("Commands:");
    this.cmds.forEach((cmd) => {
      console.log(`${`  ${cmd.command}`.padEnd(20, " ")}  ${cmd.describe}`);
    });
  }

  async run(argv: string[]) {
    const [firstArg, ...moreArgv] = argv;

    const cmd = this.cmds.find((cmd) => cmd.command === firstArg);

    if (!cmd) {
      console.error(`Unknown command "${firstArg}"`);
      this.showHelp();
      process.exit(1);
    }

    await cmd[runSymbol](argv);
  }
}

class InitCMD extends CMD {
  command = "init";
  describe = "Init mmrc file in current directory";
  async handler() {
    const app = new App();

    if (app.initializeMMRC()) {
      console.log(`Created mmrc file in ${process.cwd()}`);
    } else {
      console.log(`mmrc file already exists in ${process.cwd()}`);
    }
  }
}

class LsCMD extends CMD {
  command = "ls";
  describe = "List all git status";
  async handler() {
    const status = listGitStatus();

    console.log(status);
  }
}

class ScopesCMD extends CMD {
  command = "scopes";
  describe = "List all scopes";
  async handler() {
    const config = readConfig();
    const status = listGitStatus();

    console.log("## config");
    console.log();
    console.log(config);
    console.log();
    console.log("## status");
    console.log();
    console.log(status);
  }
}

class CommitCMD extends CMD {
  command = "commit";
  describe = "Prepare commit message";
  async handler() {
    const [, type, ...text] = this.argv;

    /**
     * Validation type or throw error
     * Types:
     *  - feat
     *  - fix
     *  - docs
     *  - style
     *  - refactor
     *  - perf
     *  - test
     *  - build
     *  - ci
     *  - chore
     *  - revert
     *
     * Or use suffix ! in type
     */
    switch (type.endsWith("!") ? type.slice(0, -1) : type) {
      case "feat":
      case "fix":
      case "docs":
      case "style":
      case "refactor":
      case "perf":
      case "test":
      case "build":
      case "ci":
      case "chore":
      case "revert":
        break;
      default:
        console.error(
          `Unknown type "${type}", please use one of the following: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert`
        );
        process.exit(1);
    }

    const config = readConfig();
    const status = listGitStatus();

    const prefixConventionalCommit = preparePrefixCommit(
      config,
      status,
      type
      // argv.type
    );

    // console.log(prefixConventionalCommit);
    process.stdout.write(`${prefixConventionalCommit} ${text.join(" ")}`);
  }
}

class ShellAliasCMD extends CMD {
  command = "-";
  describe = "Prepare alias command into shell";
  async handler() {
    const valsPosts = compile(
      fs.readFileSync(`${__dirname}/shell.template.bash`),
      {
        commitHelpScript: __filename,
      }
    );

    const bashOutLocation = `${__dirname}/.main.bash`;

    let bufConsole = "";

    bufConsole += `Copy the following line to your .bashrc or .zshrc file\n`;
    bufConsole += `\n`;
    bufConsole += `   source ${JSON.stringify(bashOutLocation)}\n`;

    fs.writeFileSync(`${bashOutLocation}`, valsPosts);
    console.log(bufConsole);
  }
}

// Command to print version
class VersionCMD extends CMD {
  command = "version";
  describe = "Print version";
  async handler() {
    console.log(
      `Commit-Help Version ${require("./package.json").version} (node: ${
        process.version
      })`
    );
  }
}

new CmdRun("commit-help")
  .add(
    new InitCMD(),
    new LsCMD(),
    new ScopesCMD(),
    new CommitCMD(),
    new ShellAliasCMD(),
    new VersionCMD()
  )
  .run(process.argv.slice(2));

// yargs
//   .command<{ r: boolean; "only-name": boolean; type: string }>({
//     command: "commit",
//     aliases: ["m"],
//     describe: "Commit all changes",
//     builder: {
//       r: {
//         type: "boolean",
//         default: false,
//         describe: "Print without newline.",
//       },
//       "only-name": {
//         type: "boolean",
//         default: false,
//         describe: "Only print scope name.",
//       },
//       type: {
//         type: "string",
//         default: "feat",
//         describe: "Type of commit message.",
//       },
//     },
//     handler: (argv) => {
//       const config = readConfig();
//       const status = listGitStatus();

//       const prefixConventionalCommit = preparePrefixCommit(
//         config,
//         status,
//         argv.type
//       );

//       if (argv.r) {
//         process.stdout.write(prefixConventionalCommit);
//       } else {
//         console.log(prefixConventionalCommit);
//       }
//     },
//   })
//   .command({
//     command: "-",
//     describe: "Configure to shell",
//     handler: () => {
//       let buf = ``;

//       buf += `alias commit-help="node ${__filename}";\n\n`;

//       /*
//       Sample Fn:

//       feat() {
//         prefix_conventional_commit="$(mm m -r) $*"
//         echo
//         echo "Commit message:"
//         echo "    $prefix_conventional_commit"
//         echo
//         echo "[Press enter to continue]"
//         read;
//         git commit -m "$prefix_conventional_commit"
//       }
//       */
//       const defTypeFn = (fnName: string) => {
//         buf += `#shell fn: $ ${fnName} $*\n\n`;
//         buf += `function ${fnName}() {\n`;
//         buf += `  prefix_conventional_commit="$(commit-help commit --type ${fnName} -r) $*";\n`;
//         buf += `  echo;\n`;
//         buf += `  echo "Commit message:";\n`;
//         buf += `  echo "    $prefix_conventional_commit";\n`;
//         buf += `  echo;\n`;
//         buf += `  echo "[Press enter to continue]";\n`;
//         buf += `  read;\n`;
//         buf += `  git commit -m "$prefix_conventional_commit";\n`;
//         buf += `};\n\n`;
//       };

//       defTypeFn("feat");
//       defTypeFn("fix");
//       defTypeFn("refactor");
//       defTypeFn("docs");
//       defTypeFn("breaking-change");

//       // buf += `echo mm loaded\n`;
//       buf += `\n`;
//       buf += `# \n`;
//       buf += `# Copy the next line to your shell config file\n`;
//       buf += `# eval $(node ${__filename} -)\n`;
//       buf += `# \n`;

//       // process.stdout.write(buf);
//       buf.split("\n").forEach((line) => {
//         console.log(line);
//       });
//     },
//   })
//   .demandCommand(1, "You must provide a command")
//   .showHelpOnFail(true).argv;
