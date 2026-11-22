import { useLocation, useNavigate } from 'react-router-dom'
import { useDocWorkspaceOptional } from './DocWorkspaceContext'

export function DocTabBar() {
  const workspace = useDocWorkspaceOptional()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (!workspace || workspace.tabs.length === 0) return null

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface2)] px-2">
      <div className="flex items-stretch gap-0.5 overflow-x-auto py-1.5 [scrollbar-width:thin]">
        {workspace.tabs.map((tab) => {
          const active = pathname === tab.path
          return (
            <div
              key={tab.id}
              className={`group flex max-w-[220px] shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11.5px] transition ${
                active
                  ? 'border-[var(--accent)] bg-white text-[var(--text)] shadow-sm'
                  : 'border-transparent bg-transparent text-[var(--text2)] hover:border-[var(--border)] hover:bg-white/70'
              }`}
            >
              <button
                type="button"
                title={tab.subtitle ? `${tab.title} — ${tab.subtitle}` : tab.title}
                onClick={() => navigate(tab.path)}
                className="min-w-0 flex-1 truncate text-left font-medium"
              >
                {tab.dirty && <span className="mr-1 text-[var(--accent)]">●</span>}
                {tab.title}
              </button>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  workspace.closeTab(tab.path)
                }}
                className="rounded px-1 text-[12px] leading-none text-[var(--text3)] opacity-70 hover:bg-[var(--surface2)] hover:text-[var(--danger)] hover:opacity-100"
              >
                ×
              </button>
            </div>
          )
        })}
        {workspace.tabs.length > 1 && (
          <button
            type="button"
            className="ml-1 shrink-0 rounded px-2 text-[10.5px] font-semibold text-[var(--text3)] hover:bg-white hover:text-[var(--text)]"
            onClick={() => {
              const active = workspace.tabs.find((t) => t.path === pathname)
              if (active) workspace.closeOtherTabs(active.path)
            }}
            title="Close other tabs"
          >
            Close others
          </button>
        )}
      </div>
    </div>
  )
}
