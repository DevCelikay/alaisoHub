'use client'

import { PromptWithTags } from '@/lib/types/database'
import { useState } from 'react'

interface PromptViewerProps {
  prompt: PromptWithTags
  onClose?: () => void
  onEdit?: () => void
}

export default function PromptViewer({ prompt, onClose, onEdit }: PromptViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full flex flex-col p-3 relative">
      <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e3e3e3] bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-[#878787] hover:text-[#1a1a1a] hover:bg-[#fafafa] rounded-xl transition-colors"
                title="Back to dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">{prompt.title}</h2>
            <div className="flex items-center space-x-2">
              {prompt.tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-5 py-2 text-sm text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-colors font-medium"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          {/* Description */}
          {prompt.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-2">
                Description
              </h3>
              <div className="text-[#1a1a1a] bg-[#fafafa] p-5 rounded-xl border border-[#e3e3e3] whitespace-pre-wrap">{prompt.description}</div>
            </div>
          )}

          {/* Prompt Content */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide mb-2">
              Prompt
            </h3>
            <div className="bg-[#fafafa] border border-[#e3e3e3] rounded-xl p-5 relative">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 text-[#878787] hover:text-[#673ae4] hover:bg-white rounded-lg transition-all"
                title="Copy prompt"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth={2} />
                    <path strokeWidth={2} d="M5 15V5a2 2 0 012-2h10" />
                  </svg>
                )}
              </button>
              <pre className="text-[#1a1a1a] whitespace-pre-wrap font-mono text-sm pr-10">
                {prompt.content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
