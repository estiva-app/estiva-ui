import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { ArchiveDialog } from './ArchiveDialog'

/**
 * The question before archiving a file or a team: what goes with it,
 * counted, and an optional resolution. The apps it goes out of and the last
 * line are the caller's words; these are Peek's, and Ship's in its own story.
 */
const meta = {
  title: 'Menus & windows/ArchiveDialog',
  component: ArchiveDialog,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '560px' } },
  },
  argTypes: { onArchive: { control: false }, onClose: { control: false } },
  args: {
    title: 'Conversation standard',
    what: 'project',
    hides: ['14 issues'],
    apps: ['Peek', 'Ship'],
    getBack: 'Nothing is deleted: it waits under Archive, where Unarchive brings everything back as it was.',
    onClose: () => {},
    onArchive: async () => true,
  },
} satisfies Meta<typeof ArchiveDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A project and the issues that go with it. */
export const AProject: Story = { name: 'A project' }

/** A topic with nothing under it: only the topic goes. */
export const ATopic: Story = {
  name: 'A topic',
  args: { title: 'Release notes', what: 'topic', hides: [] },
}

/** A team: what only it lists goes, and what another team lists stays there. */
export const AFolder: Story = {
  name: 'A team',
  args: { title: 'Estiva HQ', what: 'team', hides: ['3 projects', '6 topics'], staysVisible: ['2 files also in Steer'] },
}

/** Opened before the count is in: it says it is counting, and Archive waits. */
export const Counting: Story = {
  args: { title: 'Estiva HQ', what: 'team', hides: null },
}

/** Another app's words: the apps in its order, and its own last line. */
export const AnotherAppsWords: Story = {
  name: "Another app's words",
  args: { apps: ['Ship', 'Peek'], getBack: 'Nothing is deleted: a link still opens it, and Unarchive brings everything back as it was.' },
}

/** Archiving: the field and both buttons wait for the answer. */
export const Archiving: Story = {
  args: { onArchive: () => new Promise<boolean>(() => {}) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Archive project' }))
  },
}
