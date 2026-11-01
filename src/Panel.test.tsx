// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Panel } from './Panel'

afterEach(cleanup)

function Breaks(): never {
  throw new Error('the body broke')
}

describe('Panel', () => {
  it('draws its own bar from its title', () => {
    render(<Panel title="Details">Body</Panel>)
    expect(screen.getByText('Details')).toBeTruthy()
  })

  it('draws a page’s own bar in place of its own, with `header`', () => {
    render(
      <Panel title="Details" header={<div>The page’s bar</div>}>
        Body
      </Panel>,
    )
    expect(screen.getByText('The page’s bar')).toBeTruthy()
    expect(screen.queryByText('Details')).toBeNull()
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('keeps its title when it breaks, even with a page’s bar, which may be what broke', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <Panel title="Details" header={<div>The page’s bar</div>}>
        <Breaks />
      </Panel>,
    )
    expect(screen.getByText('Details')).toBeTruthy()
    expect(screen.queryByText('The page’s bar')).toBeNull()
    vi.restoreAllMocks()
  })
})
