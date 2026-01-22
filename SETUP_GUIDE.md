# Quick Setup Guide

Follow these steps to get your SOP Hub up and running:

## Step 1: Set Up the Database

1. Open your Supabase SQL Editor:
   https://supabase.com/dashboard/project/rexygfrrsxwdzgaaimby/sql/new

2. Open the `supabase-schema.sql` file in this project

3. Copy ALL the contents and paste into the Supabase SQL editor

4. Click "Run" to execute the SQL

5. You should see success messages. This creates:
   - All database tables
   - Security policies
   - Default tags (Onboarding, Technical, HR, Operations, Sales, Marketing)
   - Automatic triggers

## Step 2: Start the Development Server

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at http://localhost:3000

## Step 3: Create Your Admin Account

1. Go to http://localhost:3000/login

2. Click "Don't have an account? Sign up"

3. Enter your email and create a password

4. Check your email for the confirmation link and click it

5. Go back to Supabase > Table Editor > profiles

6. Find your newly created profile

7. Check the `is_admin` checkbox (set it to `true`)

8. Save the change

## Step 4: Log In and Start Using

1. Go back to http://localhost:3000/login

2. Sign in with your credentials

3. You should now see the SOP Hub with two tabs:
   - SOP Library
   - Prompt Library

4. As an admin, you'll see "New SOP" and "New Prompt" buttons

## Creating Your First SOP

1. Click "New SOP" in the SOP Library

2. Fill in:
   - **Title**: Name of your SOP (required)
   - **Tags**: Select from existing tags to organize
   - **Objectives and Outcomes**: What this SOP achieves
   - **Logins and Prerequisites**: What's needed to complete this SOP
   - **Steps**: Click "Add Step" to create detailed steps

3. Click "Save"

4. Your SOP will appear grouped under its tags

## Creating Your First Prompt

1. Switch to the "Prompt Library" tab

2. Click "New Prompt"

3. Fill in:
   - **Title**: Name of your prompt (required)
   - **Tags**: Select from existing tags
   - **Description**: Brief explanation (optional)
   - **Prompt Content**: The actual prompt text (required)

4. Click "Save"

5. Click on any prompt to view it and use the "Copy" button

## Tips

- **Search**: Use the search bar to find SOPs/Prompts by title, content, or tags
- **Organize**: Tag your content for better organization
- **Edit**: As an admin, hover over any row and click "Edit"
- **View**: Click any row to view the full content
- **Internal Links**: SOPs automatically generate a table of contents with jump links

## Adding More Users

1. Share the app URL with your team

2. They can sign up at /login

3. By default, they'll be regular users (view-only)

4. To make someone an admin:
   - Go to Supabase > Table Editor > profiles
   - Find their profile
   - Set `is_admin` to `true`

## Troubleshooting

### "No data" or "Permission denied"
- Make sure you ran the `supabase-schema.sql` file completely
- Check that you're logged in
- Verify your profile exists in the profiles table

### "Not authenticated"
- Clear your browser cookies and log in again
- Check that Supabase Auth is working in your Supabase dashboard

### Can't create/edit content
- Make sure your profile has `is_admin` set to `true` in Supabase

### Email confirmation not working
- Check your Supabase email settings
- For development, you can disable email confirmation in Supabase Auth settings

## What's Next?

Now you have a fully functional SOP Hub! You can:

- Create comprehensive SOPs with structured steps
- Build a library of reusable prompts
- Organize everything with tags
- Share with your team

Enjoy your new SOP Hub!
