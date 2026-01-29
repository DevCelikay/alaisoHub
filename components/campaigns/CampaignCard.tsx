'use client'

// =====================================================
// CampaignCard Component
// Individual campaign display in grid
// =====================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointerClick,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
} from 'lucide-react'
import { CampaignWithRelations } from '@/lib/types/campaigns'
import { cn } from '@/lib/utils'

interface CampaignCardProps {
  campaign: CampaignWithRelations
  onSelect?: (campaign: CampaignWithRelations) => void
  selected?: boolean
  showVariantInfo?: boolean
}

export default function CampaignCard({
  campaign,
  onSelect,
  selected = false,
  showVariantInfo = true,
}: CampaignCardProps) {
  const getStatusIcon = (status: number | null) => {
    switch (status) {
      case 1:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 3:
        return <Pause className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: number | null) => {
    if (status === null) return null

    const statusMap: Record<number, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      1: { label: 'Active', variant: 'default' },
      3: { label: 'Paused', variant: 'secondary' },
    }

    const statusInfo = statusMap[status] || { label: `Status ${status}`, variant: 'outline' as const }

    return (
      <Badge variant={statusInfo.variant} className="capitalize">
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-all cursor-pointer',
        selected && 'ring-2 ring-primary'
      )}
      onClick={() => onSelect?.(campaign)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg line-clamp-1">{campaign.name}</CardTitle>
            <CardDescription className="text-xs">
              Last synced: {formatDate(campaign.last_synced_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(campaign.status)}
            {getStatusBadge(campaign.status)}
          </div>
        </div>

      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Opens */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              Opens
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-blue-600">
                {campaign.opens.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.emails_sent > 0 
                ? `${((campaign.opens / campaign.emails_sent) * 100).toFixed(1)}% open rate`
                : 'No emails sent'}
            </p>
          </div>

          {/* Replies */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Replies
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  'text-xl font-bold',
                  campaign.reply_rate && campaign.reply_rate > 10
                    ? 'text-green-600'
                    : campaign.reply_rate && campaign.reply_rate > 5
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                )}
              >
                {campaign.replies.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.reply_rate ? `${campaign.reply_rate.toFixed(1)}% reply rate` : 'No replies'}
            </p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Emails Sent</span>
            <span className="font-medium">{campaign.emails_sent.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Clicks</span>
            <span className="font-medium">{campaign.clicks.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Leads Total</span>
            <span className="font-medium">{campaign.leads_total.toLocaleString()}</span>
          </div>
          {campaign.positive_replies > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Positive Replies</span>
              <span className="font-medium text-green-600">
                {campaign.positive_replies.toLocaleString()}
                {campaign.positive_rate && ` (${campaign.positive_rate.toFixed(1)}%)`}
              </span>
            </div>
          )}
        </div>

        {/* Steps Info */}
        {campaign.steps && campaign.steps.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {campaign.steps.length} step
              {campaign.steps.length !== 1 ? 's' : ''} ({new Set(campaign.steps.map(s => s.step_number)).size} unique step
              {new Set(campaign.steps.map(s => s.step_number)).size !== 1 ? 's' : ''} with variants)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
