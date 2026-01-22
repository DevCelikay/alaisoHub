import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rexygfrrsxwdzgaaimby.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJleHlnZnJyc3h3ZHpnYWFpbWJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ2MTQ4MSwiZXhwIjoyMDg0MDM3NDgxfQ.3rYiTqIxezUkVKtU3Atc3YGSVU-jCWCK39uRpWfWby8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TAGS = [
  { name: 'Technical', color: '#3b82f6' },           // Blue
  { name: 'Campaign Strategy', color: '#10b981' },   // Green
  { name: 'Client Management', color: '#f59e0b' },   // Amber
  { name: 'Business Development', color: '#673ae4' }, // Purple
  { name: 'Operations', color: '#ef4444' },          // Red
]

async function resetTags() {
  console.log('Clearing existing tag associations...')

  // Clear associations first
  await supabase.from('sop_tags').delete().neq('tag_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('prompt_tags').delete().neq('tag_id', '00000000-0000-0000-0000-000000000000')

  console.log('Deleting existing tags...')
  const { error: deleteError } = await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.error('Error deleting tags:', deleteError.message)
  }

  console.log('Creating new tags...')
  for (const tag of TAGS) {
    const { error } = await supabase.from('tags').insert(tag)

    if (error) {
      console.error(`Error creating "${tag.name}":`, error.message)
    } else {
      console.log(`Created: ${tag.name}`)
    }
  }

  // Verify
  const { data: allTags } = await supabase.from('tags').select('*').order('name')
  console.log('\nCurrent tags:')
  allTags?.forEach(t => console.log(`  - ${t.name} (${t.color})`))

  console.log('\nDone!')
}

resetTags()
