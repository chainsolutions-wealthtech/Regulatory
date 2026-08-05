import { createHash } from "node:crypto";
import { stableStringify } from "./stable-json.js";

/** @param {unknown} value */
export function hashObject(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

/** @param {string} value */
export function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}
