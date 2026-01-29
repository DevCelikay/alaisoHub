'use client'

// =====================================================
// CampaignDashboard Component
// Grid view of all campaigns with metrics
// =====================================================

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import CampaignCard from './CampaignCard'
import { CampaignWithRelations } from '@/lib/types/campaigns'

interface CampaignDashboardProps {
  onCampaignSelect?: (campaign: CampaignWithRelations) => void
  selectedCampaigns?: string[]
  multiSelect?: boolean
  onRefresh?: () => void
}

export default function CampaignDashboard({
  onCampaignSelect,
  selectedCampaigns = [],
  multiSelect = false,
  onRefresh,
}: CampaignDashboardProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'open_rate' | 'reply_rate' | 'recent'>('recent')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [campaigns, searchQuery, statusFilter, sortBy])

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns')
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns || [])
      } else {
        setError(data.error || 'Failed to fetch campaigns')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...campaigns]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((campaign) =>
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      const statusMap: Record<string, number> = {
        active: 1,
        paused: 3,
      }
      const targetStatus = statusMap[statusFilter.toLowerCase()]
      if (targetStatus !== undefined) {
        filtered = filtered.filter((campaign) => campaign.status === targetStatus)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'open_rate':
          const aOpenRate = a.emails_sent > 0 ? (a.opens / a.emails_sent) * 100 : 0
          const bOpenRate = b.emails_sent > 0 ? (b.opens / b.emails_sent) * 100 : 0
          return bOpenRate - aOpenRate
        case 'reply_rate':
          return (b.reply_rate || 0) - (a.reply_rate || 0)
        case 'recent':
        default:
          return (
            new Date(b.last_synced_at).getTime() - new Date(a.last_synced_at).getTime()
          )
      }
    })

    setFilteredCampaigns(filtered)
  }

  const handleRefresh = () => {
    fetchCampaigns()
    onRefresh?.()
  }

  const handleCampaignSelect = (campaign: CampaignWithRelations) => {
    onCampaignSelect?.(campaign)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading campaigns...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
        <p className="text-muted-foreground mb-4">
          Sync your campaigns from Instantly to get started
        </p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Synced</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="open_rate">Open Rate</SelectItem>
            <SelectItem value="reply_rate">Reply Rate</SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}{' '}
          {filteredCampaigns.length !== campaigns.length && `of ${campaigns.length} total`}
        </p>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">No campaigns match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onSelect={handleCampaignSelect}
              selected={selectedCampaigns.includes(campaign.id)}
              showVariantInfo={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
