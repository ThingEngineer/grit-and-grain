/**
 * Farm Memory Topic Guard
 *
 * Lightweight keyword-based relevance check to prevent off-topic queries from
 * reaching the RAG pipeline and LLM. Designed to be fast and conservative —
 * it only blocks messages that are clearly unrelated to ranch/farm operations.
 * Edge cases and ambiguous queries are allowed through; Claude's system prompt
 * handles those gracefully.
 */

// ── Farm relevance keywords ──────────────────────────────────────────────────
// Any match from this list marks the message as farm-related.
const FARM_KEYWORDS = new Set([
  // Livestock & animals
  "cattle",
  "cow",
  "cows",
  "bull",
  "bulls",
  "calf",
  "calves",
  "heifer",
  "heifers",
  "steer",
  "steers",
  "horse",
  "horses",
  "goat",
  "goats",
  "sheep",
  "pig",
  "pigs",
  "hog",
  "hogs",
  "poultry",
  "chicken",
  "chickens",
  "herd",
  "herds",
  "flock",
  "livestock",
  "animal",
  "animals",
  // Pasture & land
  "pasture",
  "pastures",
  "paddock",
  "paddocks",
  "range",
  "rangeland",
  "field",
  "fields",
  "meadow",
  "meadows",
  "acre",
  "acres",
  "lot",
  "corral",
  "pen",
  "pens",
  "barn",
  "barnyard",
  "ranch",
  "ranching",
  "farm",
  "farming",
  "land",
  // Feed & forage
  "hay",
  "straw",
  "silage",
  "forage",
  "forage",
  "grass",
  "graze",
  "grazing",
  "feed",
  "feeding",
  "supplement",
  "mineral",
  "salt",
  "mineral",
  "bale",
  "bales",
  "baling",
  "harvest",
  "harvesting",
  "cut",
  "cutting",
  // Water & weather
  "rain",
  "rainfall",
  "rain",
  "precipitation",
  "drought",
  "flood",
  "irrigation",
  "water",
  "trough",
  "dam",
  "pond",
  "well",
  "pump",
  "tank",
  "frost",
  "freeze",
  "humidity",
  "weather",
  "temperature",
  "wind",
  // Rotation & management
  "rotation",
  "rotate",
  "rest",
  "rested",
  "move",
  "moved",
  "moved",
  "cycle",
  "rest period",
  "fence",
  "fencing",
  "gate",
  "gates",
  "chute",
  // Health & vet
  "vaccine",
  "vaccination",
  "vaccinate",
  "vaccinated",
  "vet",
  "veterinary",
  "health",
  "sick",
  "illness",
  "treatment",
  "deworm",
  "dewormer",
  "parasite",
  "fly",
  "tick",
  "lice",
  "wound",
  "injury",
  // Breeding & reproduction
  "breed",
  "breeding",
  "bred",
  "bull",
  "wean",
  "weaning",
  "weaned",
  "pregnancy",
  "pregnant",
  "calving",
  "calved",
  "birth",
  "born",
  // Production & records
  "weight",
  "gain",
  "yield",
  "lb",
  "lbs",
  "head",
  "count",
  "soil",
  "erosion",
  "crop",
  "crops",
  "planting",
  "planted",
  // App-specific terms (always on-topic)
  "diary",
  "entry",
  "entries",
  "note",
  "notes",
  "log",
  "logged",
  "record",
  "recorded",
  "history",
  "review",
  "summary",
  "profile",
  "pasture",
  // Common query words in context
  "last",
  "recent",
  "when",
  "how much",
  "how many",
  "this week",
  "this month",
  "this year",
  "ever",
  "trend",
  "pattern",
]);

