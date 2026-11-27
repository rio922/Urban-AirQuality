/**
 * Prompt-injection and output hardening helpers for the AI assistant.
 * These are heuristic defenses layered on top of server-side validation;
 * they are never a substitute for keeping secrets server-side.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /(reveal|show|repeat|print|output)\s+(me\s+)?(your|the)\s+(system|initial|original)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(a|an|no longer)/i,
  /(developer|admin|god)\s+mode/i,
  /<\|?(im_start|system|endoftext)\|?>/i,
  /jailbreak/i,
];

/** Question patterns that have no air-quality answer and invite misuse. */
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /(write|generate|compose)\s+(me\s+)?(an?\s+)?(essay|poem|song|story|code|email)/i,
  /(who|what)\s+(is|are)\s+the\s+president/i,
];

/** Result of screening a user question. */
export interface ScreenResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Screens a user question for prompt injection and clearly off-topic requests.
 * @param question raw user input (already length-limited by validation).
 */
export function screenQuestion(question: string): ScreenResult {
  const normalized = question.replace(/\s+/g, ' ').trim();
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'This question looks like an attempt to change my instructions. Ask me about air quality instead.' };
    }
  }
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(normalized)) {
      return { allowed: false, reason: 'I can only answer questions about air quality, pollution and health guidance.' };
    }
  }
  return { allowed: true };
}

/**
 * Neutralizes markdown-style injection targets in model output.
 * The client renders plain text; we strip any stray HTML to be safe.
 */
export function sanitizeModelOutput(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}
