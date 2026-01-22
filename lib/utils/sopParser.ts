import yaml from 'js-yaml'
import { SOPStep, StepType } from '../types/database'

interface ParsedSOP {
  title: string
  objectives: string
  logins_prerequisites: string
  steps: SOPStep[]
}

interface YAMLStep {
  title: string
  content: string
  type?: StepType
}

interface YAMLSOP {
  title: string
  objectives?: string
  prerequisites?: string
  tags?: string[]
  steps: YAMLStep[]
}

export function parseYAMLFile(content: string): ParsedSOP {
  const doc = yaml.load(content) as YAMLSOP

  const steps: SOPStep[] = (doc.steps || []).map((step, index) => ({
    id: crypto.randomUUID(),
    title: step.title || '',
    content: step.content || '',
    order: index,
    type: step.type || 'standard'
  }))

  return {
    title: doc.title || '',
    objectives: doc.objectives || '',
    logins_prerequisites: doc.prerequisites || '',
    steps
  }
}

export function parseSOPFile(content: string, filename?: string): ParsedSOP {
  // Check if file is YAML
  if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
    return parseYAMLFile(content)
  }

  // Try to detect YAML by content (starts with common YAML patterns)
  const trimmed = content.trim()
  if (trimmed.startsWith('title:') || trimmed.startsWith('---')) {
    try {
      return parseYAMLFile(content)
    } catch {
      // Fall through to text parsing
    }
  }
  const lines = content.split('\n')

  let title = ''
  let objectives = ''
  let logins_prerequisites = ''
  const steps: SOPStep[] = []

  let currentSection = ''
  let currentStepTitle = ''
  let currentStepContent: string[] = []
  let stepOrder = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Extract title from "SOP: ..." line
    if (line.startsWith('SOP:')) {
      title = line.replace('SOP:', '').trim()
      continue
    }

    // Detect section headers
    if (line === 'Objectives and Outcomes') {
      currentSection = 'objectives'
      continue
    } else if (line === 'Logins and Prerequisites') {
      currentSection = 'logins'
      continue
    } else if (line === 'SOP Content' || line.startsWith('SOP Content')) {
      currentSection = 'content'
      continue
    } else if (line === 'Indicators of Success') {
      // End of main content, ignore the rest
      break
    }

    // Detect step headers (e.g., "Step 1 —", "Step 2 —")
    const stepMatch = line.match(/^Step\s+(\d+)\s*[—-]\s*(.+)$/)
    if (stepMatch && currentSection === 'content') {
      // Save previous step if exists
      if (currentStepTitle && currentStepContent.length > 0) {
        steps.push({
          id: crypto.randomUUID(),
          title: currentStepTitle,
          content: currentStepContent.join('\n').trim(),
          order: stepOrder++
        })
      }

      // Start new step
      currentStepTitle = stepMatch[2].trim()
      currentStepContent = []
      continue
    }

    // Add content to appropriate section
    if (line.length === 0) {
      // Keep blank lines for formatting
      if (currentSection === 'objectives' && objectives.length > 0) {
        objectives += '\n'
      } else if (currentSection === 'logins' && logins_prerequisites.length > 0) {
        logins_prerequisites += '\n'
      } else if (currentSection === 'content' && currentStepContent.length > 0) {
        currentStepContent.push('')
      }
      continue
    }

    // Append to current section
    if (currentSection === 'objectives') {
      objectives += (objectives ? '\n' : '') + line
    } else if (currentSection === 'logins') {
      logins_prerequisites += (logins_prerequisites ? '\n' : '') + line
    } else if (currentSection === 'content' && currentStepTitle) {
      currentStepContent.push(line)
    }
  }

  // Save last step
  if (currentStepTitle && currentStepContent.length > 0) {
    steps.push({
      id: crypto.randomUUID(),
      title: currentStepTitle,
      content: currentStepContent.join('\n').trim(),
      order: stepOrder
    })
  }

  // If no title was found in "SOP:" format, try to use first line
  if (!title && lines.length > 0) {
    title = lines[0].trim()
  }

  return {
    title,
    objectives,
    logins_prerequisites,
    steps
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      resolve(text)
    }
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}
