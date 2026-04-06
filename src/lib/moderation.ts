/**
 * Simple, high-performance moderation layer for AI inputs.
 * Prevents common abuse, toxicity, and irrelevant queries.
 */

const BLOCKED_PATTERNS = [
  /self[- ]?harm/i,
  /suicide/i,
  /kill my?self/i,
  /hacking/i,
  /sql injection/i,
  /<script>/i,
  /password of/i,
  /credit card number/i,
];

const DISALLOWED_TOPICS = [
  "politics",
  "religion",
  "adult content",
  "illegal drugs",
];

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
}

export function moderateContent(content: string): ModerationResult {
  const normalized = content.toLowerCase().trim();

  // 1. Check blocked regex patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { flagged: true, reason: "Safety policy violation." };
    }
  }

  // 2. Length check (prevent prompt injection via massive text)
  if (normalized.length > 4000) {
    return { flagged: true, reason: "Message too long." };
  }

  // 3. Topic check (basic keyword match)
  for (const topic of DISALLOWED_TOPICS) {
    if (normalized.includes(topic)) {
      return { flagged: true, reason: `Topic '${topic}' is outside the scope of Koda Store support.` };
    }
  }

  return { flagged: false };
}
