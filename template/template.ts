import { Capture } from "./capture";

const arrEqual = <T = unknown>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
const stringToCodeAt = (str: string): number[] =>
  [...str].map((c, i) => c.charCodeAt(0));

export const compile = (bufTemplate: Buffer, values?: any) => {
  const capture = new Capture();

  // @ts-ignore
  const _values = values;

  const res = Array.from(bufTemplate).reduce(
    (acc, characterBuff, pos, buffInput) => {
      const matchNext = (str: string) =>
        arrEqual(buffInput.slice(pos, pos + str.length), stringToCodeAt(str));
      const matchPrev = (str: string) =>
        arrEqual(
          buffInput.slice(pos + 1 - str.length, pos + 1),
          stringToCodeAt(str)
        );

      if (matchNext("#[[")) {
        capture.start(pos);
      }

      if (matchPrev("]]")) {
        capture.stop(pos);
        if (capture.lastPos) {
          // const commitHelpScript = __filename
          const str = eval(
            Buffer.from(
              buffInput.slice(capture.lastPos[0], capture.lastPos[1] + 1)
            )
              .toString()
              .slice(3, -2)
          );
          return [...acc, ...Buffer.from(JSON.stringify(str))];
        }
      }

      return capture.isUse ? acc : [...acc, characterBuff];
    },
    [] as number[]
  );

  return Buffer.from(res);
};
