import { DEFAULT_SCHEMA_PATH } from "./DEFAULT_SCHEMA_PATH";
import fs from "fs";

export class App {
  initializeMMRC() {
    const mmrcFileExists = fs.existsSync(`${process.cwd()}/.mmrc.json`);
    if (mmrcFileExists) {
      return false;
    }
    fs.writeFileSync(
      `${process.cwd()}/.mmrc.json`,
      JSON.stringify(
        {
          $schema: DEFAULT_SCHEMA_PATH,
          scopes: [],
        },
        null,
        2
      )
    );
    return true;
  }
}
