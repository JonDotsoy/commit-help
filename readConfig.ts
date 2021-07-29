import path from 'path';
import fs from "fs";
import { inspect } from 'util';
import escapeRegExp from 'lodash/escapeRegExp'


const reducePathModule = (pathStr: string) => {
  const proposalPathMMRC = path.resolve(`${pathStr}/.mmrc.json`);
  const proposalPathPackageJsonFile = path.resolve(`${pathStr}/package.json`);

  if (fs.existsSync(proposalPathMMRC)) {
    const data: unknown = JSON.parse(fs.readFileSync(proposalPathMMRC, "utf8"));
    return { path: proposalPathMMRC, mmrcConfig: data };
  }

  if (fs.existsSync(proposalPathPackageJsonFile)) {
    const data: unknown = JSON.parse(fs.readFileSync(proposalPathPackageJsonFile, "utf8"));
    const withMMRC = (data: any): data is { mmrc: unknown } => data && typeof data === "object" && typeof data.mmrc === "object";
    if (withMMRC(data)) {
      return { path: proposalPathPackageJsonFile, mmrcConfig: data.mmrc };
    }
  }

  return null
}


const pathToDirectories = (pathStr: string): string[] => {
  const acumPaths = new Set<string>([pathStr])
  const pathParts = pathStr.split(path.sep);

  let subPath = pathStr;
  for (let i = 0; i < pathParts.length; i++) {
    subPath = path.dirname(subPath)
    acumPaths.add(subPath)
  }

  return Array.from(acumPaths)
}


const readConfigFounds = function (cwd: string) {
  const founds = pathToDirectories(cwd)
    .map(reducePathModule)
    .filter(<T>(p: T): p is Exclude<T, null> => p !== null);

  type ScopeConfig = {
    name: string
    match: string
  }

  const isMMRCConfigScopes = (v: any): v is ScopeConfig => typeof v === "object" && typeof v.name === "string" && typeof v.match === "string";

  const isMMRCConfig = <T extends { mmrcConfig: any }>(v: T): v is T & { mmrcConfig: { scopes: ScopeConfig[] } } => typeof v === "object" &&
    "mmrcConfig" in v &&
    Array.isArray(v.mmrcConfig.scopes) &&
    v.mmrcConfig.scopes.every(isMMRCConfigScopes)

  const scopesFounds = founds
    .filter(isMMRCConfig)
    .map(({ path: pathStr, mmrcConfig }) => {
      const parseExp = (expStr: string) => expStr
        .replace(/\\\$CWD/g, escapeRegExp(path.dirname(pathStr)))
        .replace(/\\\*\\\*/g, '.*');

      const scopes = mmrcConfig.scopes.map(({ name, match }) => ({
        name,
        match,
        exp: new RegExp(parseExp(escapeRegExp(match))),
        configPath: pathStr,
      }));

      return { path: pathStr, dirname: path.dirname(pathStr), mmrcConfig, scopes };
    })

  return scopesFounds;
}


export function readConfig(opts?: { cwd?: string; }) {
  const cwd = opts?.cwd ?? process.cwd();

  const configFounds = readConfigFounds(cwd)

  type A<C> = C extends { scopes: (infer R)[] }[] ? R : never;
  type C = A<typeof configFounds>

  return {
    scopes: configFounds.reduce(
      (a, c) => [
        ...a,
        ...c.scopes,
      ],
      [] as C[],
    )
  }

  // console.log(inspect(readConfigFounds(cwd), { depth: Infinity }));

  // const fileConfig = path.resolve(cwd, ".mmrc.json");

  // const config = !fs.existsSync(fileConfig) ? {} : JSON.parse(fs.readFileSync(fileConfig, "utf8"));

  // const getConfig = (paths: string[]) => {
  //   let c: any = config;
  //   for (const path of paths) {
  //     if (!c) {
  //       return undefined;
  //     }
  //     c = c[path];
  //   }
  //   return c;
  // };

}
