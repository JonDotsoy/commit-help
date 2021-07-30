import { DEFAULT_SCHEMA_URL } from "./DEFAULT_SCHEMA";
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
          $schema: DEFAULT_SCHEMA_URL,
          scopes: [],
        },
        null,
        2
      )
    );
    return true;
  }
}
