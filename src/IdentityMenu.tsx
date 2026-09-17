import { useCallback, useRef, type ReactNode } from 'react'
import { cn } from './cn'
import { Divider } from './Divider'
import { Menu, MenuItem, MenuPanel, MenuRow, MenuSection } from './Menu'
import { Person } from './Person'
import { PersonTrigger } from './PersonTrigger'

/**
 * Who you are, and where you are — the top bar's identity trigger and the
 * menu it opens. Ship's IdentityMenu (2026-09-01), moved in whole: every app
 * needs one, and this one is already made of nothing but shared parts.
 *
 * The trigger is a face and a name, never a key (Ship's ruling A4) — or, with
 * `compact`, the face alone, as Peek's top bar draws it. Anonymous is a
 * silhouette and the word "Anonymous": the truth of the situation rather than
 * eight hex characters posing as a name.
 *
 * The menu keeps the two honest sentences, and the workspace line names the
 * relay because on this substrate the relay *is* the workspace. Every section
 * hides when the app cannot fill it: no `relayUrl`, no workspace section; no
 * `onCopyKey`, no copy item — only offer actions that can succeed. The one
 * place a key appears is as the *result* of "Copy public key" — this
 * component never receives the key, so it cannot show one; the caller
 * copies. Items are text only, no icons (her ruling).
 */
export interface Identity {
  /** From `kind:0`. Absent means anonymous. */
  name?: string
  picture?: string
  /** Known to Estiva ID, never published to the relay. */
  email?: string
}

export interface IdentityMenuProps {
  me: Identity
  /** Signed in through Estiva ID, as opposed to a browser-held key. */
  signedIn: boolean
  /** Names the workspace; absent hides the workspace section. */
  relayUrl?: string
  /** Estiva ID's base URL when this build offers sign-in; absent = anonymous-only build. */
  idBase?: string
  /** "Copy public key" appears only when the app can supply one. */
  onCopyKey?: () => void
  onSignOut?: () => void
  /** Face-only trigger, 36px — no chevron, no name beside it. */
  compact?: boolean
  className?: string
  /**
   * App-specific rows, drawn as their own group between the workspace
   * section and the actions. A function receives `close`, so a row can
   * shut the menu before opening what it opens.
   */
  children?: ReactNode | ((close: () => void) => ReactNode)
}

/**
 * The menu alone, as a plain surface — what the docs canvases draw, and what
 * a surface that wants the rows without the menu can use.
 */
export interface IdentityPanelProps extends Omit<IdentityMenuProps, 'compact'> {
  /** Called when a row asks the menu to close. */
  onClose?: () => void
}

/** The identity rows on a panel of their own, with no menu around them — for a
 *  docs page, or anywhere the panel is already placed. `IdentityMenu` is the
 *  same rows inside a real menu. */
export function IdentityPanel({ className, onClose = () => {}, ...rest }: IdentityPanelProps) {
  return (
    <MenuPanel className={cn('w-72', className)}>
      <IdentityRows {...rest} onClose={onClose} />
    </MenuPanel>
  )
}

/** The old name for the same thing. */
export const IdentityPanelSurface = IdentityPanel

/**
 * The panel's contents, without the menu around them.
 *
 * Split out at stage 4 for the same reason `MenuPanel` was split out of
 * `Menu`: a real menu portals and places itself against a trigger, so it
 * cannot stand in a docs page, and the canvases must still show the artifact
 * (Katerina, D25). The stories draw these rows on a `MenuPanel`; the app gets
 * them inside a `Menu`. One definition either way.
 *
 * Not exported from the package — `IdentityMenu` and `IdentityPanel` are the
 * API; this is how they are built.
 */
export function IdentityRows({ me, signedIn, relayUrl, idBase, onCopyKey, onSignOut, onClose, children }: Omit<IdentityPanelProps, 'className'> & { onClose: () => void }) {
  const act = (action: () => void) => () => {
    onClose()
    action()
  }
  const appRows = typeof children === 'function' ? children(onClose) : children
  return (
    <>
      <MenuSection label={signedIn ? 'Signed in as' : 'Acting as'}>
        <MenuRow>
          {/* A name takes the size of where it sits (UIG-9). */}
          <div className="flex min-w-0 text-body-2-strong">
            <Person name={me.name} picture={me.picture} fallback="Anonymous" size={28} />
          </div>
        </MenuRow>
        <Note>
          {signedIn
            ? 'Your Estiva ID. The same person you are in every Estiva app.'
            : 'A key held by this browser only. Nobody else knows who you are.'}
        </Note>
        {me.email && <Note>{me.email} · known to Estiva, never published to the relay</Note>}
      </MenuSection>

      {relayUrl && (
        <>
          <Divider className="mx-0 my-2" />
          <MenuSection label="Workspace">
            <MenuRow>
              <span className="break-all font-mono text-caption text-text-primary">{relayUrl}</span>
            </MenuRow>
            <Note>Everyone on this relay shares this workspace, in every app.</Note>
          </MenuSection>
        </>
      )}

      {appRows && (
        <>
          <Divider className="mx-0 my-2" />
          {appRows}
        </>
      )}

      {(signedIn && idBase) || onCopyKey || (idBase && onSignOut) ? <Divider className="mx-0 my-2" /> : null}

      {signedIn && idBase && (
        <MenuItem
          label="Edit your profile in Estiva ID"
          onClick={act(() => window.open(idBase, '_blank', 'noopener,noreferrer'))}
        />
      )}
      {onCopyKey && <MenuItem label="Copy public key" onClick={act(onCopyKey)} />}
      {idBase && onSignOut && <MenuItem label="Sign out" onClick={act(onSignOut)} />}
    </>
  )
}

export function IdentityMenu({ me, signedIn, relayUrl, idBase, onCopyKey, onSignOut, compact = false, className, children }: IdentityMenuProps) {
  /*
   * The menu owns the trigger (stage 4, 2026-09-08). It used to be the other
   * way round — this component held `open`, and the panel hung from a ref to
   * the wrapper — and four separate defects came from Base UI not knowing
   * which element opened it: the face stopped closing its own menu, opening
   * from the keyboard highlighted nothing, a hovered submenu row unmounted
   * the panel, and the panel hung from a wrapper the app's layout could
   * stretch. `PLAN.md` §6.2 has the measurements.
   */
  const actions = useRef<{ close: () => void; unmount: () => void } | null>(null)
  const close = useCallback(() => actions.current?.close(), [])
  return (
    /* The wrapper carries the caller's `className` and nothing else. It used
       to be `relative`, because the panel was positioned against it; the panel
       hangs from the trigger and portals now, so a positioning context here
       would only be a lie about what this box does. */
    <div className={className}>
      <Menu
        align="right"
        actionsRef={actions}
        className="w-72"
        trigger={
          <PersonTrigger
            name={me.name}
            picture={me.picture}
            fallback="Anonymous"
            compact={compact}
            size={compact ? 36 : undefined}
            /* The row shape is named by its own text — the person. Only the
               bare face needs a label; naming the row would override the
               person's name as the accessible name (Ship's tests find the
               trigger by it). */
            aria-label={compact ? 'Account menu' : undefined}
          />
        }
      >
        <IdentityRows
          me={me}
          signedIn={signedIn}
          relayUrl={relayUrl}
          idBase={idBase}
          onCopyKey={onCopyKey}
          onSignOut={onSignOut}
          onClose={close}
        >
          {children}
        </IdentityRows>
      </Menu>
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <span className="px-2 pb-1.5 text-caption text-text-secondary">{children}</span>
}
