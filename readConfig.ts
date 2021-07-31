import path from "path";
import fs from "fs";
import yaml from "yaml";
import escapeRegExp from "lodash/escapeRegExp";

const file = (pathStr: string) => {
  const fileExists = fs.existsSync(pathStr);
  if (!fileExists) {
    return null;
  }
  return pathStr;
};

const parseFile = (pathStr: string) => {
  switch (path.extname(pathStr)) {
    case ".yaml":
    case ".yml":
      return yaml.parse(fs.readFileSync(pathStr, "utf8"));
    case ".json":
      return JSON.parse(fs.readFileSync(pathStr, "utf8"));
    default:
      throw new Error(`Unsupported file type: ${path.extname(pathStr)}`);
  }
};

const reducePathModule = (pathStr: string) => {
  const proposalMMRCPath =
    file(path.resolve(`${pathStr}/.mmrc.json`)) ??
    file(path.resolve(`${pathStr}/.mmrc.yml`)) ??
    file(path.resolve(`${pathStr}/.mmrc.yaml`));
  const proposalPathPackageJsonFile = path.resolve(`${pathStr}/package.json`);

  if (proposalMMRCPath) {
    const data: unknown = parseFile(proposalMMRCPath);
    return { path: proposalMMRCPath, mmrcConfig: data };
  }

  if (fs.existsSync(proposalPathPackageJsonFile)) {
    const data: unknown = JSON.parse(
      fs.readFileSync(proposalPathPackageJsonFile, "utf8")
    );

    const withMMRCParameter = (data: any): data is { mmrc: unknown } =>
      data && typeof data === "object" && typeof data.mmrc === "object";

    if (withMMRCParameter(data)) {
      return { path: proposalPathPackageJsonFile, mmrcConfig: data.mmrc };
    }
  }

  return null;
};

const pathToDirectories = (pathStr: string): string[] => {
  const acumPaths = new Set<string>([pathStr]);
  const pathParts = pathStr.split(path.sep);

  let subPath = pathStr;
  for (let i = 0; i < pathParts.length; i++) {
    subPath = path.dirname(subPath);
    acumPaths.add(subPath);
  }

  return Array.from(acumPaths);
};

export const resolveFileExpression = (
  pathExpStr: string,
  opts: { cwd: string }
) => {
  const a = escapeRegExp(pathExpStr).replace(
    /(?<expr>(?:\\\$CWD|\\\$DIRNAME)|\\\*\\\*|\\\*)/g,
    (str, expr) => {
      switch (expr) {
        case "\\*\\*":
          return ".*";
        case "\\*":
          return "[^/]*";
        case "\\$DIRNAME":
        case "\\$CWD":
          return opts.cwd;
        default:
          return expr;
      }
    }
  );

  return new RegExp(`^${a}$`, "i");
};

const readConfigFounds = function (cwd: string) {
  const founds = pathToDirectories(cwd)
    .map(reducePathModule)
    .filter(<T>(p: T): p is Exclude<T, null> => p !== null);

  type ScopeConfig = {
    name: string;
    match: string;
  };

  const isMMRCConfigScopes = (v: any): v is ScopeConfig =>
    typeof v === "object" &&
    typeof v.name === "string" &&
    typeof v.match === "string";

  const isMMRCConfig = <T extends { mmrcConfig: any }>(
    v: T
  ): v is T & { mmrcConfig: { scopes: ScopeConfig[] } } =>
    typeof v === "object" &&
    "mmrcConfig" in v &&
    Array.isArray(v.mmrcConfig.scopes) &&
    v.mmrcConfig.scopes.every(isMMRCConfigScopes);

  const scopesFounds = founds
    .filter(isMMRCConfig)
    .map(({ path: pathStr, mmrcConfig }) => {
      const parseExp = (exprStr: string) =>
        resolveFileExpression(exprStr, { cwd: path.dirname(pathStr) });

      const scopes = mmrcConfig.scopes.map(({ name, match }) => ({
        name,
        match,
        exp: parseExp(match),
        configPath: pathStr,
      }));

      return {
        path: pathStr,
        dirname: path.dirname(pathStr),
        mmrcConfig,
        scopes,
      };
    });

  return scopesFounds;
};

export function readConfig(opts?: { cwd?: string }) {
  const cwd = opts?.cwd ?? process.cwd();

  const configFounds = readConfigFounds(cwd);

  type A<C> = C extends { scopes: (infer R)[] }[] ? R : never;
  type C = A<typeof configFounds>;

  return {
    scopes: configFounds.reduce((a, c) => [...a, ...c.scopes], [] as C[]),
  };

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
