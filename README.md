# SOP Hub

A sleek, modern SOP (Standard Operating Procedures) and Prompt Library application with a Linear/Monday.com inspired design.

## Features

- **Two Libraries**: SOP Library and Prompt Library with tab-based navigation
- **Tag-based Organization**: Group content by customizable tags with visual grouping
- **Search Functionality**: Search across titles, content, and tags
- **Role-Based Access**: Admin controls for CRUD operations, view-only for regular users
- **Clean Design**: Dark theme with Linear-inspired aesthetics
- **Rich Content**: SOPs with objectives, prerequisites, and structured steps
- **Easy Copy**: One-click copy for prompts

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Database Setup

Go to your Supabase project SQL editor:
https://supabase.com/dashboard/project/rexygfrrsxwdzgaaimby/sql/new

Copy and paste the entire contents of `supabase-schema.sql` and run it. This will:
- Create all necessary tables (profiles, sops, prompts, tags, etc.)
- Set up Row Level Security policies
- Create default tags
- Set up automatic triggers

### 2. Create Your First Admin User

After running the schema, you need to create your first admin account:

1. Go to the login page (will be at http://localhost:3000/login once you start the dev server)
2. Sign up with your email
3. Check your email and confirm your account
4. In Supabase, go to Table Editor > profiles
5. Find your profile row and set `is_admin` to `true`

### 3. Install Dependencies and Run

```bash
cd sop-hub
npm install
npm run dev
```

Open http://localhost:3000

### 4. Start Creating Content

As an admin, you can now:
- Create new SOPs with objectives, prerequisites, and steps
- Create prompts with descriptions and content
- Organize content with tags
- Edit and delete existing content

Regular users (non-admins) can view and search all content but cannot create, edit, or delete.

## Project Structure

```
sop-hub/
├── app/
│   ├── page.tsx              # Main app page
│   ├── login/page.tsx        # Authentication page
│   ├── auth/callback/        # Auth callback handler
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── Navigation.tsx        # Top nav with tabs
│   ├── SOPLibrary.tsx        # SOP list view
│   ├── SOPRow.tsx            # Individual SOP row
│   ├── SOPViewer.tsx         # SOP detail modal
│   ├── SOPEditor.tsx         # SOP create/edit modal
│   ├── PromptLibrary.tsx     # Prompt list view
│   ├── PromptRow.tsx         # Individual prompt row
│   ├── PromptViewer.tsx      # Prompt detail modal
│   └── PromptEditor.tsx      # Prompt create/edit modal
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── server.ts         # Server Supabase client
│   │   └── middleware.ts     # Session refresh middleware
│   ├── hooks/
│   │   └── useUser.ts        # User auth hook
│   └── types/
│       └── database.ts       # TypeScript types
├── middleware.ts             # Next.js middleware
├── .env.local                # Environment variables
└── supabase-schema.sql       # Database schema
```

## Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secure)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables from `.env.local`
4. Deploy!

Make sure to update your Supabase project's redirect URLs in Authentication > URL Configuration to include your production domain.

## Managing Tags

Default tags are created automatically:
- Onboarding (purple)
- Technical (blue)
- HR (pink)
- Operations (green)
- Sales (orange)
- Marketing (indigo)

To add more tags, insert them directly into the `tags` table in Supabase, or add a tag management UI (future enhancement).

## Security

- Row Level Security (RLS) is enabled on all tables
- Only authenticated users can view content
- Only admins can create, edit, or delete content
- User sessions are automatically refreshed
- All admin actions are tied to user profiles

## Future Enhancements

- Tag management UI
- Full-text search with better ranking
- Export SOPs to PDF
- Version history for SOPs
- Comments and collaboration
- Analytics and usage tracking
- Markdown support in content
- Image uploads for steps

## Support

For issues or questions, check the code comments or review the Supabase logs for any errors.
