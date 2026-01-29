# Campaign Comparison Guide

## Overview

The Campaign Comparison feature allows you to compare up to 3 campaigns side-by-side, analyzing their performance metrics and email copy.

## Access

### From Reporting Dashboard
1. Click **"Reporting"** in the top navigation
2. Open the **Dropdown** module
3. Select **"Campaign Comparison"**
4. You'll be redirected to the comparison page

### Direct URL
Navigate to: `/campaigns/compare`

## Features

### 1. Campaign Selection
- **Select up to 3 campaigns** for comparison
- Visual checkmarks show selected campaigns
- Basic stats preview (emails sent, replies) on selector cards
- Disabled state when 3 campaigns are selected
- **Clear All** button to reset selection

### 2. Stats Summary (Top Section)
Each selected campaign displays a comprehensive stats card with:

**Metrics:**
- 📧 **Emails Sent** - Total emails delivered
- 💬 **Replies** - Total replies with reply rate %
- 👁️ **Opens** - Total opens with open rate %
- 🖱️ **Clicks** - Total link clicks
- 👍 **Positive** - Positive replies with positive rate %
- 👥 **Total Leads** - Total leads in campaign

**Visual Design:**
- Color-coded icons for each metric
- Percentage rates calculated dynamically
- Campaign status indicator (Active/Paused)
- Hover effects for better UX

### 3. Copy Comparison (Bottom Section)

**Filters:**
- **Step Selector** - Choose which email step to compare (1, 2, 3, etc.)
- **Variant Selector** - Choose which variant to compare (A, B, C, etc.)
- Both filters dynamically adapt to available data

**For Each Campaign:**
- **Subject Line** - Displayed in a preview box
- **Email Body** - Full HTML rendered email content
- **Step-Level Stats:**
  - Sent count
  - Replies count
  - Opens count
  - Clicks count

**Layout:**
- 2 campaigns: Side-by-side (2 columns)
- 3 campaigns: Three columns
- Scrollable email body (max 500px height)
- Responsive on mobile (stacks vertically)

## Use Cases

### 1. A/B Test Analysis
Compare two campaigns to see which performs better:
```
Campaign A vs Campaign B
- Which has better reply rate?
- Which subject line gets more opens?
- Which copy generates more positive responses?
```

### 2. Client Comparison
Compare campaigns for different clients:
```
Client 1 vs Client 2 vs Client 3
- Which client's campaign performs best?
- Are there patterns in successful copy?
- Which industries respond better?
```

### 3. Template Testing
Compare campaigns using different templates:
```
Template A vs Template B vs Template C
- Which template structure works best?
- Which tone of voice generates more replies?
- Which call-to-action is most effective?
```

### 4. Historical Comparison
Compare a current campaign with past winners:
```
Current Campaign vs Best Performer Q1 vs Best Performer Q2
- Is the current campaign on track?
- What made past campaigns successful?
- Can we replicate winning elements?
```

## How It Works

### Data Source
- Pulls from `campaigns` table for basic info and aggregated stats
- Pulls from `steps` table for email copy and step-level analytics
- Real-time data (no caching)

### Rate Calculations
All rates are calculated dynamically:
- **Reply Rate** = (replies / emails_sent) × 100
- **Open Rate** = (opens / emails_sent) × 100
- **Positive Rate** = (positive_replies / replies) × 100

### Step/Variant Matching
- If a campaign doesn't have the selected step/variant, shows "No data"
- Only shows steps/variants that exist across selected campaigns
- Automatically selects first available step and variant

## Tips for Effective Comparison

1. **Compare Similar Campaigns**
   - Same industry or target audience
   - Similar time periods
   - Same campaign type (cold outreach, follow-up, etc.)

2. **Focus on One Variable**
   - Compare campaigns that differ in only one element
   - Example: Same copy, different sending times
   - Example: Same structure, different subject lines

3. **Look for Patterns**
   - Which subject line formats work best?
   - What email length gets most replies?
   - Which CTAs drive more clicks?

4. **Use Step Comparison**
   - Compare follow-up sequences
   - See which steps lose engagement
   - Identify drop-off points

## Technical Details

### Files Created
1. **`/app/campaigns/compare/page.tsx`** - Main comparison page
2. **`/components/campaigns/CampaignSelector.tsx`** - Campaign selection UI
3. **`/components/campaigns/CampaignStatsCard.tsx`** - Stats card component
4. **`/components/campaigns/CampaignCopyComparison.tsx`** - Copy comparison grid

### Database Queries
- Fetches all campaigns on page load (for selector)
- Fetches selected campaigns with steps on selection
- No complex joins - optimized for performance

### Performance
- Lazy loading: Only fetches data when campaigns are selected
- No pagination needed (max 3 campaigns)
- Efficient React re-renders with proper state management

## Future Enhancements

Possible additions:
1. **Export Comparison** - Download as PDF or CSV
2. **Save Comparison** - Save favorite comparisons for later
3. **Time Range Filter** - Compare performance over specific dates
4. **Advanced Filters** - Filter by status, API key, date range
5. **Variant Performance** - Compare all variants within single campaign
6. **Copy Highlighting** - Highlight differences between copies
7. **Performance Charts** - Visual graphs for metric trends
8. **AI Insights** - Automated insights on what makes campaigns successful

## Troubleshooting

### No Campaigns Available
- Make sure campaigns are synced from Instantly.ai
- Check API key is active in Settings → API Keys
- Verify campaigns table has data in Supabase

### Missing Email Copy
- Ensure n8n workflow syncs campaign details (not just analytics)
- Check `steps` table has data
- Verify step sync is working correctly

### Stats Show Zero
- Campaign might be newly created
- Check if n8n analytics sync is running
- Verify API key has correct permissions

### Step/Variant Not Found
- Some campaigns may not have all steps
- Variants might differ between campaigns
- Use filters to find common steps/variants

## Support

For issues or questions:
- Check this guide first
- Review n8n sync logs
- Check Supabase logs for errors
- Verify campaign data exists in database
