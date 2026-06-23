import { useWorkspace } from '../contexts/WorkspaceContext'
import ChannelTabs from '../components/channels/ChannelTabs'
import KanbanBoard from '../components/board/KanbanBoard'

export default function DashboardPage() {
  const { loading, workspace } = useWorkspace()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-gray-600 text-sm">Loading workspace…</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ChannelTabs />
      <KanbanBoard />
    </div>
  )
}
