// @vitest-environment jsdom
/**
 * What the page claims: one icon per kind of thing, the same in every app; an initiative (`topic`) wears ◎, the icon
 * Peek's rail and rows draw (Katerina, 18 November), no longer the dashed circle; a team chat's channel and a bare
 * file are both read as one.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { KindIcon, thingKindOf } from './KindIcon'

afterEach(cleanup)

const iconOf = (container: HTMLElement) => container.querySelector('svg')?.getAttribute('class') ?? ''

describe('KindIcon', () => {
  it('draws an initiative as ◎, not the dashed circle', () => {
    const { container } = render(<KindIcon kind="topic" />)
    expect(iconOf(container)).toContain('tabler-icon-target')
    expect(iconOf(container)).not.toContain('circle-dashed')
  })

  it('reads a bare file as an initiative', () => {
    expect(thingKindOf(30840)).toBe('topic')
  })
})
