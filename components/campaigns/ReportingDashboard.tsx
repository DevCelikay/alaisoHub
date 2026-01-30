'use client'

// =====================================================
// ReportingDashboard Component
// Streamlined reporting center with tabs navigation
// =====================================================

import { useState, useEffect } from 'react'
import { BarChart3, List, GitCompare, Clock, Heart } from 'lucide-react'
import CampaignList from './CampaignList'

type ReportingView = 'campaign-list' | 'variant-analysis' | 'timeline-analytics' | 'client-health'

interface ViewConfig {
  value: ReportingView
  label: string
  icon: React.ReactNode
  available: boolean
}

const REPORTING_VIEWS: ViewConfig[] = [
  { value: 'campaign-list', label: 'Campaigns', icon: <List className="w-4 h-4" />, available: true },
  { value: 'variant-analysis', label: 'Variants', icon: <GitCompare className="w-4 h-4" />, available: false },
  { value: 'timeline-analytics', label: 'Timeline', icon: <Clock className="w-4 h-4" />, available: false },
  { value: 'client-health', label: 'Health', icon: <Heart className="w-4 h-4" />, available: false },
]

export default function ReportingDashboard() {
  const [selectedView, setSelectedView] = useState<ReportingView>('campaign-list')
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    totalReplies: 0,
  })

  // Fetch summary stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/campaigns')
        if (response.ok) {
          const data = await response.json()
          const campaigns = data.campaigns || []
          setStats({
            totalCampaigns: campaigns.length,
            activeCampaigns: campaigns.filter((c: any) => c.status === 1).length,
            totalSent: campaigns.reduce((sum: number, c: any) => sum + (c.emails_sent || 0), 0),
            totalReplies: campaigns.reduce((sum: number, c: any) => sum + (c.replies || 0), 0),
          })
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      }
    }
    fetchStats()
  }, [])

  const avgReplyRate = stats.totalSent > 0
    ? ((stats.totalReplies / stats.totalSent) * 100).toFixed(2)
    : '0.00'

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header with Stats */}
      <div className="bg-white border-b border-[#e3e3e3] px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#673ae4]" />
              <h1 className="text-lg font-semibold text-[#1a1a1a]">Reporting</h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-lg p-1">
              {REPORTING_VIEWS.map((view) => (
                <button
                  key={view.value}
                  onClick={() => view.available && setSelectedView(view.value)}
                  disabled={!view.available}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedView === view.value
                      ? 'bg-white text-[#673ae4] shadow-sm'
                      : view.available
                        ? 'text-[#878787] hover:text-[#1a1a1a]'
                        : 'text-[#c4c4c4] cursor-not-allowed'
                  }`}
                  title={!view.available ? 'Coming soon' : undefined}
                >
                  {view.icon}
                  <span>{view.label}</span>
                  {!view.available && (
                    <span className="text-[10px] bg-[#e3e3e3] text-[#878787] px-1 rounded">Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-[#878787]">Campaigns</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {stats.activeCampaigns} <span className="text-[#878787] font-normal">/ {stats.totalCampaigns}</span>
              </p>
            </div>
            <div className="w-px h-8 bg-[#e3e3e3]" />
            <div className="text-right">
              <p className="text-xs text-[#878787]">Total Sent</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{stats.totalSent.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-[#e3e3e3]" />
            <div className="text-right">
              <p className="text-xs text-[#878787]">Replies</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{stats.totalReplies.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-[#e3e3e3]" />
            <div className="text-right">
              <p className="text-xs text-[#878787]">Avg Reply Rate</p>
              <p className="text-sm font-semibold text-[#00c22a]">{avgReplyRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f5f5f7]">
        {selectedView === 'campaign-list' && <CampaignList />}

        {selectedView === 'variant-analysis' && (
          <ComingSoonPlaceholder
            title="Variant Analysis"
            description="Compare performance across different email variants and A/B tests"
            icon={<GitCompare className="w-12 h-12" />}
          />
        )}

        {selectedView === 'timeline-analytics' && (
          <ComingSoonPlaceholder
            title="Timeline Analytics"
            description="Track campaign performance over time with trend analysis"
            icon={<Clock className="w-12 h-12" />}
          />
        )}

        {selectedView === 'client-health' && (
          <ComingSoonPlaceholder
            title="Client Health"
            description="Monitor deliverability and engagement health across clients"
            icon={<Heart className="w-12 h-12" />}
          />
        )}
      </div>
    </div>
  )
}

// Compact Coming Soon placeholder
function ComingSoonPlaceholder({
  title,
  description,
  icon
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#f3f4ff] text-[#673ae4] rounded-2xl mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">{title}</h2>
        <p className="text-[#878787] mb-4">{description}</p>
        <span className="inline-flex items-center px-3 py-1 bg-[#fafafa] border border-[#e3e3e3] text-[#878787] text-sm rounded-full">
          Coming Soon
        </span>
      </div>
    </div>
  )
}
