export type AiSuggestionStatus = "pending" | "accepted" | "rejected" | "edited";

export interface AiSuggestion {
  id: string;
  type: "rewrite" | "keyword" | "structure" | "delete" | "emphasize";
  targetPath: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  status: AiSuggestionStatus;
}

export interface AiMatchAnalysis {
  matchScore: number;
  keywordCoverage: {
    matched: string[];
    missing: string[];
  };
  strengths: string[];
  gaps: string[];
  suggestions: AiSuggestion[];
  summary: string;
  model: string;
}
