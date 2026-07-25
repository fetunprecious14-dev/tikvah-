export const emotionNames = [
  'sadness',
  'loneliness',
  'grief',
  'guilt',
  'shame',
  'anger',
  'burnout',
  'anxiety',
  'numbness',
  'hope',
  'fear',
  'emotional exhaustion',
] as const;

export type Emotion = typeof emotionNames[number];

export type EmotionAnalysis = {
  primary: Emotion;
  secondary: Emotion | null;
  intensity: number;
  confidence: number;
};

type EmotionSignal = {
  emotion: Emotion;
  patterns: Array<{ pattern: RegExp; weight: number }>;
};

const signals: EmotionSignal[] = [
  {
    emotion: 'sadness',
    patterns: [
      { pattern: /\b(?:sad|sadness|down|unhappy|heartbroken|crying|cried|tears|low)\b/gi, weight: 2 },
      { pattern: /\b(?:miss|missing|lost|empty)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'loneliness',
    patterns: [
      { pattern: /\b(?:lonely|alone|isolated|invisible|no one|nobody|on my own)\b/gi, weight: 2 },
      { pattern: /\b(?:left out|unseen|disconnected)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'grief',
    patterns: [
      { pattern: /\b(?:grief|grieving|mourning|funeral|bereaved|bereavement)\b/gi, weight: 3 },
      { pattern: /\b(?:death|died|passed away|loss|lost them)\b/gi, weight: 2 },
    ],
  },
  {
    emotion: 'guilt',
    patterns: [
      { pattern: /\b(?:guilt|guilty|regret|regretful|fault|blame myself)\b/gi, weight: 2 },
      { pattern: /\b(?:should have|could have|my mistake|I did wrong)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'shame',
    patterns: [
      { pattern: /\b(?:shame|ashamed|embarrassed|humiliated|disgrace|unworthy)\b/gi, weight: 3 },
      { pattern: /\b(?:hate myself|something wrong with me|not enough)\b/gi, weight: 2 },
    ],
  },
  {
    emotion: 'anger',
    patterns: [
      { pattern: /\b(?:angry|anger|furious|rage|raging|mad|irritated|irritation)\b/gi, weight: 2 },
      { pattern: /\b(?:unfair|fed up|sick of|frustrated|frustration)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'burnout',
    patterns: [
      { pattern: /\b(?:burnout|burned out|overworked|overloaded|work is too much)\b/gi, weight: 3 },
      { pattern: /\b(?:deadlines|workload|can't keep up|running on empty)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'anxiety',
    patterns: [
      { pattern: /\b(?:anxious|anxiety|worried|worry|overthinking|nervous|uneasy)\b/gi, weight: 2 },
      { pattern: /\b(?:what if|uncertain|uncertainty|restless|racing thoughts)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'numbness',
    patterns: [
      { pattern: /\b(?:numb|numbness|nothing|blank|empty inside|disconnected)\b/gi, weight: 2 },
      { pattern: /\b(?:don't feel|cannot feel|can't feel|going through the motions)\b/gi, weight: 2 },
    ],
  },
  {
    emotion: 'hope',
    patterns: [
      { pattern: /\b(?:hope|hopeful|healing|heal|better|grateful|gratitude)\b/gi, weight: 2 },
      { pattern: /\b(?:looking forward|possibility|maybe things|small win|proud)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'fear',
    patterns: [
      { pattern: /\b(?:afraid|fear|fearful|scared|terrified|terror|unsafe)\b/gi, weight: 2 },
      { pattern: /\b(?:danger|threat|panic|dread|worry about what will happen)\b/gi, weight: 1 },
    ],
  },
  {
    emotion: 'emotional exhaustion',
    patterns: [
      { pattern: /\b(?:emotionally exhausted|emotionally drained|drained|exhausted|exhaustion)\b/gi, weight: 3 },
      { pattern: /\b(?:tired of feeling|can't do this anymore|no energy|worn out)\b/gi, weight: 2 },
    ],
  },
];

function countMatches(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].length;
}

export function analyzeEmotion(text: string): EmotionAnalysis {
  const normalized = text.trim();
  const scores = signals.map(signal => ({
    emotion: signal.emotion,
    score: signal.patterns.reduce(
      (total, signalPattern) => total + countMatches(normalized, signalPattern.pattern) * signalPattern.weight,
      0,
    ),
  }));
  const ranked = scores.sort((a, b) => b.score - a.score);
  const primaryScore = ranked[0]?.score ?? 0;
  const secondaryScore = ranked[1]?.score ?? 0;
  const wordCount = normalized ? normalized.split(/\s+/).length : 0;
  const intensity = Math.max(1, Math.min(10, Math.round(
    1 + Math.min(6, primaryScore) + Math.min(3, Math.floor(wordCount / 80)),
  )));
  const confidence = primaryScore === 0
    ? 20
    : Math.max(45, Math.min(96, Math.round(48 + primaryScore * 8 + (primaryScore > secondaryScore ? 8 : 0))));

  return {
    primary: ranked[0]?.emotion ?? 'sadness',
    secondary: secondaryScore > 0 ? ranked[1].emotion : null,
    intensity,
    confidence,
  };
}