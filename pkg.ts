import fs from "fs";

export interface Pkg {
  name: string;
  version: string;
  description: string;
  bin: string;
  main: string;
  publishConfig: PublishConfig;
  scripts: Scripts;
  keywords: string[];
  author: string;
  license: string;
  devDependencies: DevDependencies;
  dependencies: Dependencies;
  "lint-staged": LintStaged;
}

export interface Dependencies {
  lodash: string;
  yargs: string;
}

export interface DevDependencies {
  "@commitlint/cli": string;
  "@commitlint/config-conventional": string;
  "@types/lodash": string;
  "@types/node": string;
  "@types/yargs": string;
  husky: string;
  "lint-staged": string;
  prettier: string;
  "standard-version": string;
  typescript: string;
}

export interface LintStaged {
  "**/*": string;
}

export interface PublishConfig {
  access: string;
  tag: string;
}

export interface Scripts {
  clean: string;
  build: string;
  "build:watch": string;
  prepare: string;
  release: string;
}

export const pkg: Pkg = JSON.parse(
  fs.readFileSync(`${__dirname}/package.json`, "utf8")
);
