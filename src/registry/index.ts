/**
 * `@estiva-app/ui/registry` — the component catalogue (UIG-12, seam S2).
 *
 * The one copy, here, as every gate piece is (docs/GATES.md §23): the skill
 * (UIG-20), the copy detector (UIG-25) and the merged search (UIG-19) read
 * this, and no repo keeps a parser of its own.
 *
 * The data itself is `registry.json` at the package's root, committed and
 * shipped. Read it with `estiva-ui find`, or import these to read it yourself.
 * An app's own catalogue (UIG-13) is built from its code with
 * `buildAppRegistry` each time it is read, and never committed.
 */
export { buildRegistry, readIndexExports, serializeRegistry, type BuildOptions } from './build'
export { buildAppRegistry, type AppBuildOptions } from './app'
export { CONTRACT_KINDS, NO_ALTERNATIVE, PAGE_SECTIONS, contractProblems, hasSeenIn, linkProblems, namedParts, pageProblem, whenNotProblem } from './contract'
export { docsLink, findInRegistries, findInRegistry, formatFindings, type Finding } from './find'
export {
  CLASSES,
  SCHEMA_VERSION,
  validateRegistry,
  type AppFacts,
  type EntryBehaviour,
  type EntryClass,
  type FileWithoutPart,
  type EntryKind,
  type EntryStatus,
  type EntryVariant,
  type PurposeSource,
  type Registry,
  type RegistryEntry,
  type RegistryExclusion,
} from './schema'
