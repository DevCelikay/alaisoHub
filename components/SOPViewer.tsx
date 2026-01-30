'use client'

import { SOPWithTags, SOPStep } from '@/lib/types/database'
import { useEffect, useState, useRef } from 'react'
import ExportModal from './ExportModal'

interface SOPViewerProps {
  sop: SOPWithTags
  onClose?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onImportOverride?: (updates: { title: string; objectives: string; logins_prerequisites: string; steps: SOPStep[] }) => void
}

export default function SOPViewer({ sop, onClose, onEdit, onDelete, onImportOverride }: SOPViewerProps) {
  const [steps, setSteps] = useState<SOPStep[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [expandedImage, setExpandedImage] = useState<{ data: string; caption?: string } | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [collapsedDecisions, setCollapsedDecisions] = useState<Set<string>>(new Set())
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sop.content && Array.isArray(sop.content)) {
      const sopSteps = sop.content as unknown as SOPStep[]
      setSteps(sopSteps)
      // Initialize all decision steps as collapsed
      const decisionIds = sopSteps
        .filter(step => step.type === 'decision')
        .map(step => step.id)
      setCollapsedDecisions(new Set(decisionIds))
    }
  }, [sop])

  // Handle escape key to exit fullscreen or close expanded image
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) {
          setExpandedImage(null)
        } else if (isFullscreen) {
          setIsFullscreen(false)
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen, expandedImage])

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false)
      }
    }
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  const toggleDecision = (stepId: string) => {
    setCollapsedDecisions(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const scrollToStep = (e: React.MouseEvent<HTMLAnchorElement>, stepId: string) => {
    e.preventDefault()
    const element = document.getElementById(`step-${stepId}`)
    if (element && contentRef.current) {
      const container = contentRef.current
      const elementTop = element.offsetTop - container.offsetTop
      container.scrollTo({
        top: elementTop - 24,
        behavior: 'smooth'
      })
    }
  }

  const getStepNumber = (step: SOPStep): number | null => {
    if (step.type === 'decision') return null
    const regularSteps = steps.filter(s => s.type !== 'decision')
    return regularSteps.indexOf(step) + 1
  }

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
            <h2 className="text-xl font-semibold text-[#1a1a1a]">{sop.title}</h2>
            <div className="flex items-center gap-2">
              {sop.tags.map(tag => (
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
          <div className="flex items-center space-x-2 ml-4">
            {/* Options Menu */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 text-[#878787] hover:bg-[#fafafa] rounded-xl transition-colors"
                title="Options"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#e3e3e3] py-1 z-10">
                  <button
                    onClick={() => {
                      setShowExport(true)
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#fafafa] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#878787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Export / Import
                  </button>
                  <button
                    onClick={() => {
                      setIsFullscreen(!isFullscreen)
                      setShowOptionsMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#fafafa] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#878787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isFullscreen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v5m0-5h5m6 6l5 5m0 0v-5m0 5h-5M9 15l-5 5m0 0v-5m0 5h5m6-6l5-5m0 0v5m0-5h-5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                  {onEdit && (
                    <>
                      <div className="border-t border-[#e3e3e3] my-1" />
                      <button
                        onClick={() => {
                          onEdit()
                          setShowOptionsMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#fafafa] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#878787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit SOP
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${sop.title}"?`)) {
                              onDelete()
                              setShowOptionsMenu(false)
                            }
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete SOP
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

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
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* Objectives */}
        {sop.objectives && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">Objectives and Outcomes</h3>
            <div className="text-[#1a1a1a] whitespace-pre-wrap bg-[#fafafa] p-5 rounded-xl border border-[#e3e3e3]">{sop.objectives}</div>
          </div>
        )}

        {/* Logins and Prerequisites */}
        {sop.logins_prerequisites && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">Logins and Prerequisites</h3>
            <div className="text-[#1a1a1a] whitespace-pre-wrap bg-[#fafafa] p-5 rounded-xl border border-[#e3e3e3]">{sop.logins_prerequisites}</div>
          </div>
        )}

        {/* Table of Contents */}
        {steps.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">Contents</h3>
            <div className="space-y-2 bg-[#fafafa] p-5 rounded-xl border border-[#e3e3e3]">
              {steps.map((step) => {
                const stepNumber = getStepNumber(step)
                const isDecision = step.type === 'decision'
                return (
                  <a
                    key={step.id}
                    href={`#step-${step.id}`}
                    onClick={(e) => scrollToStep(e, step.id)}
                    className="block text-[#673ae4] hover:text-[#5d0f4c] transition-colors py-1 flex items-center gap-2"
                  >
                    <span>
                      {stepNumber ? `${stepNumber}. ` : ''}{step.title}
                    </span>
                    {isDecision && (
                      <span className="text-xs font-medium text-[#3b82f6] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                        Decision
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Steps</h3>
            <div className="space-y-4">
              {steps.map((step) => {
                const isDecision = step.type === 'decision'
                const stepNumber = getStepNumber(step)
                const isCollapsed = isDecision && collapsedDecisions.has(step.id)
                return (
                <div
                  key={step.id}
                  id={`step-${step.id}`}
                  className={`rounded-xl p-5 scroll-mt-24 ${
                    isDecision
                      ? 'bg-[#f0f7ff] border-2 border-[#3b82f6]'
                      : 'bg-[#fafafa] border border-[#e3e3e3]'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {stepNumber && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm bg-[#673ae4]">
                        {stepNumber}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-[#1a1a1a] font-semibold">{step.title}</h4>
                        {isDecision && (
                          <>
                            <span className="text-xs font-medium text-[#3b82f6] bg-[#dbeafe] px-2 py-0.5 rounded-full">
                              Decision
                            </span>
                            <button
                              onClick={() => toggleDecision(step.id)}
                              className="ml-auto p-1 text-[#3b82f6] hover:bg-[#dbeafe] rounded-lg transition-all"
                              title={isCollapsed ? 'Expand decision' : 'Collapse decision'}
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <div className="text-[#1a1a1a] whitespace-pre-wrap">{step.content}</div>
                          {step.images && step.images.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {step.images.map((image) => (
                                <div key={image.id} className="bg-white border border-[#e3e3e3] rounded-lg p-3">
                                  <img
                                    src={image.data}
                                    alt={image.caption || 'Step image'}
                                    className="max-w-full max-h-96 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setExpandedImage({ data: image.data, caption: image.caption })}
                                    title="Click to expand"
                                  />
                                  {image.caption && (
                                    <p className="mt-2 text-sm text-[#878787] italic">{image.caption}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
              })}
            </div>
          </div>
        )}

        {steps.length === 0 && !sop.objectives && !sop.logins_prerequisites && (
          <div className="text-center py-12 text-[#878787]">
            This SOP has no content yet.
          </div>
        )}
      </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          sop={sop}
          onClose={() => setShowExport(false)}
          onUpdate={onImportOverride}
        />
      )}

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={expandedImage.data}
              alt={expandedImage.caption || 'Expanded image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {expandedImage.caption && (
              <p className="mt-3 text-center text-white/90 text-sm">{expandedImage.caption}</p>
            )}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-gray-100 transition-colors shadow-lg"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
