import { useState } from 'react'
import { IconHome } from '@tabler/icons-react'
import { KindIcon } from '../../src/KindIcon'
import { NavItem } from '../../src/NavItem'
import { Sidebar } from '../../src/Sidebar'
import { TOPICS, fileOf, topicOf, type Person, type Read, type Topic } from './fixtures'
import { ExplorePage, FilePlaceholder, Frame, Page, Providers, TeamsTree, TopicsSection, go, icon16, type Place } from './parts'

export interface LeafTopicsProps {
  viewer?: Person
  start?: Place
  read?: Read
  /** You're in no topic yet. */
  none?: boolean
}

export function LeafTopics(props: LeafTopicsProps) {
  return (
    <Providers>
      <LeafApp {...props} />
    </Providers>
  )
}

/**
 * Leaf's sidebar: Home, your five newest topics, each folding to its pages,
 * projects and issues in the topic's order (as today), then Explore topics in
 * the place of More, then Teams as today.
 */
function LeafApp({ viewer: firstViewer = 'miky', start = { type: 'home' }, read: firstRead = 'ok', none = false }: LeafTopicsProps) {
  const [viewer, setViewer] = useState<Person>(firstViewer)
  const [place, setPlace] = useState<Place>(start)
  const [read, setRead] = useState<Read>(firstRead)
  const fold = (t: Topic) => t.files.filter((f) => !fileOf(f.id).archived).map((f) => f.id)
  const content =
    place.type === 'explore' ? (
      <ExplorePage viewer={viewer} read={read} onRetry={() => setRead('ok')} onOpen={setPlace} />
    ) : place.type === 'topic' ? (
      <Page title={topicOf(place.id).title} icon={<KindIcon kind="topic" />}>
        <p className="text-caption text-text-muted">The topic’s page in Leaf, as today, its files in the topic’s order, each as a row or a card as the team set it.</p>
      </Page>
    ) : place.type === 'file' ? (
      <FilePlaceholder id={place.id} />
    ) : (
      <Page title="Home">
        <p className="text-caption text-text-muted">Home, as today.</p>
      </Page>
    )
  return (
    <Frame
      app="Leaf"
      viewer={viewer}
      onViewer={setViewer}
      nav={
        // Leaf's sidebar on origin/main: Home, Topics, Teams.
        <Sidebar>
          <NavItem href="#" label="Home" icon={<IconHome {...icon16} />} active={place.type === 'home'} onClick={go(() => setPlace({ type: 'home' }))} />
          <TopicsSection viewer={viewer} topics={none ? [] : TOPICS} read={read} place={place} onOpen={setPlace} limit={5} fold={fold} />
          <TeamsTree app="Leaf" />
        </Sidebar>
      }
    >
      {content}
    </Frame>
  )
}
