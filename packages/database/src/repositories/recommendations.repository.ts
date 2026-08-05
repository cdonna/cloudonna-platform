import type { SupabaseClient } from "@supabase/supabase-js";
import type { DecisionScore, Recommendation } from "../types";
import { assertNoError } from "./errors";

/**
 * Persists what the scoring engine (apps/web/.../donna-ai/scoring/engine.ts,
 * not part of this package) has already computed. This repository never
 * computes a score itself — it only stores and retrieves the numbers a
 * caller hands it, which is the entire point of keeping scoring logic out
 * of the database and out of the repository layer alike.
 */
export class RecommendationsRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(
    input: Pick<
      Recommendation,
      "organization_id" | "decision_session_id" | "product_id" | "rank" | "overall_score"
    > &
      Partial<Pick<Recommendation, "summary" | "is_primary">> & { created_by?: string },
  ): Promise<Recommendation> {
    const result = await this.db.from("recommendations").insert(input).select("*").single();

    return assertNoError<Recommendation>("RecommendationsRepository.create", result);
  }

  async listForSession(sessionId: string): Promise<Recommendation[]> {
    const result = await this.db
      .from("recommendations")
      .select("*")
      .eq("decision_session_id", sessionId)
      .is("deleted_at", null)
      .order("rank");

    return assertNoError<Recommendation[]>("RecommendationsRepository.listForSession", result);
  }

  async addDecisionScores(
    recommendationId: string,
    organizationId: string,
    scores: Array<
      Pick<DecisionScore, "dimension_key" | "score" | "weight"> &
        Partial<Pick<DecisionScore, "positive_evidence" | "negative_evidence">>
    >,
  ): Promise<DecisionScore[]> {
    const rows = scores.map((s) => ({
      recommendation_id: recommendationId,
      organization_id: organizationId,
      dimension_key: s.dimension_key,
      score: s.score,
      weight: s.weight,
      positive_evidence: s.positive_evidence ?? [],
      negative_evidence: s.negative_evidence ?? [],
    }));

    const result = await this.db.from("decision_scores").insert(rows).select("*");

    return assertNoError<DecisionScore[]>("RecommendationsRepository.addDecisionScores", result);
  }

  async listDecisionScores(recommendationId: string): Promise<DecisionScore[]> {
    const result = await this.db
      .from("decision_scores")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .is("deleted_at", null);

    return assertNoError<DecisionScore[]>("RecommendationsRepository.listDecisionScores", result);
  }
}
