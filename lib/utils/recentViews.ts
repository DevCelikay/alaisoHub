// Utility to manage recently viewed items

export interface RecentView {
  id: string
  type: 'sop' | 'prompt' | 'resource'
  title: string
  viewedAt: number
}

const STORAGE_KEY = 'alaiso_recent_views'
const MAX_RECENT_ITEMS = 10

export function getRecentViews(): RecentView[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const items: RecentView[] = JSON.parse(stored)
    return items.sort((a, b) => b.viewedAt - a.viewedAt)
  } catch {
    return []
  }
}

export function addRecentView(item: Omit<RecentView, 'viewedAt'>): void {
  if (typeof window === 'undefined') return

  try {
    const existing = getRecentViews()

    // Remove existing entry for this item if it exists
    const filtered = existing.filter(v => !(v.id === item.id && v.type === item.type))

    // Add new entry at the beginning
    const updated: RecentView[] = [
      { ...item, viewedAt: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recent view:', err)
  }
}

export function clearRecentViews(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear recent views:', err)
  }
}
