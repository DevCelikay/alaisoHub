'use client'

// =====================================================
// ReportingDashboard Component
// Fresh start - Reporting center with dropdown module
// =====================================================

import { useState } from 'react'
import CampaignList from './CampaignList'

type ReportingView = 'campaign-list' | 'variant-analysis' | 'timeline-analytics' | 'client-health'

const REPORTING_VIEWS: { value: ReportingView; label: string }[] = [
  { value: 'campaign-list', label: 'Campaign List' },
  { value: 'variant-analysis', label: 'Variant Analysis' },
  { value: 'timeline-analytics', label: 'Timeline Analytics' },
  { value: 'client-health', label: 'Client Health' },
]

export default function ReportingDashboard() {
  const [selectedView, setSelectedView] = useState<ReportingView | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedViewLabel = selectedView
    ? REPORTING_VIEWS.find((v) => v.value === selectedView)?.label
    : 'Select a view...'

  return (
    <div className="p-6">
      {/* Top Left: Reporting View Header */}
      <h1 className="text-2xl font-semibold mb-4">Reporting View</h1>

      {/* Compact Dropdown Module - Top Left */}
      <div className="relative inline-block w-[293px]">
        <div className="rounded-md border border-[#1971c2] p-4">
          <label className="text-base font-semibold text-[#1971c2] block mb-3">
            Dropdown
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-md border border-[#1971c2] bg-white px-4 py-3 text-left text-base hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1971c2] focus:ring-offset-2 transition-colors"
            >
              <span className={selectedView ? 'text-gray-900' : 'text-gray-500'}>
                {selectedViewLabel}
              </span>
              <svg
                className={`h-5 w-5 text-[#1971c2] transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute z-20 mt-1 w-full rounded-md border border-[#1971c2] bg-white shadow-lg overflow-hidden">
                  {REPORTING_VIEWS.map((view, index) => (
                    <button
                      key={view.value}
                      type="button"
                      onClick={() => {
                        setSelectedView(view.value)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-base border-b border-[#1971c2] last:border-b-0 hover:bg-[#1971c2] hover:text-white transition-colors ${
                        selectedView === view.value
                          ? 'bg-[#1971c2] text-white'
                          : 'text-[#1971c2]'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Show selected view */}
      {selectedView === 'campaign-list' && <CampaignList />}
      {selectedView === 'variant-analysis' && (
        <div className="mt-6 text-gray-500">Variant Analysis - Coming soon...</div>
      )}
      {selectedView === 'timeline-analytics' && (
        <div className="mt-6 text-gray-500">Timeline Analytics - Coming soon...</div>
      )}
      {selectedView === 'client-health' && (
        <div className="mt-6 text-gray-500">Client Health - Coming soon...</div>
      )}
    </div>
  )
}
