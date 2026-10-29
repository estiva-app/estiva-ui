import { createElement } from 'react'
import { addons } from 'storybook/manager-api'

/**
 * A part on its way out says so beside its name in the sidebar: its stories'
 * meta carries `tags: ['deprecated']` (Katerina, 29 Oct: "write next to
 * ReferenceCards the name deprecated"). Anything else keeps its plain name.
 */
addons.setConfig({
  sidebar: {
    renderLabel: (item) =>
      item.type === 'component' && item.tags.includes('deprecated')
        ? createElement('span', null, item.name, createElement('span', { style: { marginLeft: 6, opacity: 0.6 } }, 'deprecated'))
        : undefined,
  },
})
