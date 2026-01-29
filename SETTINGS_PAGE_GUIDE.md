# Settings Page Guide

## Overview

The new unified Settings page (`/app/settings/page.tsx`) combines user management, tags, and API keys in one place for easy administration.

## What Was Created

### Files Created:

1. **`/app/settings/page.tsx`** - Main settings page with tabs
2. **`/components/settings/UsersTab.tsx`** - User management component
3. **`/components/settings/TagsTab.tsx`** - Tags management component
4. **`/components/settings/ApiKeysTab.tsx`** - API keys management component (NEW)
5. **`/migration-add-key-name.sql`** - Migration to add key_name column

### Files Modified:

1. **`/app/api/instantly/credentials/route.ts`** - Updated to support key_name
2. **`/lib/types/campaigns.ts`** - Added key_name to InstantlyCredentials interface

## Access the Settings Page

Navigate to: **`/settings`**

Or add a link in your navigation:
```tsx
<Link href="/settings">Settings</Link>
```

## Features

### 1. Users Tab

- **View all users** with their roles (Admin/Viewer)
- **Change user roles** (except your own)
- **Invite new users** via email with custom roles
- **View pending invitations** with expiry dates
- **Delete invitations** before they're accepted
- **Copy invitation links** to share

### 2. Tags Tab

- **Create new tags** with custom names and colors
- **Color picker** with 10 preset colors
- **Live preview** of tags before creating
- **Edit existing tags** (name and color)
- **Delete tags** with usage confirmation
- **View tag usage** (how many SOPs and prompts use each tag)

### 3. API Keys Tab (NEW)

- **Add Instantly.ai API keys** with optional names
- **Multiple keys support** - store multiple keys, activate one at a time
- **Key validation** - keys are tested when added
- **Masked display** - keys shown as `abc••••••xyz` for security
- **Toggle active status** - switch between keys easily
- **Delete keys** with confirmation
- **Visual indicators** - active keys highlighted in green

## Setup Instructions

### 1. Run Database Migrations

First, add the `key_name` column to `instantly_credentials`:

```sql
-- Open migration-add-key-name.sql
-- Copy and paste into Supabase SQL Editor
-- Run the migration
```

### 2. Update Navigation (Optional)

Add settings link to your main navigation:

```tsx
import { Settings } from 'lucide-react'

// In your nav component
<Link href="/settings" className="nav-link">
  <Settings className="w-5 h-5" />
  <span>Settings</span>
</Link>
```

### 3. Test the Settings Page

1. **Navigate to `/settings`** (requires admin role)
2. **Test Users Tab:**
   - Invite a test user
   - Copy the invitation link
   - Change a user's role
3. **Test Tags Tab:**
   - Create a new tag
   - Edit the tag color
   - Delete a test tag
4. **Test API Keys Tab:**
   - Add your Instantly.ai API key
   - Optionally give it a name (e.g., "Production")
   - Verify it shows as active
   - Try adding a second key and switching between them

## API Key Management

### How to Get Your Instantly.ai API Key

1. Go to [Instantly.ai](https://app.instantly.ai)
2. Navigate to **Settings → Integrations → API**
3. Copy your API key
4. Paste it into the Settings page

### How API Keys Work

- **Only one key can be active at a time**
- The active key is used for all campaign syncing
- You can store multiple keys (e.g., for different accounts)
- Switch between keys by clicking the activate/deactivate button
- Keys are validated when added to ensure they work
- Keys are masked in the UI for security (`abc••••••xyz`)

### Adding a Key

1. Click **"Add API Key"** button
2. (Optional) Enter a name like "Production" or "Testing"
3. Paste your Instantly.ai API key
4. Click **"Add API Key"**
5. Wait for validation (checks if key works)
6. Key will be added and automatically set as active

### Managing Keys

- **Activate/Deactivate**: Click the checkmark icon
- **Delete**: Click the trash icon (confirms before deleting)
- **View**: API keys are partially masked for security

## Existing Pages

The old standalone pages still work but can be deprecated:

- `/users` - Can be removed (functionality moved to `/settings?tab=users`)
- `/tags` - Can be removed (functionality moved to `/settings?tab=tags`)

## Permissions

- **Admin only** - Only users with `role: 'admin'` or `is_admin: true` can access
- Non-admin users are redirected to home page
- Uses same RLS policies as before

## Styling

The settings page uses your existing design system:

- **Colors**: `#673ae4` (primary purple), `#fafafa` (background), `#e3e3e3` (borders)
- **Rounded corners**: `rounded-xl` (12px), `rounded-2xl` (16px)
- **Shadows**: `shadow-lg` for cards
- **Icons**: Lucide React icons throughout
- **Responsive**: Works on mobile and desktop

## Troubleshooting

### "Unauthorized" Error

- Make sure you're logged in as an admin
- Check your profile: `SELECT role, is_admin FROM profiles WHERE id = auth.uid()`
- Ensure role is `'admin'` or `is_admin` is `true`

### API Key Validation Fails

- Verify the key is correct (copy directly from Instantly.ai)
- Check Instantly.ai API status
- Ensure the key has proper permissions
- Try the key directly via curl: `curl -H "Authorization: Bearer YOUR_KEY" https://api.instantly.ai/api/v2/campaigns`

### Tabs Not Switching

- Check browser console for errors
- Verify all tab components are imported correctly
- Ensure Tabs UI component is properly configured

### Migration Errors

- Run migrations in order: `migration-add-key-name.sql` first
- Check if column already exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'instantly_credentials'`
- If error persists, manually add column: `ALTER TABLE instantly_credentials ADD COLUMN key_name TEXT;`

## Future Enhancements

Possible additions:

1. **Bulk user operations** - Invite multiple users at once
2. **Tag categories** - Group tags by category
3. **API key usage statistics** - Show when each key was last used
4. **Key rotation** - Automatic expiry and rotation reminders
5. **Audit logs** - Track who made what changes
6. **Export/Import tags** - Backup and restore tag configurations
7. **Role customization** - Create custom roles beyond Admin/Viewer

## Support

For issues or questions:

- Check this guide first
- Review the component files for implementation details
- Check Supabase logs for database errors
- Verify RLS policies are correctly configured
