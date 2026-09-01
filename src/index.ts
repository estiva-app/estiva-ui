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
export { Breadcrumb, type BreadcrumbProps, type Crumb } from './Breadcrumb'
export { EnterHint, Menu, MenuItem, MenuRow, MenuSection, type MenuItemProps, type MenuProps } from './Menu'
export { Person, type PersonProps } from './Person'
export { PersonTrigger, type PersonTriggerProps } from './PersonTrigger'
export { Property, type PropertyProps } from './Property'
export { SearchInput, type SearchInputProps } from './SearchInput'
export { SectionHeader, type SectionAction, type SectionHeaderProps } from './SectionHeader'
export { SectionLabel } from './SectionLabel'
export { Tabs, type TabDef, type TabsProps } from './Tabs'
export { Toast, ToastProvider, useToast, type ToastOptions, type ToastProps, type ToastType } from './Toast'
export { cn } from './cn'
