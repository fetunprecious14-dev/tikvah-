// Ported from the original client-side prototype (artifacts/tikvah/src/lib/safety.ts).
// This is the server-authoritative copy: every conversation/message write runs
// through this check so flagging and admin alerts can't be bypassed by disabling
// the client-side UX. It's a deliberately imperfect heuristic, not a diagnosis.

export type RiskCategory =
  | "suicidal intent"
  | "self-harm"
  | "homicide"
  | "domestic abuse"
  | "panic attack"
  | "psychosis"
  | "child abuse"
  | "sexual assault";

export type SafetyAssessment = {
  risk: "high" | "none";
  categories: RiskCategory[];
};

const signals: Array<{ category: RiskCategory; patterns: RegExp[] }> = [
  {
    category: "suicidal intent",
    patterns: [
      /\b(?:suicide|suicidal)\b/i,
      /\b(?:kill|end)\s+(?:myself|my life)\b/i,
      /\b(?:want|plan|planning|going|about)\s+to\s+(?:die|end my life|kill myself)\b/i,
      /\b(?:no|not worth) (?:reason|point) to live\b/i,
      /\bbetter off dead\b/i,
    ],
  },
  {
    category: "self-harm",
    patterns: [
      /\bself[-\s]?harm(?:ing)?\b/i,
      /\b(?:cut|cutting|burn|burning|hit|hurt|harm)\s+(?:myself|me)\b/i,
      /\b(?:want|need|thinking about)\s+to\s+(?:cut|hurt|harm)\s+myself\b/i,
    ],
  },
  {
    category: "homicide",
    patterns: [
      /\b(?:kill|murder|shoot|stab|hurt)\s+(?:him|her|them|someone|people)\b/i,
      /\b(?:want|plan|planning|going|about)\s+to\s+(?:kill|hurt)\b/i,
      /\b(?:homicide|assassinate)\b/i,
    ],
  },
  {
    category: "domestic abuse",
    patterns: [
      /\bdomestic violence\b/i,
      /\b(?:partner|spouse|husband|wife|boyfriend|girlfriend)\s+(?:hit|hits|hitting|beat|beats|threaten|threatens)\b/i,
      /\b(?:being|been)\s+(?:abused|hit|beaten|threatened)\b/i,
    ],
  },
  {
    category: "panic attack",
    patterns: [/\bpanic attack\b/i, /\b(?:having|had)\s+a\s+panic\b/i, /\b(?:can't|cannot)\s+breathe\b.*\bpanic\b/i],
  },
  {
    category: "psychosis",
    patterns: [
      /\b(?:hearing|hear|seeing|see)\s+voices\b/i,
      /\bvoices\s+(?:tell|telling|command)\b/i,
      /\b(?:hallucination|hallucinating|delusion|delusional|paranoia|paranoid)\b/i,
    ],
  },
  {
    category: "child abuse",
    patterns: [
      /\b(?:child|kid|minor)\b.{0,50}\b(?:abuse|abused|hurt|hit|beaten|molest|molested)\b/i,
      /\b(?:abuse|abused|hurt|hit|beaten|molest|molested)\b.{0,50}\b(?:child|kid|minor)\b/i,
    ],
  },
  {
    category: "sexual assault",
    patterns: [/\b(?:sexual assault|sexually assaulted|rape|raped|forced sex|non[-\s]?consensual)\b/i],
  },
];

export function assessSafety(text: string): SafetyAssessment {
  const categories = signals.filter(signal => signal.patterns.some(pattern => pattern.test(text))).map(signal => signal.category);

  return {
    risk: categories.length > 0 ? "high" : "none",
    categories,
  };
}
