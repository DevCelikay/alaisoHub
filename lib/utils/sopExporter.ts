import yaml from 'js-yaml'
import { SOPWithTags, SOPStep } from '../types/database'

interface ExportStep {
  title: string
  content: string
  type?: 'standard' | 'decision'
}

interface ExportSOP {
  title: string
  objectives?: string
  prerequisites?: string
  tags?: string[]
  steps: ExportStep[]
}

export function sopToYAML(sop: SOPWithTags): string {
  const steps = (sop.content as unknown as SOPStep[]) || []

  const exportData: ExportSOP = {
    title: sop.title,
    steps: steps.map(step => {
      const exportStep: ExportStep = {
        title: step.title,
        content: step.content,
      }
      if (step.type && step.type !== 'standard') {
        exportStep.type = step.type
      }
      return exportStep
    })
  }

  if (sop.objectives) {
    exportData.objectives = sop.objectives
  }

  if (sop.logins_prerequisites) {
    exportData.prerequisites = sop.logins_prerequisites
  }

  if (sop.tags && sop.tags.length > 0) {
    exportData.tags = sop.tags.map(tag => tag.name)
  }

  return yaml.dump(exportData, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  })
}

export function downloadYAML(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.yaml'
}
