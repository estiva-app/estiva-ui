import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { Button } from './Button'
import { FilePicker } from './FilePicker'
import { IconButton } from './IconButton'

const meta = {
  title: 'Inputs/FilePicker',
  component: FilePicker,
  // The code tab shows each story's own code: building it from the rendered
  // element reads `element.ref`, which React 19 warns about.
  parameters: { layout: 'padded', docs: { source: { type: 'code' } } },
  args: { onPick: () => {} },
  argTypes: { onPick: { control: false } },
} satisfies Meta<typeof FilePicker>

export default meta
type Story = StoryObj<typeof meta>

/** What was chosen, one line per pick, so choosing the same file twice shows twice. */
function Picks({ picks }: { picks: string[] }) {
  return (
    <ul className="flex flex-col gap-1 text-body-2 text-text-secondary">
      {picks.length === 0 ? <li>Nothing chosen yet.</li> : picks.map((pick, i) => <li key={i}>{pick}</li>)}
    </ul>
  )
}

/** Opened by the caller's own button. It draws nothing itself. */
export const Default: Story = {
  render: (args) => {
    const picker = useRef<HTMLInputElement>(null)
    const [picks, setPicks] = useState<string[]>([])
    return (
      <div className="flex flex-col items-start gap-3">
        <FilePicker {...args} ref={picker} onPick={(files) => setPicks((held) => [...held, files.map((f) => f.name).join(', ')])} />
        <Button onClick={() => picker.current?.click()}>Choose</Button>
        <Picks picks={picks} />
      </div>
    )
  },
}

/** `multiple`, opened from an icon-only button. */
export const Several: Story = {
  args: { multiple: true },
  render: (args) => {
    const picker = useRef<HTMLInputElement>(null)
    const [picks, setPicks] = useState<string[]>([])
    return (
      <div className="flex flex-col items-start gap-3">
        <FilePicker {...args} ref={picker} onPick={(files) => setPicks((held) => [...held, files.map((f) => f.name).join(', ')])} />
        <IconButton aria-label="Choose" tooltip="Choose" onClick={() => picker.current?.click()}>
          <IconSquareRounded size={16} stroke={1.5} />
        </IconButton>
        <Picks picks={picks} />
      </div>
    )
  },
}
