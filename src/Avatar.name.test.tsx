// @vitest-environment jsdom
/**
 * What a face is called, everywhere one appears.
 *
 * These are the names an app's own tests compute — `getByRole('button', { name })`
 * runs the same algorithm — and every one of them was wrong until 2026-09-08:
 * a face read as its initials, and a face beside a name read the name twice.
 * The initials are a drawing of a name, not text.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'
import { MenuItem, MenuPanel } from './Menu'
import { Person } from './Person'
import { PersonTrigger } from './PersonTrigger'

afterEach(cleanup)

/**
 * `getByRole`'s `name` matches the *accessible* name exactly, computed by the
 * same algorithm a browser uses — so a query that finds nothing is the failure
 * being asserted, and the message names what it looked for. This is also how
 * both apps query their own controls, which is what makes it the right test.
 */

describe('a face beside a name says nothing of its own', () => {
  it('a button holding a Person is called the person, once', () => {
    render(
      <button type="button">
        <Person name="Ana Duarte" />
      </button>,
    )
    // "AD Ana Duarte" before: the initials were read as text.
    expect(screen.getByRole('button', { name: 'Ana Duarte' })).toBeTruthy()
  })

  it('and once when there is a picture rather than initials', () => {
    render(
      <button type="button">
        <Person name="Ana Duarte" picture="/a.png" />
      </button>,
    )
    // "Ana Duarte Ana Duarte" before: the alt text and the name were both read.
    expect(screen.getByRole('button', { name: 'Ana Duarte' })).toBeTruthy()
  })

  it('a menu row led by a face is called by its label', () => {
    render(
      <MenuPanel>
        <MenuItem label="Ana Duarte" leading={<Avatar name="Ana Duarte" size={32} />} onClick={() => {}} />
      </MenuPanel>,
    )
    expect(screen.getByRole('button', { name: 'Ana Duarte' })).toBeTruthy()
  })

  it('a bare face is not in the accessibility tree at all', () => {
    const { container } = render(<Avatar name="Ana Duarte" />)
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('a face that stands on its own says whose it is', () => {
  it('the compact PersonTrigger is called the person', () => {
    render(<PersonTrigger name="Ana Duarte" compact />)
    // "AD" before — the initials, and the only name the control had.
    expect(screen.getByRole('button', { name: 'Ana Duarte' })).toBeTruthy()
  })

  it('a caller may name the destination instead', () => {
    render(<PersonTrigger name="Ana Duarte" compact aria-label="Account menu" />)
    expect(screen.getByRole('button', { name: 'Account menu' })).toBeTruthy()
  })

  it('an unnamed person falls back to what the caller calls them', () => {
    render(<PersonTrigger fallback="Anonymous" compact />)
    expect(screen.getByRole('button', { name: 'Anonymous' })).toBeTruthy()
  })

  it('the row shape is called the person, without the initials in front', () => {
    render(<PersonTrigger name="Ana Duarte" />)
    expect(screen.getByRole('button', { name: 'Ana Duarte' })).toBeTruthy()
  })

  it('a stack of faces names each of them', () => {
    render(<AvatarGroup members={[{ name: 'Ana Duarte' }, { name: 'Ben Carter' }]} />)
    // "AD" and "BC" before.
    expect(screen.getAllByRole('img').map((el) => el.getAttribute('aria-label'))).toEqual(['Ana Duarte', 'Ben Carter'])
  })
})

describe('the compact trigger keeps a focus ring', () => {
  /** `focus:outline-none` took the browser's ring away and put nothing back,
   *  so the account trigger had no visible focus at all. */
  it('does not remove its own outline', () => {
    render(<PersonTrigger name="Ana Duarte" compact />)
    expect(screen.getByRole('button').className).not.toContain('outline-none')
  })
})
