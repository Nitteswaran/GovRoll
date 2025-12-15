-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists documents (
  id bigserial primary key,
  content text, -- corresponds to Document.pageContent
  metadata jsonb, -- corresponds to Document.metadata
  embedding vector(768) -- Gemini embeddings are 768 dimensions
);

-- Turn on Row Level Security
alter table documents enable row level security;

-- Create a policy to allow anyone to read/write (for demo purposes - restrict in prod)
-- Ideally you probably want to link this to auth.users if multi-tenant
create policy "Allow public read access"
  on documents for select
  to public
  using (true);

create policy "Allow public insert access"
  on documents for insert
  to public
  with check (true);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
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
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
