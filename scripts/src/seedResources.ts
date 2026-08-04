// Seeds the resource library with curated, real content across every topic in
// the brief. Safe to re-run — it replaces the existing library each time.
// Usage: pnpm --filter @workspace/scripts run seed-resources

import { db, resourcesTable, type Resource } from "@workspace/db";

type SeedResource = Pick<Resource, "title" | "description" | "type" | "topic" | "url" | "body">;

const resources: SeedResource[] = [
  // Anxiety
  {
    title: "Box breathing",
    description: "A four-count breathing pattern that gives a racing mind somewhere steady to land.",
    type: "exercise",
    topic: "anxiety",
    url: null,
    body: "Breathe in for a slow count of four. Hold for four. Breathe out for four. Hold for four. Repeat for six to eight rounds. If counting feels like one more thing to manage, just slow the exhale until it's longer than the inhale — that alone signals safety to your nervous system.",
  },
  {
    title: "Understanding anxiety disorders",
    description: "A clear, clinical overview of what anxiety is and when it may be time to seek support.",
    type: "article",
    topic: "anxiety",
    url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
    body: null,
  },
  {
    title: "When your thoughts race",
    description: "A short reminder for the moments a worry starts pulling every other worry in behind it.",
    type: "tip",
    topic: "anxiety",
    url: null,
    body: "You don't have to follow every thought to its end. Try naming what's happening — 'my mind is spiraling' — instead of arguing with each thought individually. Naming it can loosen its grip more than reasoning with it does.",
  },

  // Grief
  {
    title: "Coping with grief and loss",
    description: "A gentle, thorough guide to the different shapes grief can take, and how to move through it.",
    type: "article",
    topic: "grief",
    url: "https://www.helpguide.org/mental-health/grief/coping-with-grief-and-loss",
    body: null,
  },
  {
    title: "A letter you don't have to send",
    description: "A journaling prompt for the things left unsaid.",
    type: "prompt",
    topic: "grief",
    url: null,
    body: "Write a letter to the person, place, or version of your life you're grieving. Say the thing you didn't get to say, ask the question you didn't get to ask. You never have to send it or show it to anyone — it's just somewhere for it to go.",
  },
  {
    title: "It's OK That You're Not OK",
    description: "Megan Devine's book on grief that doesn't rush you toward closure or silver linings.",
    type: "book",
    topic: "grief",
    url: null,
    body: null,
  },

  // Purpose
  {
    title: "Finding your purpose",
    description: "Research-backed reflections on what actually makes a life feel meaningful.",
    type: "article",
    topic: "purpose",
    url: "https://greatergood.berkeley.edu/topic/purpose",
    body: null,
  },
  {
    title: "What already feels like you",
    description: "A prompt for when 'purpose' feels too big a word to hold.",
    type: "prompt",
    topic: "purpose",
    url: null,
    body: "Think of a recent hour that felt like time well spent — not productive, just right. What were you doing? Who were you with, or were you alone? Purpose is often smaller and closer than the word suggests. Start there instead of at the horizon.",
  },

  // Relationships
  {
    title: "Research on healthy relationships",
    description: "The Gottman Institute's evidence-based writing on connection, conflict, and repair.",
    type: "article",
    topic: "relationships",
    url: "https://www.gottman.com/blog/",
    body: null,
  },
  {
    title: "The kind boundary",
    description: "Words for protecting your energy without needing to explain everything.",
    type: "tip",
    topic: "relationships",
    url: null,
    body: "A boundary doesn't need a justification to be valid. Try: 'I can't take that on right now' or 'I need some time before I can talk about this.' A full sentence is a complete answer — you don't owe anyone the essay behind it.",
  },
  {
    title: "How to ask for what you need",
    description: "A small script for opening a difficult conversation with someone you trust.",
    type: "exercise",
    topic: "relationships",
    url: null,
    body: "Try this shape: 'When ___ happens, I feel ___. What I need is ___.' Practice saying it out loud once, alone, before you say it to the person. It won't come out perfectly and it doesn't need to — clarity matters more than polish.",
  },

  // Depression
  {
    title: "Understanding depression",
    description: "A clear overview of depression's symptoms, causes, and treatment options.",
    type: "article",
    topic: "depression",
    url: "https://www.nimh.nih.gov/health/topics/depression",
    body: null,
  },
  {
    title: "One small thing",
    description: "A note for days when the to-do list feels impossible.",
    type: "tip",
    topic: "depression",
    url: null,
    body: "On the hardest days, lower the bar until you can clear it. Drink a glass of water. Open a window. Text one person 'thinking of you.' One small, completed thing is not nothing — it's evidence you can build on tomorrow.",
  },
  {
    title: "The Hilarious World of Depression",
    description: "Comedians speaking honestly about living with depression — funny, and unexpectedly tender.",
    type: "podcast",
    topic: "depression",
    url: "https://www.hilariousworld.org/",
    body: null,
  },

  // Stress
  {
    title: "A longer exhale",
    description: "A simple breathing pattern to signal safety to a busy nervous system.",
    type: "exercise",
    topic: "stress",
    url: null,
    body: "Breathe in through your nose for four counts, then exhale slowly through your mouth for six to eight counts. A longer exhale than inhale is one of the fastest ways to tell your body it's safe to stand down.",
  },
  {
    title: "Stress effects on the body",
    description: "How chronic stress shows up physically, and evidence-based ways to manage it.",
    type: "article",
    topic: "stress",
    url: "https://www.apa.org/topics/stress",
    body: null,
  },
  {
    title: "A five-minute return to the room",
    description: "A sensory grounding exercise for when your thoughts have moved too far ahead.",
    type: "exercise",
    topic: "stress",
    url: null,
    body: "Name five things you can see, four you can hear, three you can touch, two you can smell, and one you can taste. Go slowly. This isn't about getting it right — it's about giving your attention somewhere to rest besides the spiral.",
  },

  // Faith
  {
    title: "Psalm 34:18",
    description: "A verse for days that feel too heavy to carry alone.",
    type: "verse",
    topic: "faith",
    url: null,
    body: "\"The Lord is close to the brokenhearted and saves those who are crushed in spirit.\"",
  },
  {
    title: "Matthew 11:28",
    description: "An invitation to set something down, even for a moment.",
    type: "verse",
    topic: "faith",
    url: null,
    body: "\"Come to me, all you who are weary and burdened, and I will give you rest.\"",
  },
  {
    title: "A quiet question",
    description: "A reflection prompt for wherever you are in your faith.",
    type: "prompt",
    topic: "faith",
    url: null,
    body: "You don't need certainty to be honest. If you could say one true thing to God right now — a question, a complaint, a thank you — what would it be? Write it as plainly as it comes.",
  },

  // Healing
  {
    title: "Mental health education and support",
    description: "Plain-language explanations of mental health conditions and how recovery actually works.",
    type: "article",
    topic: "healing",
    url: "https://www.nami.org/about-mental-illness/mental-health-conditions/",
    body: null,
  },
  {
    title: "Naming what happened",
    description: "A gentle exercise for putting words to something hard, at your own pace.",
    type: "exercise",
    topic: "healing",
    url: null,
    body: "Try finishing this sentence, as many times as you want: 'Something that happened to me was ___.' You don't need the full story, and you don't need to share it with anyone. Naming a piece of it is still real progress.",
  },
  {
    title: "Healing isn't a straight line",
    description: "A short reminder for the days that feel like a step backward.",
    type: "tip",
    topic: "healing",
    url: null,
    body: "A harder day doesn't erase the progress you've made — it's part of how healing actually moves. Notice it, be gentle with yourself, and keep going at whatever pace today allows.",
  },

  // Self-worth
  {
    title: "The science of self-compassion",
    description: "Why treating yourself like someone you love is a skill, not a personality trait.",
    type: "article",
    topic: "self-worth",
    url: "https://greatergood.berkeley.edu/topic/self_compassion",
    body: null,
  },
  {
    title: "Evidence you overlook",
    description: "A prompt for the days your inner critic is louder than the facts.",
    type: "prompt",
    topic: "self-worth",
    url: null,
    body: "List three moments — big or small — when you showed up for someone, kept going, or did something hard. Your worth was never actually up for debate, but this is a good reminder for the part of you that forgets.",
  },
  {
    title: "The inner voice",
    description: "A note on the difference between honesty and cruelty toward yourself.",
    type: "tip",
    topic: "self-worth",
    url: null,
    body: "Notice how you'd talk to a friend in your situation, then try offering yourself that same sentence. If you wouldn't say it to someone you love, it's worth questioning why it's allowed toward you.",
  },
];

await db.delete(resourcesTable);
await db.insert(resourcesTable).values(resources);

console.log(`Seeded ${resources.length} resources.`);
process.exit(0);
