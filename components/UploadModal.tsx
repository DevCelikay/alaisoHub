'use client'

import { useState, useRef, useEffect } from 'react'
import { parseSOPFile, readFileAsText } from '@/lib/utils/sopParser'
import { SOPStep } from '@/lib/types/database'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: {
    title: string
    objectives: string
    logins_prerequisites: string
    steps: SOPStep[]
  }) => void
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file')
  const [textInput, setTextInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('file')
      setTextInput('')
      setError(null)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const text = await readFileAsText(file)
      const parsed = parseSOPFile(text, file.name)
      onUpload(parsed)
      onClose()
    } catch (err) {
      setError('Failed to parse file. Please check the format.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleTextUpload = async () => {
    if (!textInput.trim()) {
      setError('Please enter YAML content')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const parsed = parseSOPFile(textInput, 'pasted-sop.yaml')
      onUpload(parsed)
      onClose()
    } catch (err) {
      setError('Failed to parse text. Please check the YAML format.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e3e3]">
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Upload SOP</h2>
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
            onClick={() => setActiveTab('file')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-[#673ae4] border-b-2 border-[#673ae4]'
                : 'text-[#878787] hover:text-[#1a1a1a]'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'text-[#673ae4] border-b-2 border-[#673ae4]'
                : 'text-[#878787] hover:text-[#1a1a1a]'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'file' ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">📄</div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Choose a file to upload</h3>
                <p className="text-sm text-[#878787]">
                  Supports .txt, .md, .yaml, and .yml files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.yaml,.yml"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {isLoading ? 'Uploading...' : 'Select File'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="mb-3">
                <span className="text-sm font-medium text-[#1a1a1a]">Paste YAML content</span>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value)
                  setError(null)
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
                disabled={isLoading}
                className="flex-1 w-full p-4 text-sm font-mono bg-[#fafafa] border border-[#e3e3e3] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#673ae4] focus:border-transparent disabled:opacity-50"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'text' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e3e3e3]">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[#878787] hover:bg-[#fafafa] rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTextUpload}
              disabled={!textInput.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#673ae4] hover:bg-[#5d0f4c] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Parsing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
