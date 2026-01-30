'use client'

import { useState } from 'react'
import { SOPWithTags, PromptWithTags, ResourceWithTags, Tag } from '@/lib/types/database'
import { RecentView } from '@/lib/utils/recentViews'

type View = 'all-sops' | 'all-prompts' | 'all-resources'

interface SidebarProps {
  activeApp: 'knowledge-base' | 'reporting' | 'copywriting'
  activeView: View
  selectedItemId: string | null
  onViewChange: (view: View) => void
  onItemSelect: (itemId: string, itemType: 'sop' | 'prompt' | 'resource') => void
  onCreateNew: (type: 'sop' | 'prompt' | 'resource') => void
  onUploadSop: () => void
  tags: Tag[]
  sops: SOPWithTags[]
  prompts: PromptWithTags[]
  resources: ResourceWithTags[]
  recentViews: RecentView[]
  isAdmin: boolean
  isPinned: boolean
  onPinnedChange: (pinned: boolean) => void
  isSOPsExpanded: boolean
  onSOPsExpandedChange: (expanded: boolean) => void
  isPromptsExpanded: boolean
  onPromptsExpandedChange: (expanded: boolean) => void
  isResourcesExpanded: boolean
  onResourcesExpandedChange: (expanded: boolean) => void
}

export default function Sidebar({
  activeApp,
  activeView,
  selectedItemId,
  onViewChange,
  onItemSelect,
  onCreateNew,
  onUploadSop,
  tags,
  sops,
  prompts,
  resources,
  recentViews,
  isAdmin,
  isPinned,
  onPinnedChange,
  isSOPsExpanded,
  onSOPsExpandedChange,
  isPromptsExpanded,
  onPromptsExpandedChange,
  isResourcesExpanded,
  onResourcesExpandedChange
}: SidebarProps) {
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(new Set())

  if (activeApp !== 'knowledge-base') {
    return null // Only show sidebar in Knowledge Base
  }

  const toggleTag = (tagId: string) => {
    const newExpanded = new Set(expandedTagIds)
    if (newExpanded.has(tagId)) {
      newExpanded.delete(tagId)
    } else {
      newExpanded.add(tagId)
    }
    setExpandedTagIds(newExpanded)
  }

  // Group SOPs by tag
  const sopsGroupedByTag = tags.map(tag => ({
    tag,
    sops: sops.filter(sop => sop.tags.some(t => t.id === tag.id)).sort((a, b) => a.title.localeCompare(b.title))
  })).filter(group => group.sops.length > 0)

  const untaggedSOPs = sops.filter(sop => sop.tags.length === 0).sort((a, b) => a.title.localeCompare(b.title))

  // Group Prompts by tag
  const promptsGroupedByTag = tags.map(tag => ({
    tag,
    prompts: prompts.filter(prompt => prompt.tags.some(t => t.id === tag.id)).sort((a, b) => a.title.localeCompare(b.title))
  })).filter(group => group.prompts.length > 0)

  const untaggedPrompts = prompts.filter(prompt => prompt.tags.length === 0).sort((a, b) => a.title.localeCompare(b.title))

  const expandAllSopTags = () => {
    const nextExpanded = !isSOPsExpanded
    onSOPsExpandedChange(nextExpanded)
    const newExpanded = new Set(expandedTagIds)
    const sopTagIds = sopsGroupedByTag.map(group => group.tag.id)
    if (untaggedSOPs.length > 0) sopTagIds.push('untagged-sops')
    if (nextExpanded) {
      sopTagIds.forEach(id => newExpanded.add(id))
    } else {
      sopTagIds.forEach(id => newExpanded.delete(id))
    }
    setExpandedTagIds(newExpanded)
  }

  const expandAllPromptTags = () => {
    const nextExpanded = !isPromptsExpanded
    onPromptsExpandedChange(nextExpanded)
    const newExpanded = new Set(expandedTagIds)
    const promptTagIds = promptsGroupedByTag.map(group => `prompt-${group.tag.id}`)
    if (untaggedPrompts.length > 0) promptTagIds.push('untagged-prompts')
    if (nextExpanded) {
      promptTagIds.forEach(id => newExpanded.add(id))
    } else {
      promptTagIds.forEach(id => newExpanded.delete(id))
    }
    setExpandedTagIds(newExpanded)
  }

  // Group Resources by tag
  const resourcesGroupedByTag = tags.map(tag => ({
    tag,
    resources: resources.filter(resource => resource.tags.some(t => t.id === tag.id)).sort((a, b) => a.title.localeCompare(b.title))
  })).filter(group => group.resources.length > 0)

  const untaggedResources = resources.filter(resource => resource.tags.length === 0).sort((a, b) => a.title.localeCompare(b.title))

  const expandAllResourceTags = () => {
    const nextExpanded = !isResourcesExpanded
    onResourcesExpandedChange(nextExpanded)
    const newExpanded = new Set(expandedTagIds)
    const resourceTagIds = resourcesGroupedByTag.map(group => `resource-${group.tag.id}`)
    if (untaggedResources.length > 0) resourceTagIds.push('untagged-resources')
    if (nextExpanded) {
      resourceTagIds.forEach(id => newExpanded.add(id))
    } else {
      resourceTagIds.forEach(id => newExpanded.delete(id))
    }
    setExpandedTagIds(newExpanded)
  }

  return (
    <div className={`${isPinned ? 'w-72' : 'w-16 hover:w-72'} bg-white h-full flex flex-col m-3 rounded-2xl shadow-lg border border-[#e3e3e3] transition-all duration-300 ease-in-out overflow-hidden group`}>
      {/* Sidebar Header */}
      <div className="h-[65px] px-4 border-b border-[#e3e3e3] relative flex items-end pb-4">
        {/* Collapsed state - emoji centered */}
        <div className={`absolute inset-0 flex items-end justify-center pb-4 ${isPinned ? 'opacity-0 pointer-events-none' : 'opacity-100 group-hover:opacity-0 group-hover:pointer-events-none'} transition-opacity duration-300`}>
          <span className="text-xl">📚</span>
        </div>
        {/* Expanded state - title and pin button */}
        <div className={`flex items-center justify-between w-full ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
          <h2 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide whitespace-nowrap">
            Knowledge Base
          </h2>
          <button
            onClick={() => onPinnedChange(!isPinned)}
            className={`p-1.5 rounded-lg transition-all duration-200 ${isPinned ? 'text-[#673ae4] bg-[#f3f4ff]' : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a]'}`}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${isPinned ? '' : '-rotate-45'}`} viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182a.5.5 0 0 1-.707-.707l3.182-3.182L2.404 7.213a.5.5 0 0 1 0-.707c.688-.688 1.673-.766 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto p-2 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
        <div className="space-y-2">
          {/* Recent Section */}
          {recentViews.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-[#878787] uppercase tracking-wide">
                Recent
              </div>
              <div className="space-y-0.5">
                {recentViews.slice(0, 3).map((recent) => {
                  const icon = recent.type === 'sop' ? '📚' : recent.type === 'prompt' ? '💬' : '📎'
                  return (
                    <button
                      key={`${recent.type}-${recent.id}`}
                      onClick={() => onItemSelect(recent.id, recent.type)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 flex items-center gap-2 ${
                        selectedItemId === recent.id
                          ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                          : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                      <span className="truncate block flex-1">{recent.title}</span>
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-[#e3e3e3] mt-3 mb-3" />
            </div>
          )}
          {/* All SOPs Section */}
          <div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  expandAllSopTags()
                  onViewChange('all-sops')
                }}
                className={`flex-1 flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeView === 'all-sops'
                    ? 'bg-[#f3f4ff] text-[#673ae4] font-medium shadow-sm border border-[#673ae4]/20'
                    : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                }`}
              >
                <span className={`text-xs transition-transform ${isSOPsExpanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-base">📚</span>
                <span className="flex-1 text-left">SOPs</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6]" aria-hidden="true" />
                <span className="text-xs opacity-60">{sops.length}</span>
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={onUploadSop}
                    className="p-2 text-[#3b82f6] hover:bg-[#eff6ff] rounded-xl transition-all duration-200"
                    title="Upload SOP"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onCreateNew('sop')}
                    className="p-2 text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all duration-200"
                    title="New SOP"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {isSOPsExpanded && (
              <div className="ml-3 mt-1 space-y-1">
                {sopsGroupedByTag.map(({ tag, sops: tagSOPs }) => (
                  <div key={tag.id}>
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has(tag.id) ? 'rotate-90' : ''}`}>▶</span>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left truncate text-xs font-medium">{tag.name}</span>
                      <span className="text-xs opacity-60">{tagSOPs.length}</span>
                    </button>

                    {expandedTagIds.has(tag.id) && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {tagSOPs.map(sop => (
                          <button
                            key={sop.id}
                            onClick={() => onItemSelect(sop.id, 'sop')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === sop.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="block whitespace-normal break-words leading-snug">{sop.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {untaggedSOPs.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleTag('untagged-sops')}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has('untagged-sops') ? 'rotate-90' : ''}`}>▶</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#878787]" />
                      <span className="flex-1 text-left truncate text-xs font-medium">Untagged</span>
                      <span className="text-xs opacity-60">{untaggedSOPs.length}</span>
                    </button>

                    {expandedTagIds.has('untagged-sops') && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {untaggedSOPs.map(sop => (
                          <button
                            key={sop.id}
                            onClick={() => onItemSelect(sop.id, 'sop')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === sop.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="block whitespace-normal break-words leading-snug">{sop.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Prompts Section */}
          <div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  expandAllPromptTags()
                  onViewChange('all-prompts')
                }}
                className={`flex-1 flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeView === 'all-prompts'
                    ? 'bg-[#f3f4ff] text-[#673ae4] font-medium shadow-sm border border-[#673ae4]/20'
                    : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                }`}
              >
                <span className={`text-xs transition-transform ${isPromptsExpanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-base">💬</span>
                <span className="flex-1 text-left">All Prompts</span>
                <span className="text-xs opacity-60">{prompts.length}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => onCreateNew('prompt')}
                  className="p-2 text-[#673ae4] hover:bg-[#f3f4ff] rounded-lg transition-colors"
                  title="New Prompt"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {isPromptsExpanded && (
              <div className="ml-3 mt-1 space-y-1">
                {promptsGroupedByTag.map(({ tag, prompts: tagPrompts }) => (
                  <div key={tag.id}>
                    <button
                      onClick={() => toggleTag(`prompt-${tag.id}`)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has(`prompt-${tag.id}`) ? 'rotate-90' : ''}`}>▶</span>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left truncate text-xs font-medium">{tag.name}</span>
                      <span className="text-xs opacity-60">{tagPrompts.length}</span>
                    </button>

                    {expandedTagIds.has(`prompt-${tag.id}`) && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {tagPrompts.map(prompt => (
                          <button
                            key={prompt.id}
                            onClick={() => onItemSelect(prompt.id, 'prompt')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === prompt.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="truncate block">{prompt.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {untaggedPrompts.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleTag('untagged-prompts')}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has('untagged-prompts') ? 'rotate-90' : ''}`}>▶</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#878787]" />
                      <span className="flex-1 text-left truncate text-xs font-medium">Untagged</span>
                      <span className="text-xs opacity-60">{untaggedPrompts.length}</span>
                    </button>

                    {expandedTagIds.has('untagged-prompts') && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {untaggedPrompts.map(prompt => (
                          <button
                            key={prompt.id}
                            onClick={() => onItemSelect(prompt.id, 'prompt')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === prompt.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="truncate block">{prompt.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* All Resources Section */}
          <div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  expandAllResourceTags()
                  onViewChange('all-resources')
                }}
                className={`flex-1 flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  activeView === 'all-resources'
                    ? 'bg-[#f3f4ff] text-[#673ae4] font-medium shadow-sm border border-[#673ae4]/20'
                    : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a]'
                }`}
              >
                <span className={`text-xs transition-transform ${isResourcesExpanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-base">📎</span>
                <span className="flex-1 text-left">Resources</span>
                <span className="text-xs opacity-60">{resources.length}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => onCreateNew('resource')}
                  className="p-2 text-[#673ae4] hover:bg-[#f3f4ff] rounded-lg transition-colors"
                  title="New Resource"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            {isResourcesExpanded && (
              <div className="ml-3 mt-1 space-y-1">
                {resourcesGroupedByTag.map(({ tag, resources: tagResources }) => (
                  <div key={tag.id}>
                    <button
                      onClick={() => toggleTag(`resource-${tag.id}`)}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has(`resource-${tag.id}`) ? 'rotate-90' : ''}`}>▶</span>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left truncate text-xs font-medium">{tag.name}</span>
                      <span className="text-xs opacity-60">{tagResources.length}</span>
                    </button>

                    {expandedTagIds.has(`resource-${tag.id}`) && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {tagResources.map(resource => (
                          <button
                            key={resource.id}
                            onClick={() => onItemSelect(resource.id, 'resource')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === resource.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="truncate block">{resource.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {untaggedResources.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleTag('untagged-resources')}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all duration-200"
                    >
                      <span className={`text-xs transition-transform ${expandedTagIds.has('untagged-resources') ? 'rotate-90' : ''}`}>▶</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#878787]" />
                      <span className="flex-1 text-left truncate text-xs font-medium">Untagged</span>
                      <span className="text-xs opacity-60">{untaggedResources.length}</span>
                    </button>

                    {expandedTagIds.has('untagged-resources') && (
                      <div className="ml-6 mt-0.5 space-y-0.5">
                        {untaggedResources.map(resource => (
                          <button
                            key={resource.id}
                            onClick={() => onItemSelect(resource.id, 'resource')}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                              selectedItemId === resource.id
                                ? 'bg-[#f3f4ff] text-[#673ae4] font-medium border border-[#673ae4]/20 shadow-sm'
                                : 'text-[#878787] hover:bg-[#fafafa] hover:text-[#1a1a1a] border border-transparent'
                            }`}
                          >
                            <span className="truncate block">{resource.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className={`p-3 border-t border-[#e3e3e3] ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
        <div className="text-xs text-[#878787] px-3">
          <div className="flex justify-between mb-1">
            <span>Total Items</span>
            <span className="font-medium">{sops.length + prompts.length + resources.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
