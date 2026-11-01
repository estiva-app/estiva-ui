// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ReactionHorizon } from './ReactionHorizon'

afterEach(cleanup)

describe('ReactionHorizon', () => {
  it('says how far back reactions are read, in the kit’s words', () => {
    render(<ReactionHorizon limit={100} omitted={3} />)
    expect(screen.getByText(/the latest 100 comments and replies here\. 3 older ones were not checked\./)).toBeTruthy()
  })

  it('in the app’s own noun: Peek’s messages', () => {
    render(<ReactionHorizon limit={100} omitted={1} noun="messages" />)
    expect(screen.getByText(/the latest 100 messages and replies here\. 1 older one was not checked\./)).toBeTruthy()
  })

  it('draws nothing when every one was checked and the read was whole', () => {
    const { container } = render(<ReactionHorizon limit={100} omitted={0} />)
    expect(container.textContent).toBe('')
  })
})
