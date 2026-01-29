// =====================================================
// DEPRECATED: Analytics Sync API Route
// This endpoint is deprecated - syncing is handled externally via n8n workflow
// Kept for reference only - will be removed in future versions
// =====================================================

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Analytics syncing is handled externally via n8n workflow.',
      deprecated: true
    },
    { status: 410 } // 410 Gone
  )
}
