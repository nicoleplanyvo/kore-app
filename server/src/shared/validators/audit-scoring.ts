/**
 * Store Excellence Audit — Scoring-Logik
 * Shared zwischen API (Berechnung bei Abschluss) und Frontend (Live-Preview)
 */

export interface ScoredCategory {
  categoryId: string;
  categoryName: string;
  weight: number;
  criteriaCount: number;
  scoredCount: number;
  averagePercent: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface AuditScoreResult {
  overallScore: number;
  overallPassRate: number;
  categories: ScoredCategory[];
}

interface CategoryInput {
  id: string;
  name: string;
  weight: number;
  criteria: Array<{
    id: string;
    isRequired: boolean;
  }>;
}

interface ResponseInput {
  criterionId: string;
  scorePercent: number | null;
  passed: boolean | null;
}

/**
 * Berechnet den gewichteten Gesamtscore eines Audits.
 * Jede Kategorie hat ein Gewicht (weight), der Gesamtscore ist der gewichtete Durchschnitt.
 */
export function calculateAuditScore(
  categories: CategoryInput[],
  responses: ResponseInput[],
): AuditScoreResult {
  const responseMap = new Map(responses.map((r) => [r.criterionId, r]));

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let totalPassed = 0;
  let totalEvaluated = 0;

  const scoredCategories: ScoredCategory[] = categories.map((cat) => {
    let catScoreSum = 0;
    let catScored = 0;
    let catPassed = 0;
    let catFailed = 0;

    for (const crit of cat.criteria) {
      const resp = responseMap.get(crit.id);
      if (resp) {
        if (resp.scorePercent !== null && resp.scorePercent !== undefined) {
          catScoreSum += resp.scorePercent;
          catScored++;
        }
        if (resp.passed === true) {
          catPassed++;
          totalPassed++;
          totalEvaluated++;
        } else if (resp.passed === false) {
          catFailed++;
          totalEvaluated++;
        }
      }
    }

    const avgPercent = catScored > 0 ? catScoreSum / catScored : 0;
    const passRate =
      catPassed + catFailed > 0 ? (catPassed / (catPassed + catFailed)) * 100 : 0;

    totalWeight += cat.weight;
    weightedScoreSum += avgPercent * cat.weight;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      weight: cat.weight,
      criteriaCount: cat.criteria.length,
      scoredCount: catScored,
      averagePercent: Math.round(avgPercent * 10) / 10,
      passCount: catPassed,
      failCount: catFailed,
      passRate: Math.round(passRate * 10) / 10,
    };
  });

  const overallScore =
    totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 10) / 10 : 0;
  const overallPassRate =
    totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 1000) / 10 : 0;

  return { overallScore, overallPassRate, categories: scoredCategories };
}
