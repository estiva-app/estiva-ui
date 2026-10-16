import { userEvent } from 'storybook/test'
import type { BoxState } from './parts'

/**
 * Every state, as a story in each place. The four story files take their
 * stories from here so the places stay in step.
 */

const hoverFirstReaction = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const pill = canvasElement.querySelector<HTMLElement>('[data-reaction-row] button')
  if (pill) await userEvent.hover(pill)
}

export const story = (state: BoxState, name: string) => ({
  name,
  args: { state },
  ...(state === 'manyReactions' ? { play: hoverFirstReaction } : {}),
})
