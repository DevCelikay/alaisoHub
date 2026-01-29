'use client'

import { useState } from 'react'
import { X, Mail, MessageSquare, Eye, MousePointer, ThumbsUp, Play, RotateCcw, Shuffle } from 'lucide-react'
import type { Campaign, Step } from '@/lib/types/campaigns'

// Spintax processor - processes {option1|option2|option3} syntax
// Each spintax block is independently random
const processSpintax = (text: string): string => {
  if (!text) return text

  let result = text
  const spintaxRegex = /\{+([^{}]+)\}+/g
  let match
  let iteration = 0
  const maxIterations = 100 // Prevent infinite loops

  while ((match = spintaxRegex.exec(result)) !== null && iteration < maxIterations) {
    let options = match[1].split('|').map(opt => opt.trim())

    // Remove "RANDOM" if it's the first option (it's just a marker, not an actual option)
    if (options[0].toUpperCase() === 'RANDOM' && options.length > 1) {
      options = options.slice(1)
    }

    // Each spintax block gets its own random selection
    const randomIndex = Math.floor(Math.random() * options.length)
    const selected = options[randomIndex]
    result = result.substring(0, match.index) + selected + result.substring(match.index + match[0].length)
    spintaxRegex.lastIndex = 0 // Reset regex after modification
    iteration++
  }

  return result
}

interface CampaignWithSteps extends Campaign {
  steps: Step[]
}

interface CampaignComparisonViewProps {
  campaigns: CampaignWithSteps[]
  onClose: () => void
}

