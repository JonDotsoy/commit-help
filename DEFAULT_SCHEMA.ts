import path from "path";
import { pkg } from "./pkg";

export const DEFAULT_SCHEMA_PATH = path.resolve(
  `${__dirname}/mmrc.schema.json`
);

export const DEFAULT_SCHEMA_URL = `https://unpkg.com/${pkg.name}@${pkg.version}/mmrc.schema.json`;
