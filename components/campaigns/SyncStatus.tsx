'use client'

// =====================================================
// SyncStatus Component
// Display sync history and status indicator
// =====================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { SyncHistory } from '@/lib/types/campaigns'

interface SyncStatusProps {
  limit?: number
  showTitle?: boolean
}

export default function SyncStatus({ limit = 5, showTitle = true }: SyncStatusProps) {
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncHistory()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchSyncHistory, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSyncHistory = async () => {
    try {
      const response = await fetch(`/api/sync-history?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setSyncHistory(data.history || [])
        setError(null)
      } else {
        setError('Failed to fetch sync history')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      in_progress: 'default',
      completed: 'default',
      success: 'default',
      failed: 'destructive',
      partial: 'secondary',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
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

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization operations</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {syncHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sync history available. Run your first sync to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {syncHistory.map((sync) => (
              <div
                key={sync.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">{getStatusIcon(sync.status)}</div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {sync.sync_type.replace('_', ' ')}
                      </span>
                      {getStatusBadge(sync.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(sync.started_at)}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {sync.campaigns_synced > 0 && (
                      <span className="text-green-600">
                        {sync.campaigns_synced} synced
                      </span>
                    )}
                    {sync.campaigns_failed > 0 && (
                      <>
                        {sync.campaigns_synced > 0 && ' · '}
                        <span className="text-red-600">
                          {sync.campaigns_failed} failed
                        </span>
                      </>
                    )}
                  </div>

                  {sync.error_message && (
                    <div className="text-sm text-red-600 mt-1">
                      {sync.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
