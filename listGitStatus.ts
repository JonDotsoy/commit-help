import { spawnSync } from "child_process";
import path from "path";

/*
 * Table of relations status flags
 *
 * X          Y     Meaning
 * -------------------------------------------------
 *          [AMD]   not updated
 * M        [ MD]   updated in index
 * A        [ MD]   added to index
 * D                deleted from index
 * R        [ MD]   renamed in index
 * C        [ MD]   copied in index
 * [MARC]           index and work tree matches
 * [ MARC]     M    work tree changed since index
 * [ MARC]     D    deleted in work tree
 * [ D]        R    renamed in work tree
 * [ D]        C    copied in work tree
 * -------------------------------------------------
 * D           D    unmerged, both deleted
 * A           U    unmerged, added by us
 * U           D    unmerged, deleted by them
 * U           A    unmerged, added by them
 * D           U    unmerged, deleted by us
 * A           A    unmerged, both added
 * U           U    unmerged, both modified
 * -------------------------------------------------
 * ?           ?    untracked
 * !           !    ignored
 * -------------------------------------------------
 */
const describeStatusFlag = (status: string) => {
  switch (status) {
    case "  ":
      return "not updated";
    case "M ":
      return "updated in index";
    case "A ":
      return "added to index";
    case "D ":
      return "deleted from index";
    case "R ":
      return "renamed in index";
    case "C ":
      return "copied in index";
    case "  ":
      return "index and work tree matches";
    case " M":
      return "work tree changed since index";
    case " D":
      return "deleted in work tree";
    case " R":
      return "renamed in work tree";
    case " C":
      return "copied in work tree";
    case "DD":
      return "unmerged, both deleted";
    case "AU":
      return "unmerged, added by us";
    case "UD":
      return "unmerged, deleted by them";
    case "UA":
      return "unmerged, added by them";
    case "DU":
      return "unmerged, deleted by us";
    case "AA":
      return "unmerged, both added";
    case "UU":
      return "unmerged, both modified";
    case "??":
      return "untracked";
    case "!!":
      return "ignored";
    default:
      return null;
  }
};

// escapeRegExp("file/path")
export function listGitStatus(opts?: { cwd?: string }) {
  const cwd = opts?.cwd ?? process.cwd();

  const result = spawnSync("git", ["status", "-s"], { cwd });

  if (result.status !== 0) {
    throw new Error(
      `git status failed with status ${
        result.status
      }:\n${result.stderr.toString()}`
    );
  }

  let n = 0;
  const stdout = result.stdout;
  const items: {
    flag: string;
    flagDesc: string | null;
    dirname: string;
    path: string;
    [k: string]: any;
  }[] = [];

  const walkSpaces = () => {
    const nInit = n;
    while (stdout[n] === " ".charCodeAt(0)) {
      n++;
    }
    return [nInit, n];
  };

  const walkOptionalSpaces = () => {
    const nInit = n;
    if (stdout[n] === " ".charCodeAt(0)) {
      walkSpaces();
    }
    return [nInit, n] as const;
  };

  const walkToNewLine = () => {
    const nInit = n;
    while (stdout[n] !== 10) {
      n++;
    }
    return [nInit, n];
  };

  const walkStatusSymbol = () => {
    const nInit = n;
    while (stdout[n] !== " ".charCodeAt(0)) {
      n++;
    }
    return [nInit, n];
  };

  const walkNewLine = () => {
    const nInit = n;
    while (stdout[n] === 10) {
      n++;
    }
    return [nInit, n];
  };

  const walkXStatusX = () => {
    const nInit = n;
    n++;
    return [nInit, n];
  };

  // walkOptionalSpaces();
  const steps = stdout.filter((charCode) => charCode === "\n".charCodeAt(0));

  const resolvePath = (pathStr: string) => {
    const tFullPath = (pStr: string) => path.resolve(cwd, pStr);

    if (pathStr.startsWith('"') && pathStr.endsWith('"')) {
      return tFullPath(JSON.parse(pathStr));
    }

    return tFullPath(pathStr);
  };

  for (let i = 0; i < steps.length; i++) {
    const statusX = walkXStatusX();
    const statusY = walkXStatusX();
    // const bufFlags = walkStatusSymbol();
    walkSpaces();
    const bufPath = walkToNewLine();
    walkNewLine();

    const flag = Buffer.concat([
      stdout.subarray(...statusX),
      stdout.subarray(...statusY),
    ]).toString("utf8");

    const pathStr = resolvePath(stdout.subarray(...bufPath).toString());

    items.push({
      // statusX,
      // statusY,
      flag,
      flagDesc: describeStatusFlag(flag),
      path: pathStr,
      dirname: path.dirname(pathStr),
    });
  }

  return items;
}
