/**
 * `@estiva-app/ui/registry` — the component catalogue (UIG-12, seam S2).
 *
 * The one copy, here, as every gate piece is (docs/GATES.md §23): the skill
 * (UIG-20), the copy detector (UIG-25) and the merged search (UIG-19) read
 * this, and no repo keeps a parser of its own.
 *
 * The data itself is `registry.json` at the package's root, committed and
 * shipped. Read it with `estiva-ui find`, or import these to read it yourself.
 */
export { buildRegistry, readIndexExports, serializeRegistry, type BuildOptions } from './build'
export { docsLink, findInRegistry, formatFindings, type Finding } from './find'
export {
  SCHEMA_VERSION,
  validateRegistry,
  type EntryBehaviour,
  type EntryKind,
  type EntryStatus,
  type EntryVariant,
  type PurposeSource,
  type Registry,
  type RegistryEntry,
  type RegistryExclusion,
} from './schema'
