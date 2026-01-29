'use client'

// =====================================================
// EmailPreview Component
// Subject + body display with text/HTML toggle
// =====================================================

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Code, FileText, Copy, Check } from 'lucide-react'
import { Step } from '@/lib/types/campaigns'
import { cn } from '@/lib/utils'

interface EmailPreviewProps {
  step: Step
  className?: string
}

export default function EmailPreview({
  step,
  className,
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'html' | 'source'>('html')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const hasHtml = !!step.body_html

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              Step {step.step_number}{step.variant}
            </CardTitle>
          </div>
          <Badge variant="outline">Variant {step.variant}</Badge>
        </div>

        {/* Subject Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Subject Line</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(step.subject || '', 'subject')}
              className="h-8"
            >
              {copiedField === 'subject' ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-base font-medium p-3 bg-muted rounded-md">
            {step.subject || '(No subject)'}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* Body Content */}
        <div className="space-y-3">
          {/* View Mode Toggle */}
          {hasHtml && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'html' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('html')}
              >
                <Mail className="h-4 w-4 mr-1" />
                Rendered
              </Button>
              <Button
                variant={viewMode === 'source' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('source')}
              >
                <Code className="h-4 w-4 mr-1" />
                Source
              </Button>
            </div>
          )}

          {/* Body Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Email Body
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    step.body_html || '',
                    'body'
                  )
                }
                className="h-8"
              >
                {copiedField === 'body' ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {!hasHtml ? (
              <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                (No email body)
              </div>
            ) : viewMode === 'html' ? (
              <div
                className="p-4 bg-white border rounded-md max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: step.body_html || '' }}
              />
            ) : (
              <div className="p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {step.body_html || '(No HTML body)'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for comparison grids
interface CompactEmailPreviewProps {
  step: Step
  showCopyButtons?: boolean
}

export function CompactEmailPreview({
  step,
  showCopyButtons = false,
}: CompactEmailPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Strip HTML tags for preview
  const bodyPreview = step.body_html
    ? step.body_html.replace(/<[^>]*>/g, '').substring(0, 150)
    : '(No body)'

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <Badge variant="outline" className="mb-2">
        Step {step.step_number}{step.variant}
      </Badge>

      {/* Subject */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Subject</span>
          {showCopyButtons && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(step.subject || '', `subject-${step.id}`)}
              className="h-6 px-2"
            >
              {copiedField === `subject-${step.id}` ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        <p className="text-sm font-medium">{step.subject || '(No subject)'}</p>
      </div>

      {/* Body Preview */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Body Preview</span>
        <p className="text-xs text-muted-foreground line-clamp-3">
          {bodyPreview}
          {bodyPreview.length >= 150 && '...'}
        </p>
      </div>
    </div>
  )
}
