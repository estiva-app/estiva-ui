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
export { AppShell, type AppShellProps } from './AppShell'
export { Avatar, hueFor, initialsFor, type AvatarProps } from './Avatar'
export { AvatarGroup, type AvatarGroupMember, type AvatarGroupProps } from './AvatarGroup'
export { Banner, type BannerProps, type BannerTone } from './Banner'
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button'
export { Checkbox, type CheckboxProps } from './Checkbox'
export { Chip, type ChipProps, type ChipType } from './Chip'
export { ChipInput, InputChip, type ChipInputOption, type ChipInputProps, type InputChipProps } from './ChipInput'
export { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton'
export { Kbd, type KbdProps } from './Kbd'
export { IdentityMenu, IdentityPanel, type Identity, type IdentityMenuProps, type IdentityPanelProps } from './IdentityMenu'
export { Tooltip, WithTooltip, type TooltipProps, type WithTooltipProps } from './Tooltip'
export { Field, useFieldControlId, type FieldProps } from './Field'
export { Select, type SelectOption, type SelectProps } from './Select'
export { TextInput, type TextInputProps } from './TextInput'
export { Textarea, type TextareaProps } from './Textarea'
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'
export { DialogShell, type DialogShellProps } from './DialogShell'
export { Divider, type DividerProps } from './Divider'
export { EditableText, type EditableTextProps } from './EditableText'
export { EmptyState, type EmptyStateProps } from './EmptyState'
export { SkeletonBar, SkeletonList, SkeletonRow } from './Skeleton'
export { Breadcrumb, type BreadcrumbProps, type Crumb } from './Breadcrumb'
export { EnterHint, Menu, MenuItem, MenuPanel, MenuRow, MenuSection, MenuSub, type MenuItemProps, type MenuPanelProps, type MenuProps, type MenuSubProps } from './Menu'
export { clampBox, fitMenu, fitSubmenu } from './fit'
export { NavItem, type NavItemProps } from './NavItem'
export { Person, type PersonProps } from './Person'
export { Rail, type RailProps } from './Rail'
export { RailItem, type RailItemProps } from './RailItem'
export { Sidebar, type SidebarProps } from './Sidebar'
export { TopBar, type TopBarProps } from './TopBar'
export { PersonTrigger, type PersonTriggerProps } from './PersonTrigger'
export { Property, type PropertyProps } from './Property'
export { Reaction, type ReactionProps } from './Reaction'
export { SearchInput, type SearchInputProps } from './SearchInput'
export { SectionHeader, type SectionAction, type SectionHeaderProps } from './SectionHeader'
export { SectionLabel } from './SectionLabel'
export { Tabs, type TabDef, type TabsProps } from './Tabs'
export { Toast, ToastProvider, useToast, type ToastOptions, type ToastProps, type ToastType } from './Toast'
export { cn } from './cn'