// ── Clearly off-topic blocking list ─────────────────────────────────────────
// These phrases indicate requests that have nothing to do with ranch operations.
// Matched case-insensitively against the full message.
const OFF_TOPIC_PATTERNS: RegExp[] = [
  // Coding & programming
  /\b(write|create|generate|make|build|code|program|script|function|class|algorithm|api|debug|fix|html|css|javascript|typescript|python|java|sql|regex|json|xml)\b.*\b(code|program|script|function|app|website|page|component|snippet|example)\b/i,
  /\b(how (do|to) (code|program|build|create|make) (a|an|the))\b/i,
  // Creative writing & entertainment
  /\b(write (me )?(a |an )?(poem|song|story|essay|joke|riddle|rap|haiku|limerick|novel|screenplay|script))\b/i,
  /\b(tell (me )?(a |an )?(joke|story|riddle|fun fact))\b/i,
  // Trivia & general knowledge (clearly off-topic)
  /\b(capital (city |of )\w+)\b/i,
  /\b(who (is|was) (the )?(president|prime minister|king|queen|ceo|founder))\b/i,
  /\b(what (is|are|was|were) (the )?(population|gdp|currency|flag|anthem|language) of)\b/i,
  /\b(explain (quantum|relativity|calculus|algebra|chemistry|biology|physics|history|geography))\b/i,
  /\b(what is (the meaning of (life|existence)|consciousness|time|love|happiness))\b/i,
  // Math & academic
  /\b(solve|calculate|compute|integrate|differentiate|factor|simplify)\b.*\b(equation|polynomial|integral|derivative|matrix|expression)\b/i,
  /\b(what is \d+ (times|divided by|plus|minus|to the power) \d+)\b/i,
  // Recipes (unless farm context)
  /\b(recipe for|how to (cook|make|bake|prepare) (pasta|pizza|bread|cake|soup|sushi|tacos|burger))\b/i,
  // Travel
  /\b(best (hotels?|restaurants?|places to visit|things to do) in)\b/i,
  /\b(how (do i|to) (get to|travel to|fly to|drive to))\b/i,
  // Movies, music, sports (unless ranching adjacent)
  /\b(imdb|netflix|spotify|youtube)\b/i,
  /\b(who (sings?|wrote|directed|starred in|plays?( for)?))\b/i,
  /\b(latest (movie|song|album|game|episode|season))\b/i,
  // Politics & news
  /\b(democrat|republican|liberal|conservative|election|vote|poll|congress|senate|parliament)\b/i,
  // Harmful / jailbreak
  /\b(ignore (all )?(previous |prior )?(instructions?|rules?|prompts?))\b/i,
  /\b(you are (now |a )?(dan|jailbreak|uncensored|unrestricted|evil|unlimited))\b/i,
  /\b(pretend (you are|to be) (a|an) (different|evil|unrestricted))\b/i,
  /\b(act as (a|an) (different|uncensored|unrestricted|evil) (ai|assistant|bot|model))\b/i,
  /\b(forget (your|all) (instructions?|rules?|training|guidelines?))\b/i,
  /\b(do (anything|everything) (now|without restrictions?))\b/i,
];

// ── Minimum word threshold ────────────────────────────────────────────────────
const MIN_WORDS = 2;

export interface TopicGuardResult {
  allowed: boolean;
  /** Reason for blocking, or undefined when allowed */
  reason?: string;
}

/**
 * Determines whether a user message is relevant to ranch/farm operations.
 *
 * Strategy:
 * 1. Always allow very short inputs (greetings, clarifications, "thanks", etc.)
 * 2. Allow if any farm keyword is found in the tokenised message.
 * 3. Block if an off-topic pattern matches AND no farm keywords are present.
 *
 * The guard is intentionally permissive — Claude's system prompt is the second
 * layer and handles nuanced refusals.
 */
export function checkTopicRelevance(message: string): TopicGuardResult {
  const trimmed = message.trim().toLowerCase();
  const words = trimmed.split(/\s+/);

  // Allow very short messages (greetings, "yes", "no", "thanks", follow-ups)
  if (words.length < MIN_WORDS) {
    return { allowed: true };
  }

  // Check for farm keywords (tokenise to avoid partial word false positives)
  const hasFarmKeyword = words.some((word) => {
    // Strip basic punctuation from each token
    const clean = word.replace(/[^a-z0-9]/g, "");
    return FARM_KEYWORDS.has(clean);
  });

  if (hasFarmKeyword) {
    return { allowed: true };
  }

  // Check bi-gram phrases too (e.g. "how much", "this week")
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (FARM_KEYWORDS.has(bigram)) {
      return { allowed: true };
    }
  }

  // Check for jailbreak / clearly off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        reason:
          "That question doesn't appear to be about your ranch. Farm Memory can only answer questions about your diary entries — pastures, herds, rainfall, hay, and herd health.",
      };
    }
  }

  // No farm keywords found and no hard block — still allow but Claude will handle it
  // (the system prompt instructs it to say "I don't have a record of that in your diary")
  return { allowed: true };
}
