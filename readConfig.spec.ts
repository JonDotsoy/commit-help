import { resolveFileExpression } from "./readConfig";

describe("resolveFileExpression", () => {
  it("should resolve file expression", () => {
    const resolvedPath1 = resolveFileExpression("$DIRNAME/d/e/f/**", {
      cwd: "/root",
    });
    const resolvedPath2 = resolveFileExpression("$DIRNAME/d/e/f/*.svg", {
      cwd: "/root",
    });

    expect(resolvedPath1).toMatchInlineSnapshot(
      `/\\^\\\\/root\\\\/d\\\\/e\\\\/f\\\\/\\.\\*\\$/i`
    );
    expect(resolvedPath1.test("/root/d/e/f/g/h/i")).toMatchInlineSnapshot(
      `true`
    );

    expect(resolvedPath2).toMatchInlineSnapshot(
      `/\\^\\\\/root\\\\/d\\\\/e\\\\/f\\\\/\\[\\^/\\]\\*\\\\\\.svg\\$/i`
    );
    expect(resolvedPath2.test("/root/d/e/f/fa.das.svg")).toMatchInlineSnapshot(
      `true`
    );
    expect(resolvedPath2.test("/root/d/e/f/fa.das.svg/")).toMatchInlineSnapshot(
      `false`
    );
  });
});
