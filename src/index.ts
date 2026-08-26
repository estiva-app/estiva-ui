/**
 * @estiva-app/ui — the primitives.
 *
 * Shipped **built**: `dist/index.js` (esbuild, one bundle, React external) plus
 * `.d.ts` from `tsc`. Not source — a package of `.ts` is compiled with the
 * *consumer's* tsconfig, and Ship's `noUnusedLocals` alone is enough to fail a
 * build over a library it does not own. See estiva-docs ADR 0002 §4a.
 *
 * `src/` still ships in the tarball, so stepping into a component lands on the
 * TypeScript that produced it.
 */
export { Avatar, hueFor, initialsFor, type AvatarProps } from './Avatar'
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button'
export { Chip, type ChipProps, type ChipType } from './Chip'
export { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton'
export { Tooltip, WithTooltip, type TooltipProps, type WithTooltipProps } from './Tooltip'
export { Field, type FieldProps } from './Field'
export { Select, type SelectOption, type SelectProps } from './Select'
export { TextInput, type TextInputProps } from './TextInput'
export { Textarea, type TextareaProps } from './Textarea'
export { DialogShell, type DialogShellProps } from './DialogShell'
export { Divider, type DividerProps } from './Divider'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { SkeletonBar, SkeletonList, SkeletonRow } from './Skeleton'
export { cn } from './cn'
