-- Run this if resources table already exists but save is stuck.
-- Ensures resource_tags exists and RLS policies match sops/prompts (profiles.id = auth.uid() AND is_admin).

-- 1. Resource tags table (no-op if already exists)
CREATE TABLE IF NOT EXISTS public.resource_tags (
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- 2. RLS on resources (enable if not already)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policy names so we can use same pattern as sops/prompts
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON public.resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Only admins can manage resources" ON public.resources;

-- 4. SELECT: everyone can view
CREATE POLICY "Resources are viewable by everyone"
  ON public.resources FOR SELECT
  USING (true);

-- 5. INSERT/UPDATE/DELETE: same as sops/prompts (profiles.id = auth.uid() AND is_admin)
CREATE POLICY "Only admins can manage resources"
  ON public.resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 6. resource_tags policies
DROP POLICY IF EXISTS "Resource tags are viewable by everyone" ON public.resource_tags;
DROP POLICY IF EXISTS "Admins can manage resource tags" ON public.resource_tags;
CREATE POLICY "Resource tags are viewable by everyone"
  ON public.resource_tags FOR SELECT
  USING (true);
CREATE POLICY "Only admins can manage resource tags"
  ON public.resource_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 7. Indexes (no-op if exist)
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_archived ON public.resources(is_archived);
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource_id ON public.resource_tags(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON public.resource_tags(tag_id);
