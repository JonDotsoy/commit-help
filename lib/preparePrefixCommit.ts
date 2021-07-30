import { listGitStatus } from "../listGitStatus";
import { readConfig } from "../readConfig";

export function preparePrefixCommit(
  config: ReturnType<typeof readConfig>,
  status: ReturnType<typeof listGitStatus>,
  type: string = "feat"
) {
  const filesMatch = status
    .map(({ flag, path, flagDesc, dirname }) => {
      const scope = config.scopes.find((c) => c.exp.test(path)) ?? null;
      if (!scope) return null;
      return {
        flag,
        path,
        flagDesc,
        dirname,
        scope,
        // [``]: scope.exp.exec(path),
      };
    })
    .filter(<T>(c: T): c is Exclude<T, null> => c !== null)
    .sort((a, b) => a.dirname.length - b.dirname.length)
    .filter((c) => ["M ", "A "].includes(c.flag));

  const firstMatch = filesMatch?.[0];

  if (!firstMatch) {
    return `${type}:`;
  } else {
    return `${type}(${firstMatch.scope.name}):`;
  }
}
