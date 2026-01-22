// Run with: npx tsx scripts/seed-tags.ts
// Or add to package.json: "seed:tags": "tsx scripts/seed-tags.ts"

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TAGS = [
  { name: 'Technical', color: '#3b82f6' },        // Blue
  { name: 'Campaign Strategy', color: '#10b981' }, // Green
  { name: 'Client Management', color: '#f59e0b' }, // Amber
  { name: 'Business Development', color: '#673ae4' }, // Purple
  { name: 'Operations', color: '#ef4444' },       // Red
]

async function seedTags() {
  console.log('Seeding tags...')

  for (const tag of TAGS) {
    // Check if tag already exists
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tag.name)
      .single()

    if (existing) {
      console.log(`Tag "${tag.name}" already exists, skipping`)
      continue
    }

    const { error } = await supabase
      .from('tags')
      .insert(tag)

    if (error) {
      console.error(`Error creating tag "${tag.name}":`, error.message)
    } else {
      console.log(`Created tag: ${tag.name}`)
    }
  }

  console.log('Done!')
}

seedTags()
