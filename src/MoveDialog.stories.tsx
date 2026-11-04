import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'
import { MoveDialog, type MovePlace } from './MoveDialog'

const FOLDERS = [
  { id: 'hq', name: 'Estiva HQ' },
  { id: 'peek', name: 'Peek' },
  { id: 'steer', name: 'Steer' },
]
const TOP: MovePlace = { id: '', path: [] }
const PROJECT: MovePlace = { id: '30850:a:folders', path: ['Folders: navigation for the whole suite'] }
const BRIEF: MovePlace = { id: '30840:a:brief', path: ['Folders: navigation for the whole suite', 'Brief'] }

/**
 * Moving a file to another team, under another file, or both. The places in
 * its own team are the caller's, read before it opens; another team's are
 * read when it is picked.
 */
const meta = {
  title: 'Menus & windows/MoveDialog',
  component: MoveDialog,
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: false, height: '560px' } },
  },
  argTypes: { onMove: { control: false }, onClose: { control: false }, placesIn: { control: false } },
  args: {
    title: 'Notes',
    description: 'Everyone who can read it now still can.',
    from: 'hq',
    folders: FOLDERS,
    places: [TOP, PROJECT, BRIEF],
    placesIn: async (): Promise<readonly MovePlace[]> => [TOP, { id: '30840:a:brief', path: ['Brief'] }],
    startAtTop: true,
    onMove: async () => true,
    onClose: () => {},
  },
} satisfies Meta<typeof MoveDialog>

export default meta
type Story = StoryObj<typeof meta>

const pickSteer = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const page = within(canvasElement.ownerDocument.body)
  await userEvent.click(page.getByRole('combobox', { name: 'Team' }))
  await userEvent.click(await page.findByRole('option', { name: 'Steer' }))
}

/** A file that may sit under any other: its own team first, at the top, with every other place there. */
export const Topic: Story = {}

/** A file that nests under nothing: only the team is asked, and not the one it is in. Move waits for a pick. */
export const Project: Story = {
  args: { title: 'Folders: navigation for the whole suite', places: undefined, placesIn: undefined },
}

/** Nowhere to go in its own team: one holding only this file and what is under it. */
export const NowhereHere: Story = {
  name: 'Nowhere here',
  args: { places: [] },
}

/** Another team could not be read: the section's empty line, with Try again. */
export const FolderUnreadable: Story = {
  name: 'Team unreadable',
  args: { places: [], placesIn: (): Promise<readonly MovePlace[]> => Promise.reject(new Error('down')) },
  play: pickSteer,
}

/** Another team, still being read: the second list says so and waits. */
export const ReadingAFolder: Story = {
  name: 'Reading a team',
  args: { placesIn: () => new Promise<readonly MovePlace[]>(() => {}) },
  play: pickSteer,
}

/** A file whose parent is one kind: the empty place is "none", and nothing is chosen for the person. */
export const UnderNone: Story = {
  name: 'Under none',
  args: { startAtTop: false, topLabel: 'None — under none of these', places: [TOP, PROJECT] },
}

/** The teams are still being read: the list says so. */
export const ReadingFolders: Story = {
  name: 'Reading folders',
  args: { folders: undefined },
}

/** No team to offer: said in the dialog's body, and Move stays greyed. */
export const NoOtherFolder: Story = {
  name: 'No other team',
  args: { folders: [FOLDERS[0]], places: undefined, placesIn: undefined },
}

/** Another app's words, opening on the team the app chose. */
export const AnotherAppsWords: Story = {
  name: 'Another app’s words',
  args: {
    heading: 'Move to team',
    folderLabel: 'Destination team',
    noFolder: 'There is no other team it can be moved to.',
    description: 'Only the team it is listed in changes. Its issues and its conversation stay exactly as they are.',
    title: 'Folders: navigation for the whole suite',
    places: undefined,
    placesIn: undefined,
    startIn: 'steer',
  },
}

/**
 * A file listed in two teams, after a move that half-worked: `from` is empty, so every team is offered, the ones
 * it is in too, since moving into one takes it out of the other; Move again is the retry. Nothing is chosen for the
 * person. The story opens the list.
 */
export const ListedTwice: Story = {
  name: 'Listed in two teams',
  args: { title: 'Folders: navigation for the whole suite', from: '', places: undefined, placesIn: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('combobox', { name: 'Team' }))
  },
}

/** A box only some teams ask, ticked as it opened: here Steer asks it and Estiva HQ does not. The story picks Steer. */
export const WithABox: Story = {
  name: 'With a box',
  args: {
    title: 'Folders: navigation for the whole suite',
    from: '',
    places: undefined,
    placesIn: undefined,
    check: { label: (folder: string) => (folder === 'steer' ? 'Label' : undefined), checked: true },
  },
  play: pickSteer,
}

/** Moving: the button says so, and everything waits for the answer. */
export const Moving: Story = {
  args: { onMove: () => new Promise<boolean>(() => {}) },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('button', { name: 'Move' }))
  },
}

/** The move was refused: it stays open, and the caller has said why. */
export const Refused: Story = {
  args: { onMove: async () => false },
}
