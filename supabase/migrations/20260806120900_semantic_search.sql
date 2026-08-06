-- ClouDonna Platform — Database Foundation
-- Migration 10: semantic search functions
--
-- PostgREST (Supabase's REST layer) cannot express the pgvector `<=>`
-- distance operator through a plain `.select()/.filter()` call, so
-- similarity search needs a SQL function exposed over RPC instead. These
-- are the only two functions in this migration set that exist purely to
-- support a future AI/RAG layer — see docs, "AI-readiness". They compute a
-- similarity ordering; they do not call an LLM, and they return no data
-- that isn't already gated by the same RLS policies as the underlying
-- table (both use `security invoker`, the default, deliberately — a
-- semantic search must not become an RLS bypass).

create or replace function match_products(
  query_embedding vector(1536),
  match_count int default 10,
  min_similarity float default 0.0
)
returns table (
  id uuid,
  similarity float
)
language sql
stable
as $$
  select
    p.id,
    1 - (p.embedding <=> query_embedding) as similarity
  from products p
  where p.deleted_at is null
    and p.embedding is not null
    and 1 - (p.embedding <=> query_embedding) >= min_similarity
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

comment on function match_products(vector, int, float) is
  'Cosine-similarity nearest-neighbour search over products.embedding. Returns ids + similarity only, ranked closest first — callers join back to products for the full row, same as any other query, so RLS still applies to what they can actually see.';

create or replace function match_knowledge_articles(
  query_embedding vector(1536),
  match_count int default 10,
  min_similarity float default 0.0
)
returns table (
  id uuid,
  similarity float
)
language sql
stable
as $$
  select
    a.id,
    1 - (a.embedding <=> query_embedding) as similarity
  from knowledge_articles a
  where a.deleted_at is null
    and a.embedding is not null
    and 1 - (a.embedding <=> query_embedding) >= min_similarity
  order by a.embedding <=> query_embedding
  limit match_count;
$$;

comment on function match_knowledge_articles(vector, int, float) is
  'Same pattern as match_products, over knowledge_articles.embedding — the retrieval half of a future RAG pipeline answering "what do we already know that''s relevant to this question".';
