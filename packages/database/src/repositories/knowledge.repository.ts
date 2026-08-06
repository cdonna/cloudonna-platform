import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeArticle } from "../types";
import { assertMaybe, assertNoError } from "./errors";

export interface KnowledgeMatch {
  id: string;
  similarity: number;
}

export class KnowledgeRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listPublished(): Promise<KnowledgeArticle[]> {
    const result = await this.db
      .from("knowledge_articles")
      .select("*")
      .is("organization_id", null)
      .not("published_at", "is", null)
      .is("deleted_at", null)
      .order("published_at", { ascending: false });

    return assertNoError<KnowledgeArticle[]>("KnowledgeRepository.listPublished", result);
  }

  async getBySlug(slug: string): Promise<KnowledgeArticle | null> {
    const result = await this.db
      .from("knowledge_articles")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    return assertMaybe<KnowledgeArticle>("KnowledgeRepository.getBySlug", result);
  }

  /** Retrieval half of a future RAG pipeline — see match_knowledge_articles()
   * in supabase/migrations/20260806120900_semantic_search.sql. */
  async findSimilar(
    queryEmbedding: number[],
    options: { matchCount?: number; minSimilarity?: number } = {},
  ): Promise<KnowledgeMatch[]> {
    const result = await this.db.rpc("match_knowledge_articles", {
      query_embedding: queryEmbedding,
      match_count: options.matchCount ?? 10,
      min_similarity: options.minSimilarity ?? 0,
    });

    return assertNoError<KnowledgeMatch[]>("KnowledgeRepository.findSimilar", result);
  }
}
