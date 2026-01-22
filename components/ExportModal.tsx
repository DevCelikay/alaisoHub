'use client'

import { useEffect, useRef, useState } from 'react'
import { SOPWithTags, SOPStep } from '@/lib/types/database'
import { sopToYAML, downloadYAML, generateFilename } from '@/lib/utils/sopExporter'
import { parseSOPFile, readFileAsText } from '@/lib/utils/sopParser'

interface ExportModalProps {
  sop: SOPWithTags
  onClose: () => void
  onUpdate?: (updates: { title: string; objectives: string; logins_prerequisites: string; steps: SOPStep[] }) => void
}

export default function ExportModal({ sop, onClose, onUpdate }: ExportModalProps) {
  const [yamlContent, setYamlContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importContent, setImportContent] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setYamlContent(sopToYAML(sop))
  }, [sop])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const filename = generateFilename(sop.title)
    downloadYAML(yamlContent, filename)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await readFileAsText(file)
      setImportContent(content)
      setImportError('')
    } catch {
      setImportError('Failed to read file')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImport = () => {
    if (!importContent.trim()) {
      setImportError('Please paste YAML content or upload a file')
      return
    }

    try {
      setImporting(true)
      const parsed = parseSOPFile(importContent, 'import.yaml')

      if (!parsed.title && !parsed.steps.length) {
        setImportError('Invalid YAML format. Could not parse SOP data.')
        setImporting(false)
        return
      }

      if (onUpdate) {
        onUpdate({
          title: parsed.title || sop.title,
          objectives: parsed.objectives || '',
          logins_prerequisites: parsed.logins_prerequisites || '',
          steps: parsed.steps
        })
        onClose()
      }
    } catch (err) {
      setImportError('Failed to parse YAML. Please check the format.')
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e3e3]">
          <div>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Export / Import SOP</h2>
            <p className="text-sm text-[#878787] mt-0.5">{sop.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#878787] hover:bg-[#fafafa] rounded-xl transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e3e3e3]">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-[#673ae4] border-b-2 border-[#673ae4]'
                : 'text-[#878787] hover:text-[#1a1a1a]'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-[#673ae4] border-b-2 border-[#673ae4]'
                : 'text-[#878787] hover:text-[#1a1a1a]'
            }`}
          >
            Import / Override
          </button>
        </div>

        {activeTab === 'export' ? (
          <>
            {/* YAML Preview */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1a1a1a]">YAML Output</span>
                  <span className="text-xs text-[#878787]">
                    {yamlContent.split('\n').length} lines
                  </span>
                </div>
                <div className="flex-1 overflow-auto bg-[#1a1a1a] rounded-xl">
                  <pre className="p-4 text-sm text-[#e3e3e3] font-mono whitespace-pre overflow-x-auto">
                    {yamlContent}
                  </pre>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e3e3e3]">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download .yaml
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Import Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#1a1a1a]">Paste YAML or upload file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".yaml,.yml,.txt,.md"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#673ae4] hover:bg-[#f3f4ff] rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload file
                  </button>
                </div>
                <textarea
                  value={importContent}
                  onChange={(e) => {
                    setImportContent(e.target.value)
                    setImportError('')
                  }}
                  placeholder={`title: My SOP Title
objectives: What this SOP achieves
prerequisites: Required logins and tools
steps:
  - title: First Step
    content: Instructions for first step
  - title: Second Step
    content: Instructions for second step
    type: decision`}
                  className="flex-1 w-full p-4 text-sm font-mono bg-[#fafafa] border border-[#e3e3e3] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent"
                />
                {importError && (
                  <p className="mt-2 text-sm text-red-500">{importError}</p>
                )}
              </div>
            </div>

            {/* Import Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e3e3e3]">
              <p className="text-xs text-[#878787]">
                This will replace the current SOP content
              </p>
              <button
                onClick={handleImport}
                disabled={!importContent.trim() || importing || !onUpdate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Override SOP
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
