/**
 * Compatibility adapter.
 *
 * The regulatory catalogue is generated from the canonical CIRC005 matrices by
 * scripts/generate-web-regulatory-catalog.mjs. Do not add regulatory questions
 * manually in this file.
 */
export {
  CATALOG_METADATA,
  KNOWN_QUESTION_IDS,
  QUESTION_GROUPS,
  QUESTIONS,
  REGULATORY_QUESTION_IDS,
  REGULATORY_REQUIREMENTS,
  REQUIREMENT_IDS,
  createEmptyCoverage,
  getQuestionById,
} from "./regulatory-catalog";
