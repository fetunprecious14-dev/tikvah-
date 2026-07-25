import type { Emotion } from './emotions';

export type ResourceRecommendationType =
  | 'Practice'
  | 'Prompt'
  | 'Support'
  | 'Reading';

export type ResourceRecommendation = {
  id: string;
  type: ResourceRecommendationType;
  title: string;
  description: string;
  href: string;
};

const catalog: Record<string, ResourceRecommendation> = {
  breathing: {
    id: 'breathing',
    type: 'Practice',
    title: 'A longer exhale',
    description: 'A two-minute breathing practice for a busy nervous system.',
    href: '/resources',
  },
  grounding: {
    id: 'grounding',
    type: 'Practice',
    title: 'A five-minute return to the room',
    description: 'A sensory grounding exercise for thoughts that have moved too far ahead.',
    href: '/resources',
  },
  journaling: {
    id: 'journaling',
    type: 'Prompt',
    title: 'One honest sentence',
    description: 'A gentle place to keep writing without needing to solve anything.',
    href: '/journal',
  },
  boundaries: {
    id: 'boundaries',
    type: 'Practice',
    title: 'The kind boundary',
    description: 'Words for protecting your energy without explaining everything.',
    href: '/resources',
  },
  grief: {
    id: 'grief',
    type: 'Reading',
    title: 'Grief is not a straight line',
    description: 'A quiet note for days when a memory changes the shape of the room.',
    href: '/resources',
  },
  therapist: {
    id: 'therapist',
    type: 'Support',
    title: 'Find a licensed therapist',
    description: 'Browse support without signing up or sharing more than you want.',
    href: '/therapists',
  },
  crisis: {
    id: 'crisis',
    type: 'Support',
    title: 'Immediate support',
    description: 'Crisis lines and next steps for moments that feel urgent.',
    href: '/crisis',
  },
};

const mappings: Record<Emotion, string[]> = {
  sadness: ['grief', 'journaling', 'therapist'],
  loneliness: ['therapist', 'journaling', 'grounding'],
  grief: ['grief', 'journaling', 'therapist'],
  guilt: ['journaling', 'boundaries', 'therapist'],
  shame: ['journaling', 'therapist', 'grounding'],
  anger: ['grounding', 'boundaries', 'therapist'],
  burnout: ['breathing', 'boundaries', 'therapist'],
  anxiety: ['breathing', 'grounding', 'therapist'],
  numbness: ['grounding', 'journaling', 'therapist'],
  hope: ['journaling', 'boundaries', 'therapist'],
  fear: ['grounding', 'breathing', 'therapist'],
  'emotional exhaustion': ['breathing', 'journaling', 'therapist'],
};

export function recommendResources(primary: Emotion, secondary: Emotion | null): ResourceRecommendation[] {
  const ids = [...(mappings[primary] ?? [])];
  if (secondary && mappings[secondary]) ids.push(...mappings[secondary]);

  return ids
    .filter((id, index) => ids.indexOf(id) === index)
    .slice(0, 3)
    .map(id => catalog[id]);
}