'use client'

// =====================================================
// CampaignSettings Component
// View-only component - syncing handled externally via n8n
// =====================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, Info } from 'lucide-react'

interface CampaignSettingsProps {
  onSyncComplete?: () => void
}

export default function CampaignSettings({ onSyncComplete }: CampaignSettingsProps) {
  const [hasApiKey, setHasApiKey] = useState(false)

  // Check if API key exists on mount
  useEffect(() => {
    checkApiKey()
  }, [])

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/instantly/credentials')
      if (response.ok) {
        const data = await response.json()
        setHasApiKey(!!data.api_key)
      }
    } catch (error) {
      console.error('Failed to check API key:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sync</CardTitle>
          <CardDescription>
            Campaign and analytics data is synced automatically via external workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasApiKey ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                API credentials are configured. Data syncing is handled by your n8n workflow.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No API credentials found. Configure credentials in your n8n workflow to enable syncing.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              This interface is read-only. All data syncing is performed by your external n8n workflow
              that connects directly to Supabase.
            </p>
            <p>
              The workflow should sync campaigns and steps using the <code className="bg-muted px-1 py-0.5 rounded">upsert_step</code> function
              and update campaign analytics directly in the database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
