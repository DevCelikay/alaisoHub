'use client'

import { useState, useEffect } from 'react'
import { ResourceWithTags } from '@/lib/types/database'

interface ResourceViewerProps {
  resource: ResourceWithTags
  onClose?: () => void
  onEdit?: () => void
}

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// Helper function to get MIME type
const getMimeType = (fileType: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel'
  }
  return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream'
}

// Helper function to format file size
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Helper function to get file icon
const getFileIcon = (fileType: string | null, resourceType?: 'file' | 'url'): string => {
  if (resourceType === 'url') return '🔗'
  if (!fileType) return '📎'
  const type = fileType.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(type)) return '🖼️'
  if (['pdf'].includes(type)) return '📕'
  if (['doc', 'docx'].includes(type)) return '📄'
  if (['txt', 'md'].includes(type)) return '📝'
  if (['csv', 'xlsx', 'xls'].includes(type)) return '📊'
  return '📎'
}

export default function ResourceViewer({ resource, onClose, onEdit }: ResourceViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else if (onClose) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, onClose])

  const handleDownload = () => {
    if (resource.resource_type === 'url' && resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!resource.file_data || !resource.file_type || !resource.file_name) return
    const mimeType = getMimeType(resource.file_type)
    const blob = base64ToBlob(resource.file_data, mimeType)
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = resource.file_name
    link.click()
    URL.revokeObjectURL(blobUrl)
  }

  const isUrl = resource.resource_type === 'url'
  const isImage = resource.file_type && ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(resource.file_type.toLowerCase())
  const isPDF = resource.file_type?.toLowerCase() === 'pdf'

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-[#f5f5f7]' : 'h-full relative'} flex flex-col p-3 transition-all duration-300`}>
      <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] flex-1 flex flex-col overflow-hidden relative z-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e3e3] bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {onClose && !isFullscreen && (
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
            <span className="text-3xl">{getFileIcon(resource.file_type, resource.resource_type)}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-[#1a1a1a] truncate">{resource.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                {resource.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
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
            <button
              onClick={handleDownload}
              className="p-2 text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-colors"
              title={isUrl ? "Open URL" : "Download"}
            >
              {isUrl ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-[#878787] hover:bg-[#fafafa] rounded-xl transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 6l5 5m0 0v-5m0 5h-5M9 15l-5 5m0 0v-5m0 5h5m6-6l5-5m0 0v5m0-5h-5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-1.5 text-sm text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-colors"
              >
                Edit
              </button>
            )}
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-4 py-1.5 text-sm text-[#878787] hover:bg-[#fafafa] rounded-xl transition-colors"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
          {/* Metadata */}
          <div className="mb-6 grid grid-cols-2 gap-4 p-4 bg-[#fafafa] rounded-xl border border-[#e3e3e3]">
            {isUrl ? (
              <>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">URL</p>
                  <a
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#673ae4] hover:underline break-all"
                  >
                    {resource.url}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">Type</p>
                  <p className="text-sm text-[#1a1a1a]">External Link</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-[#1a1a1a]">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">File Name</p>
                  <p className="text-sm text-[#1a1a1a]">{resource.file_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">File Size</p>
                  <p className="text-sm text-[#1a1a1a]">{formatFileSize(resource.file_size)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">File Type</p>
                  <p className="text-sm text-[#1a1a1a]">{resource.file_type?.toUpperCase() || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#878787] uppercase tracking-wide mb-1">Created</p>
                  <p className="text-sm text-[#1a1a1a]">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {resource.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">Description</h3>
              <div className="text-[#1a1a1a] whitespace-pre-wrap bg-[#fafafa] p-5 rounded-xl border border-[#e3e3e3]">
                {resource.description}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">Preview</h3>
            <div className="bg-[#fafafa] rounded-xl border border-[#e3e3e3] p-5">
              {isUrl ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-[#673ae4] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p className="text-[#878787] mb-4">External link resource</p>
                  <a
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Link
                  </a>
                </div>
              ) : isImage && resource.file_data ? (
                <img
                  src={resource.file_data}
                  alt={resource.title}
                  className="max-w-full max-h-[600px] object-contain mx-auto rounded"
                />
              ) : isPDF ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-[#878787] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[#878787] mb-4">PDF preview not available</p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download to view
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">{getFileIcon(resource.file_type, resource.resource_type)}</span>
                  <p className="text-[#878787] mb-4">Preview not available for this file type</p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
