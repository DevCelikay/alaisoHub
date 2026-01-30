-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'file',  -- 'file' or 'url'
  file_name TEXT,  -- nullable for URL resources
  file_type TEXT,  -- nullable for URL resources
  file_data TEXT,  -- base64 encoded, nullable for URL resources
  file_size INTEGER,
  url TEXT,  -- for URL resources
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Migration for existing tables (run this if table already exists):
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS resource_type TEXT NOT NULL DEFAULT 'file';
-- ALTER TABLE resources ADD COLUMN IF NOT EXISTS url TEXT;
-- ALTER TABLE resources ALTER COLUMN file_name DROP NOT NULL;
-- ALTER TABLE resources ALTER COLUMN file_type DROP NOT NULL;
-- ALTER TABLE resources ALTER COLUMN file_data DROP NOT NULL;

-- Resource tags junction table
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
DROP POLICY IF EXISTS "Resources are viewable by everyone" ON resources;
CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert resources" ON resources;
CREATE POLICY "Admins can insert resources"
  ON resources FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update resources" ON resources;
CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete resources" ON resources;
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- RLS Policies for resource_tags
DROP POLICY IF EXISTS "Resource tags are viewable by everyone" ON resource_tags;
CREATE POLICY "Resource tags are viewable by everyone"
  ON resource_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage resource tags" ON resource_tags;
CREATE POLICY "Admins can manage resource tags"
  ON resource_tags FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE is_admin = true
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_archived ON resources(is_archived);
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource_id ON resource_tags(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON resource_tags(tag_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_resources_updated_at_trigger ON resources;
CREATE TRIGGER update_resources_updated_at_trigger
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_resources_updated_at();
