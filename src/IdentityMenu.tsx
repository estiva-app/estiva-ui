import { useState, type ReactNode } from 'react'
import { cn } from './cn'
import { Divider } from './Divider'
import { Menu, MenuItem, MenuRow, MenuSection } from './Menu'
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
  /** Known to Estiva ID, never published to the relay (PEEK-50). */
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
  /** Face-only trigger — Peek's top-bar shape (36px). */
  compact?: boolean
  className?: string
}

export function IdentityMenu({ me, signedIn, relayUrl, idBase, onCopyKey, onSignOut, compact = false, className }: IdentityMenuProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const act = (action: () => void) => () => {
    close()
    action()
  }

  return (
    <div className={cn('relative', className)}>
      <PersonTrigger
        name={me.name}
        picture={me.picture}
        fallback="Anonymous"
        compact={compact}
        size={compact ? 36 : undefined}
        open={open}
        // Swallowed so the menu's outside-mousedown dismiss does not fire
        // first and turn the toggle into a close-then-reopen flicker.
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => setOpen((value) => !value)}
        // The row shape is named by its own text — the person. Only the bare
        // face needs a label; naming the row would override the person's name
        // as the accessible name (Ship's tests find the trigger by it).
        aria-label={compact ? 'Account menu' : undefined}
      />

      {open && (
        <Menu onClose={close} className="w-72">
          <MenuSection label={signedIn ? 'Signed in as' : 'Acting as'}>
            <MenuRow>
              <Person name={me.name} picture={me.picture} fallback="Anonymous" size={28} className="text-body-2-strong" />
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

          {(signedIn && idBase) || onCopyKey || (idBase && onSignOut) ? <Divider className="mx-0 my-2" /> : null}

          {signedIn && idBase && (
            <MenuItem
              label="Edit your profile in Estiva ID"
              onClick={act(() => window.open(idBase, '_blank', 'noopener,noreferrer'))}
            />
          )}
          {onCopyKey && <MenuItem label="Copy public key" onClick={act(onCopyKey)} />}
          {idBase && onSignOut && <MenuItem label="Sign out" onClick={act(onSignOut)} />}
        </Menu>
      )}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <span className="px-2 pb-1.5 text-caption text-text-secondary">{children}</span>
}
