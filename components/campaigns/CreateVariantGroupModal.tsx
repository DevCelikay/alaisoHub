'use client'

// =====================================================
// CreateVariantGroupModal Component
// Modal form to create variant comparison groups
// =====================================================

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { CampaignWithRelations } from '@/lib/types/campaigns'

interface CreateVariantGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (groupId: string) => void
}

export default function CreateVariantGroupModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateVariantGroupModalProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([])
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingCampaigns, setFetchingCampaigns] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCampaigns()
      // Reset form
      setSelectedCampaignIds([])
      setName('')
      setDescription('')
      setError(null)
      setSuccess(false)
    }
  }, [open])

  const fetchCampaigns = async () => {
    setFetchingCampaigns(true)
    try {
      const response = await fetch('/api/campaigns')
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns || [])
      } else {
        setError('Failed to fetch campaigns')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setFetchingCampaigns(false)
    }
  }

  const handleToggleCampaign = (campaignId: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }

    if (selectedCampaignIds.length < 2) {
      setError('Please select at least 2 campaigns to compare')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/variant-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          campaign_ids: selectedCampaignIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.(data.group.id)
          onOpenChange(false)
        }, 1000)
      } else {
        setError(data.error || 'Failed to create variant group')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Variant Comparison Group</DialogTitle>
          <DialogDescription>
            Select 2 or more campaigns to compare their performance side-by-side
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Welcome Email Test - Jan 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this comparison..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading || success}
              rows={3}
            />
          </div>

          {/* Campaign Selection */}
          <div className="space-y-3">
            <Label>
              Select Campaigns <span className="text-red-500">*</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({selectedCampaignIds.length} selected)
              </span>
            </Label>

            {fetchingCampaigns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : campaigns.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No campaigns available. Please sync campaigns first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-start gap-3 p-3 hover:bg-accent border-b last:border-b-0"
                  >
                    <Checkbox
                      id={`campaign-${campaign.id}`}
                      checked={selectedCampaignIds.includes(campaign.id)}
                      onCheckedChange={() => handleToggleCampaign(campaign.id)}
                      disabled={loading || success}
                    />
                    <Label
                      htmlFor={`campaign-${campaign.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {campaign.reply_rate !== null && (
                          <span>Reply: {campaign.reply_rate.toFixed(1)}%</span>
                        )}
                        {campaign.reply_rate !== null && campaign.emails_sent > 0 && ' | '}
                        {campaign.emails_sent > 0 && (
                          <span>{campaign.emails_sent} sent</span>
                        )}
                        {campaign.emails_sent === 0 && campaign.reply_rate === null && (
                          <span className="text-muted-foreground">No data yet</span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {selectedCampaignIds.length > 0 && selectedCampaignIds.length < 2 && (
              <p className="text-sm text-yellow-600">
                Select at least 1 more campaign to create a comparison
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>Variant group created successfully!</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || success}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success || selectedCampaignIds.length < 2}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Created!
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
