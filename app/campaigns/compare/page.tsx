'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import CampaignSelector from '@/components/campaigns/CampaignSelector'
import CampaignStatsCard from '@/components/campaigns/CampaignStatsCard'
import CampaignCopyComparison from '@/components/campaigns/CampaignCopyComparison'
import type { Campaign, Step } from '@/lib/types/campaigns'

interface CampaignWithSteps extends Campaign {
  steps: Step[]
}

export default function CampaignComparePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignWithSteps[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)

  useEffect(() => {
    checkAuthAndLoadCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaignIds.length > 0) {
      loadSelectedCampaigns()
    } else {
      setSelectedCampaigns([])
    }
  }, [selectedCampaignIds])

  const checkAuthAndLoadCampaigns = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Fetch all campaigns
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .order('name')

    if (campaignsData) {
      setCampaigns(campaignsData)
    }

    setLoading(false)
  }

  const loadSelectedCampaigns = async () => {
    setLoadingCampaigns(true)
    const supabase = createClient()

    const campaignsWithSteps: CampaignWithSteps[] = []

    for (const id of selectedCampaignIds) {
      // Fetch campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      // Fetch steps for this campaign
      const { data: steps } = await supabase
        .from('steps')
        .select('*')
        .eq('campaign_id', id)
        .order('step_number')
        .order('variant')

      if (campaign) {
        campaignsWithSteps.push({
          ...campaign,
          steps: steps || []
        })
      }
    }

    setSelectedCampaigns(campaignsWithSteps)
    setLoadingCampaigns(false)
  }

  const handleCampaignSelect = (campaignId: string) => {
    if (selectedCampaignIds.includes(campaignId)) {
      // Remove if already selected
      setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== campaignId))
    } else if (selectedCampaignIds.length < 3) {
      // Add if less than 3 selected
      setSelectedCampaignIds([...selectedCampaignIds, campaignId])
    }
  }

  const handleClearAll = () => {
    setSelectedCampaignIds([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="p-3 pb-0">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3]">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-[#1a1a1a]">Campaign Comparison</h1>
              </div>
              {selectedCampaignIds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm text-[#878787] hover:text-[#673ae4] hover:bg-[#f3f4ff] rounded-xl transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Campaign Selector */}
        <div className="mb-6">
          <CampaignSelector
            campaigns={campaigns}
            selectedIds={selectedCampaignIds}
            onSelect={handleCampaignSelect}
            maxSelection={3}
          />
        </div>

        {selectedCampaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Compare Campaigns</h2>
            <p className="text-[#878787]">Select up to 3 campaigns above to compare their performance and copy</p>
          </div>
        ) : (
          <>
            {/* Stats Comparison */}
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#673ae4]"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {selectedCampaigns.map((campaign) => (
                    <CampaignStatsCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>

                {/* Copy Comparison */}
                <CampaignCopyComparison campaigns={selectedCampaigns} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
