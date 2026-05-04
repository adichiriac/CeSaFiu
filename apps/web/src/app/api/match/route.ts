/**
 * POST /api/match
 *
 * Server-side career scoring endpoint.
 * Keeps scoring weights + full career↔program mappings off the client bundle.
 *
 * Request body (all optional — send whatever tests the user has completed):
 * {
 *   scenariiAnswers?: Record<string, { id: string; riasec?: string[]; path?: string; traits?: string[]; signals?: string[] }>
 *   personalityScores?: Record<string, number>   // Big5 percentages 0-100
 *   ipipNeo60Scores?:   Record<string, number>   // Big5 percentages 0-100
 *   vocationalRaw?:     Record<string, number>   // Holland code sums (short 20-item)
 *   vocationalSignalsRaw?: Record<string, number>
 *   vocationalDeepRaw?: Record<string, number>   // Holland code means (deep 60-item)
 *   vocationalDeepSignalsRaw?: Record<string, number>
 * }
 *
 * Response:
 * {
 *   matches:     CareerMatch[]    // all careers scored (top 6 via MMR, rest appended)
 *   confidence:  number           // 0-1
 *   sources:     string[]
 *   userProfile: UserProfile
 *   nextTest:    NextTestSuggestion | null
 * }
 */

import {getAllCareers} from '@/lib/careers/load';
import {computeMatches} from '@/lib/matcher';
import type {Big5Scores, MatchInput, QuizAnswerOption, VocationalScores} from '@/lib/matcher';
import {NextResponse} from 'next/server';

type RequestBody = {
  scenariiAnswers?: Record<string, QuizAnswerOption>;
  personalityScores?: Big5Scores;
  ipipNeo60Scores?: Big5Scores;
  vocationalRaw?: Record<string, number>;
  vocationalSignalsRaw?: Record<string, number>;
  vocationalDeepRaw?: Record<string, number>;
  vocationalDeepSignalsRaw?: Record<string, number>;
};

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400});
  }

  const careers = getAllCareers();

  const vocational: VocationalScores | undefined = body.vocationalRaw
    ? {raw: body.vocationalRaw, signalsRaw: body.vocationalSignalsRaw}
    : undefined;

  const vocationalDeep: VocationalScores | undefined = body.vocationalDeepRaw
    ? {raw: body.vocationalDeepRaw, signalsRaw: body.vocationalDeepSignalsRaw}
    : undefined;

  const input: MatchInput = {
    answers: body.scenariiAnswers ?? {},
    careers,
    deepScores: {
      personality: body.personalityScores,
      ipipNeo60: body.ipipNeo60Scores,
      vocational,
      vocationalDeep,
    },
  };

  const result = computeMatches(input);

  return NextResponse.json({
    matches: result,
    confidence: result.confidence,
    sources: result.sources,
    userProfile: result.userProfile,
    nextTest: result.nextTest,
  });
}
