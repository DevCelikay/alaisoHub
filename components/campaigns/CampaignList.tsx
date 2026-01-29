'use client'

// =====================================================
// CampaignList Component
// Lightweight table view with multi-select and comparison
// =====================================================

import { useState, useEffect } from 'react'
import { Campaign, Step } from '@/lib/types/campaigns'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CampaignComparisonView from './CampaignComparisonView'

interface CampaignWithSteps extends Campaign {
  steps: Step[]
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [selectedCampaignsWithSteps, setSelectedCampaignsWithSteps] = useState<CampaignWithSteps[]>([])
  const [loadingComparison, setLoadingComparison] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/campaigns')

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCampaign = (campaignId: string) => {
    if (selectedCampaignIds.includes(campaignId)) {
      setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== campaignId))
    } else if (selectedCampaignIds.length < 3) {
      setSelectedCampaignIds([...selectedCampaignIds, campaignId])
    }
  }

  const handleCompare = async () => {
    if (selectedCampaignIds.length < 2) return

    setLoadingComparison(true)
    const supabase = createClient()
    const campaignsWithSteps: CampaignWithSteps[] = []

    for (const id of selectedCampaignIds) {
      const campaign = campaigns.find(c => c.id === id)
      if (!campaign) continue

      // Fetch steps for this campaign
      const { data: steps } = await supabase
        .from('steps')
        .select('*')
        .eq('campaign_id', id)
        .order('step_number')
        .order('variant')

      campaignsWithSteps.push({
        ...campaign,
        steps: steps || []
      })
    }

    setSelectedCampaignsWithSteps(campaignsWithSteps)
    setShowComparison(true)
    setLoadingComparison(false)
  }

  const handleClearSelection = () => {
    setSelectedCampaignIds([])
    setShowComparison(false)
    setSelectedCampaignsWithSteps([])
  }

  const getStatusBadge = (status: number | null) => {
    if (status === 1) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Active
        </span>
      )
    } else if (status === 3) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Paused
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
  }

  const getCredentialName = (credential: { id: string; key_name?: string } | null | undefined) => {
    if (!credential) return 'N/A'
    return credential.key_name || 'Unnamed'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading campaigns...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">No campaigns found</div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Selection Actions Bar */}
      {selectedCampaignIds.length > 0 && (
        <div className="bg-[#673ae4] text-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {selectedCampaignIds.length} campaign{selectedCampaignIds.length !== 1 ? 's' : ''} selected
            </span>
            {selectedCampaignIds.length < 2 && (
              <span className="text-sm text-white/80">Select at least 2 campaigns to compare</span>
            )}
            {selectedCampaignIds.length === 3 && (
              <span className="text-sm text-white/80">Maximum 3 campaigns</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCompare}
              disabled={selectedCampaignIds.length < 2}
              className="px-4 py-2 bg-white text-[#673ae4] rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Compare Copy
            </button>
            <button
              onClick={handleClearSelection}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Campaign Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-[#e3e3e3]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credential
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Replies
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opens
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reply Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => {
              const isSelected = selectedCampaignIds.includes(campaign.id)
              const isDisabled = !isSelected && selectedCampaignIds.length >= 3

              return (
                <tr
                  key={campaign.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-[#f3f4ff]' : 'hover:bg-gray-50'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => !isDisabled && handleSelectCampaign(campaign.id)}
                      disabled={isDisabled}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#673ae4] border-[#673ae4]'
                          : 'border-gray-300 hover:border-[#673ae4]'
                      } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getCredentialName(campaign.credential)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.emails_sent?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.replies?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.opens?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.clicks?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.leads_total?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {campaign.reply_rate ? `${(campaign.reply_rate * 100).toFixed(2)}%` : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Comparison View */}
      {showComparison && (
        loadingComparison ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
          </div>
        ) : (
          <CampaignComparisonView
            campaigns={selectedCampaignsWithSteps}
            onClose={handleClearSelection}
          />
        )
      )}
    </div>
  )
}
