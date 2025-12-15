-- Add user_id to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON documents;
DROP POLICY IF EXISTS "Allow public insert access" ON documents;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Update match_documents function to filter by user_id
DROP FUNCTION IF EXISTS match_documents;

create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where user_id = filter_user_id
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
