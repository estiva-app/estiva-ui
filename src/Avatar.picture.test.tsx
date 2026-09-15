// @vitest-environment jsdom
/**
 * A face's picture in its three moments, as the Avatar page claims them: the
 * `<img>` is there from the first render and the tile shows nothing else while
 * it loads; once it loads the initials are gone; if it fails, the initials.
 *
 * jsdom never loads an image, so the tests fire the `<img>`'s own events.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Avatar } from './Avatar'

afterEach(cleanup)

const tile = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe('Avatar picture', () => {
  it('the <img> is in the tile from the first render, with its address', () => {
    const { container } = render(<Avatar name="Ana Duarte" src="https://example.test/face.png" />)
    const img = tile(container).querySelector('img')
    expect(img?.getAttribute('src')).toBe('https://example.test/face.png')
    // First in the tile, so it covers it; the initials wait below the hidden overflow.
    expect(tile(container).firstElementChild).toBe(img)
  })

  it('once the picture loads, the initials are gone', () => {
    const { container } = render(<Avatar name="Ana Duarte" src="https://example.test/face.png" />)
    fireEvent.load(tile(container).querySelector('img')!)
    expect(tile(container).textContent).toBe('')
    expect(tile(container).querySelector('img')?.hasAttribute('data-error')).toBe(false)
  })

  it('if the picture fails, it is hidden and the initials show', () => {
    const { container } = render(<Avatar name="Ana Duarte" src="https://example.test/face.png" />)
    const img = tile(container).querySelector('img')!
    fireEvent.error(img)
    expect(img.hasAttribute('data-error')).toBe(true)
    expect(img.className).toContain('data-[error]:hidden')
    expect(tile(container).textContent).toBe('AD')
  })

  it('no picture: the initials, and no <img>', () => {
    const { container } = render(<Avatar name="Ana Duarte" />)
    expect(tile(container).querySelector('img')).toBeNull()
    expect(tile(container).textContent).toBe('AD')
  })

  it('the initials are centred on their capitals, not their line box (D27)', () => {
    const { container } = render(<Avatar name="Ana Duarte" />)
    const initials = tile(container).querySelector('span')
    expect(initials?.textContent).toBe('AD')
    expect(initials?.className).toBe('[text-box:trim-both_cap_alphabetic]')
  })

  it('no picture and no name: the silhouette', () => {
    const { container } = render(<Avatar />)
    expect(tile(container).querySelector('svg')).not.toBeNull()
    expect(tile(container).textContent).toBe('')
  })
})
