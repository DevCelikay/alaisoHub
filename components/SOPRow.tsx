'use client'

import { useState } from 'react'
import { SOPWithTags, SOPStep } from '@/lib/types/database'
import SOPViewer from './SOPViewer'

interface SOPRowProps {
  sop: SOPWithTags
  onEdit: (sop: SOPWithTags) => void
  onEditWithData?: (sop: SOPWithTags, data: { title: string; objectives: string; logins_prerequisites: string; steps: SOPStep[] }) => void
  isAdmin: boolean
}

export default function SOPRow({ sop, onEdit, onEditWithData, isAdmin }: SOPRowProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const handleImportOverride = (updates: { title: string; objectives: string; logins_prerequisites: string; steps: SOPStep[] }) => {
    setIsViewerOpen(false)
    if (onEditWithData) {
      onEditWithData(sop, updates)
    }
  }

  return (
    <>
      <div
        onClick={() => setIsViewerOpen(true)}
        className="group bg-[#fafafa] border border-[#e3e3e3] rounded-lg p-4 hover:border-[#673ae4] hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-[#1a1a1a] font-medium mb-1 truncate">{sop.title}</h3>
            {sop.objectives && (
              <p className="text-sm text-[#878787] line-clamp-1">{sop.objectives}</p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              {sop.tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
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

          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(sop)
              }}
              className="ml-4 px-3 py-1.5 text-sm text-[#878787] hover:text-[#673ae4] hover:bg-white rounded-lg border border-transparent hover:border-[#e3e3e3] transition-all opacity-0 group-hover:opacity-100"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {isViewerOpen && (
        <SOPViewer
          sop={sop}
          onClose={() => setIsViewerOpen(false)}
          onEdit={isAdmin ? () => {
            setIsViewerOpen(false)
            onEdit(sop)
          } : undefined}
          onImportOverride={isAdmin && onEditWithData ? handleImportOverride : undefined}
        />
      )}
    </>
  )
}