export default function CampaignComparisonView({
  campaigns,
  onClose
}: CampaignComparisonViewProps) {
  // Track selected step/variant per campaign: { campaignId: { step: number, variant: string } }
  const [selectedStepVariant, setSelectedStepVariant] = useState<Record<string, { step: number; variant: string }>>(() => {
    // Initialize each campaign with first available step/variant
    const initial: Record<string, { step: number; variant: string }> = {}
    campaigns.forEach(campaign => {
      const firstStep = campaign.steps[0]
      if (firstStep) {
        initial[campaign.id] = {
          step: firstStep.step_number,
          variant: firstStep.variant
        }
      }
    })
    return initial
  })

  // Track preview state for each campaign: { campaignId: { subject: processedText, body: processedHTML } }
  const [previewStates, setPreviewStates] = useState<Record<string, { subject: string; body: string } | null>>({})

  if (campaigns.length === 0) return null

  // Get available steps/variants for a specific campaign
  const getAvailableStepsForCampaign = (campaign: CampaignWithSteps) => {
    const stepNumbers = Array.from(new Set(campaign.steps.map(s => s.step_number))).sort((a, b) => a - b)
    return stepNumbers
  }

  const getAvailableVariantsForCampaign = (campaign: CampaignWithSteps, stepNumber: number) => {
    const variants = campaign.steps
      .filter(s => s.step_number === stepNumber)
      .map(s => s.variant)
      .sort()
    return variants
  }

  // Get the step for each campaign based on its individual selection
  const getStepForCampaign = (campaign: CampaignWithSteps) => {
    const selection = selectedStepVariant[campaign.id]
    if (!selection) return null

    return campaign.steps.find(
      s => s.step_number === selection.step && s.variant === selection.variant
    )
  }

  const handleStepChange = (campaignId: string, newStep: number, campaign: CampaignWithSteps) => {
    // When step changes, select first available variant for that step
    const variants = getAvailableVariantsForCampaign(campaign, newStep)
    const firstVariant = variants[0] || 'A'

    setSelectedStepVariant(prev => ({
      ...prev,
      [campaignId]: {
        step: newStep,
        variant: firstVariant
      }
    }))

    // Clear preview when changing step
    setPreviewStates(prev => ({
      ...prev,
      [campaignId]: null
    }))
  }

  const handleVariantChange = (campaignId: string, newVariant: string) => {
    setSelectedStepVariant(prev => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        variant: newVariant
      }
    }))

    // Clear preview when changing variant
    setPreviewStates(prev => ({
      ...prev,
      [campaignId]: null
    }))
  }

  const calculateRate = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(1) + '%'
  }

  const hasSpintax = (text: string | null | undefined): boolean => {
    if (!text) return false
    // Check for spintax but ignore {{ RANDOM }}
    const cleanText = text.replace(/\{\{\s*RANDOM\s*\}\}/gi, '')
    return cleanText.includes('{') && cleanText.includes('|')
  }

  const handlePreview = (campaignId: string, step: Step) => {
    setPreviewStates(prev => ({
      ...prev,
      [campaignId]: {
        subject: processSpintax(step.subject || ''),
        body: processSpintax(step.body_html || '')
      }
    }))
  }

  const handleRandomize = (campaignId: string, step: Step) => {
    // Generate a new random variation
    setPreviewStates(prev => ({
      ...prev,
      [campaignId]: {
        subject: processSpintax(step.subject || ''),
        body: processSpintax(step.body_html || '')
      }
    }))
  }

  const handleShowOriginal = (campaignId: string) => {
    setPreviewStates(prev => ({
      ...prev,
      [campaignId]: null
    }))
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#e3e3e3] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e3e3e3] bg-[#fafafa]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">Campaign Comparison</h2>
            <p className="text-sm text-[#878787] mt-1">
              Comparing {campaigns.length} campaigns side-by-side • Select step/variant per campaign below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-all"
            title="Close comparison"
          >
            <X className="w-5 h-5 text-[#878787]" />
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className={`grid grid-cols-1 ${
        campaigns.length === 2 ? 'lg:grid-cols-2' : campaigns.length === 3 ? 'lg:grid-cols-3' : ''
      } gap-6 p-6`}>
        {campaigns.map((campaign) => {
          const step = getStepForCampaign(campaign)
          const replyRate = calculateRate(campaign.replies, campaign.emails_sent)
          const openRate = calculateRate(campaign.opens, campaign.emails_sent)
          const positiveRate = calculateRate(campaign.positive_replies, campaign.replies)
          const isPreviewActive = !!previewStates[campaign.id]
          const previewData = previewStates[campaign.id]
          const selection = selectedStepVariant[campaign.id]
          const availableSteps = getAvailableStepsForCampaign(campaign)
          const availableVariants = selection ? getAvailableVariantsForCampaign(campaign, selection.step) : []

          return (
            <div key={campaign.id} className="border border-[#e3e3e3] rounded-xl overflow-hidden">
              {/* Campaign Header */}
              <div className="px-4 py-3 bg-[#673ae4] text-white">
                <h3 className="font-semibold truncate">{campaign.name}</h3>
              </div>

              {/* Step/Variant Selectors */}
              <div className="px-4 py-3 bg-white border-b border-[#e3e3e3]">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-[#878787] mb-1">Step</label>
                    <select
                      value={selection?.step || availableSteps[0]}
                      onChange={(e) => handleStepChange(campaign.id, Number(e.target.value), campaign)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#e3e3e3] text-sm focus:outline-none focus:border-[#673ae4] bg-white"
                    >
                      {availableSteps.map(num => (
                        <option key={num} value={num}>Step {num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#878787] mb-1">Variant</label>
                    <select
                      value={selection?.variant || availableVariants[0]}
                      onChange={(e) => handleVariantChange(campaign.id, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#e3e3e3] text-sm focus:outline-none focus:border-[#673ae4] bg-white"
                    >
                      {availableVariants.map(variant => (
                        <option key={variant} value={variant}>{variant}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="p-4 bg-[#fafafa] border-b border-[#e3e3e3]">
                <h4 className="text-xs font-medium text-[#878787] uppercase mb-3">
                  Campaign Stats
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#878787]">Sent</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {campaign.emails_sent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#878787]">Replies</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {campaign.replies.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 font-medium">{replyRate}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#878787]">Opens</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {campaign.opens.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">{openRate}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#878787]">Positive</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">
                        {campaign.positive_replies.toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">{positiveRate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {step ? (
                <div className="p-4 space-y-4">
                  {/* Spintax Control Buttons */}
                  {(hasSpintax(step.subject) || hasSpintax(step.body_html)) && (
                    <div className="flex items-center space-x-2">
                      {!isPreviewActive ? (
                        <button
                          onClick={() => handlePreview(campaign.id, step)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs bg-[#673ae4] text-white rounded-lg hover:bg-[#5a32c7] transition-all"
                        >
                          <Play className="w-3 h-3" />
                          <span>Preview Spintax</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRandomize(campaign.id, step)}
                            className="flex items-center space-x-1 px-3 py-2 text-xs bg-[#673ae4] text-white rounded-lg hover:bg-[#5a32c7] transition-all"
                          >
                            <Shuffle className="w-3 h-3" />
                            <span>Random</span>
                          </button>
                          <button
                            onClick={() => handleShowOriginal(campaign.id)}
                            className="flex items-center space-x-1 px-3 py-2 text-xs border border-[#e3e3e3] text-[#878787] rounded-lg hover:bg-[#fafafa] transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Show Original</span>
                          </button>
                        </>
                      )}
                      {isPreviewActive && (
                        <span className="text-xs text-[#673ae4] font-medium">
                          Previewing variation
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subject Line */}
                  <div>
                    <label className="block text-xs font-medium text-[#878787] uppercase mb-2">
                      Subject Line
                    </label>
                    <div className="p-3 bg-[#fafafa] rounded-lg border border-[#e3e3e3]">
                      <p className="text-sm text-[#1a1a1a]">
                        {isPreviewActive && previewData?.subject
                          ? previewData.subject
                          : (step.subject || <span className="text-[#878787] italic">No subject</span>)
                        }
                      </p>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div>
                    <label className="block text-xs font-medium text-[#878787] uppercase mb-2">
                      Email Body
                    </label>
                    <div className="p-4 bg-[#fafafa] rounded-lg border border-[#e3e3e3] max-h-[400px] overflow-y-auto">
                      {isPreviewActive && previewData?.body ? (
                        <div
                          className="prose prose-sm max-w-none text-[#1a1a1a] [&_p]:mb-2 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={{ __html: previewData.body }}
                        />
                      ) : step.body_html ? (
                        <div
                          className="prose prose-sm max-w-none text-[#1a1a1a] [&_p]:mb-2 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={{ __html: step.body_html }}
                        />
                      ) : (
                        <p className="text-sm text-[#878787] italic">No body content</p>
                      )}
                    </div>
                  </div>

                  {/* Step Stats */}
                  <div className="pt-3 border-t border-[#e3e3e3]">
                    <label className="block text-xs font-medium text-[#878787] uppercase mb-2">
                      Step Performance
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#878787]">Sent</p>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{step.sent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#878787]">Replies</p>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{step.unique_replies}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#878787]">Opens</p>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{step.unique_opened}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#878787]">Clicks</p>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{step.unique_clicks}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#878787]">
                    No data for Step {selection?.step}{selection?.variant}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
