import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type ChatMode = "rules" | "openai" | "hybrid";
type ChatSource = "rules" | "openai";
type ChatResult = {
  message: string;
  source: ChatSource;
  modelUsed?: string;
  fellBack?: boolean;
};
type SearchDocument = { label: string; text: string; answer: string };
type CachedChatResult = ChatResult & { createdAt: number };
type RateLimitEntry = { count: number; windowStart: number };

const chatResponseCache = new Map<string, CachedChatResult>();
const chatRateLimitStore = new Map<string, RateLimitEntry>();
const RULES_NO_MATCH_MESSAGE = "I could not find this information in the current profile data.";

type Intent =
  | "greeting"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "certificates"
  | "publications"
  | "contact"
  | "profile"
  | "fallback";

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(text: string, phrase: string) {
  const pattern = `\\b${escapeRegex(phrase).replace(/\\\s+/g, "\\s+")}\\b`;
  return new RegExp(pattern, "i").test(text);
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => containsPhrase(text, keyword));
}

const SEARCH_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "do", "for", "from", "have", "how", "i", "in",
  "is", "it", "me", "my", "of", "on", "or", "the", "to", "u", "what", "who", "with", "your",
]);

function tokenizeForSearch(text: string) {
  return normalizeText(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !SEARCH_STOPWORDS.has(token));
}

function scoreDocument(queryTokens: string[], docText: string) {
  const normalizedDoc = normalizeText(docText);
  const docTokens = new Set(tokenizeForSearch(docText));

  let tokenMatches = 0;
  let phraseMatches = 0;

  for (const token of queryTokens) {
    if (docTokens.has(token)) {
      tokenMatches += 1;
    }
    if (normalizedDoc.includes(token)) {
      phraseMatches += 1;
    }
  }

  const coverage = queryTokens.length > 0 ? tokenMatches / queryTokens.length : 0;
  const score = tokenMatches * 2 + phraseMatches + (coverage >= 0.6 ? 3 : 0);

  return { tokenMatches, coverage, score };
}

function buildSearchDocuments(
  profile: Awaited<ReturnType<typeof prisma.profile.findFirst>>,
  skills: Awaited<ReturnType<typeof prisma.skill.findMany>>,
  projects: Awaited<ReturnType<typeof prisma.project.findMany>>,
  experiences: Awaited<ReturnType<typeof prisma.experience.findMany>>,
  education: Awaited<ReturnType<typeof prisma.education.findMany>>,
  certificates: Awaited<ReturnType<typeof prisma.certificate.findMany>>,
  publications: Awaited<ReturnType<typeof prisma.publication.findMany>>
) {
  const docs: SearchDocument[] = [];

  if (profile) {
    docs.push({
      label: "profile",
      text: `${profile.name} ${profile.title} ${profile.bio} ${profile.aboutTitle || ""} ${profile.address || ""} ${profile.email || ""}`,
      answer: `${profile.name} is a ${profile.title}. ${profile.bio}`,
    });
  }

  for (const skill of skills) {
    docs.push({
      label: "skill",
      text: `${skill.name} ${skill.category}`,
      answer: `${skill.name} (${skill.category})${skill.level ? ` - proficiency ${skill.level}%` : ""}`,
    });
  }

  for (const project of projects) {
    docs.push({
      label: "project",
      text: `${project.title} ${project.description} ${project.tags}`,
      answer: `${project.title}: ${project.description}`,
    });
  }

  for (const exp of experiences) {
    docs.push({
      label: "experience",
      text: `${exp.position} ${exp.company} ${exp.description || ""}`,
      answer: `${exp.position} at ${exp.company} (${formatYear(exp.startDate)} - ${exp.current ? "Present" : formatYear(exp.endDate)})`,
    });
  }

  for (const edu of education) {
    docs.push({
      label: "education",
      text: `${edu.degree} ${edu.field || ""} ${edu.school}`,
      answer: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}, ${edu.school}`,
    });
  }

  for (const cert of certificates) {
    docs.push({
      label: "certificate",
      text: `${cert.title} ${cert.issuer || ""} ${cert.credentialId || ""}`,
      answer: `${cert.title}${cert.issuer ? ` - ${cert.issuer}` : ""}`,
    });
  }

  for (const pub of publications) {
    docs.push({
      label: "publication",
      text: `${pub.title} ${pub.publisher || ""} ${pub.description || ""}`,
      answer: `${pub.title}${pub.publisher ? ` (${pub.publisher})` : ""}`,
    });
  }

  return docs;
}

function searchProfileDocuments(question: string, docs: SearchDocument[]) {
  const queryTokens = tokenizeForSearch(question);
  if (!queryTokens.length) return [] as SearchDocument[];

  const matches = docs
    .map((doc) => ({ doc, ...scoreDocument(queryTokens, doc.text) }))
    .filter((row) => row.tokenMatches >= 1 && row.score >= 3)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage)
    .slice(0, 4)
    .map((row) => row.doc);

  return matches;
}

function detectIntent(question: string): Intent {
  const text = normalizeText(question);

  const isShortGreeting =
    text.length <= 24 &&
    includesAny(text, ["hi", "hello", "hey", "good morning", "good evening", "good afternoon"]);

  if (isShortGreeting) {
    return "greeting";
  }
  if (includesAny(text, ["skill", "skills", "strongest skill", "strongest skills", "stack", "technology", "technologies", "tech", "language", "languages", "expertise"])) {
    return "skills";
  }
  if (includesAny(text, ["project", "portfolio", "featured", "github", "live demo"])) {
    return "projects";
  }
  if (includesAny(text, ["experience", "work", "job", "company", "career"])) {
    return "experience";
  }
  if (includesAny(text, ["education", "study", "degree", "university", "school"])) {
    return "education";
  }
  if (includesAny(text, ["certificate", "certification", "credential"])) {
    return "certificates";
  }
  if (includesAny(text, ["publication", "research", "paper", "journal"])) {
    return "publications";
  }
  if (includesAny(text, ["contact", "email", "phone", "reach", "hire"])) {
    return "contact";
  }
  if (includesAny(text, ["bio", "who are", "who is", "profile", "introduce"])) {
    return "profile";
  }

  return "fallback";
}

function formatYear(dateValue?: Date | null) {
  if (!dateValue) return "Present";
  return String(new Date(dateValue).getFullYear());
}

function countUniqueExperienceMonths(
  ranges: Array<{ startDate: Date; endDate: Date | null; current: boolean }>
) {
  const coveredMonths = new Set<string>();

  for (const range of ranges) {
    const start = new Date(range.startDate);
    const end = range.current ? new Date() : new Date(range.endDate || range.startDate);

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= last) {
      coveredMonths.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return coveredMonths.size;
}

function formatDuration(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const yearLabel = years > 0 ? `${years} year${years > 1 ? "s" : ""}` : "";
  const monthLabel = months > 0 ? `${months} month${months > 1 ? "s" : ""}` : "";
  return [yearLabel, monthLabel].filter(Boolean).join(" ") || "less than 1 month";
}

function isAiMlExperience(position: string, description?: string | null) {
  const content = normalizeText(`${position} ${description || ""}`);
  return includesAny(content, ["ai", "ml", "machine learning", "artificial intelligence", "model", "automation"]);
}

function isBackendExperience(position: string, description?: string | null) {
  const content = normalizeText(`${position} ${description || ""}`);
  return includesAny(content, ["backend", "back end", "api", "server", "database", "integration"]);
}

function getLastUserQuestion(messages: Array<{ role?: string; content?: string }>) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role === "user" && typeof message.content === "string") {
      return message.content;
    }
  }
  return "";
}

function getCacheConfig() {
  return {
    ttlMs: Number(process.env.CHAT_CACHE_TTL_MS || 120000),
    maxEntries: Number(process.env.CHAT_CACHE_MAX_ENTRIES || 200),
  };
}

function getRateLimitConfig() {
  return {
    windowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60000),
    maxRequests: Number(process.env.CHAT_RATE_LIMIT_MAX || 20),
  };
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return "unknown";
}

function consumeRateLimit(ip: string) {
  const { windowMs, maxRequests } = getRateLimitConfig();
  const now = Date.now();
  const existing = chatRateLimitStore.get(ip);

  if (!existing || now - existing.windowStart >= windowMs) {
    chatRateLimitStore.set(ip, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      resetMs: windowMs,
    };
  }

  existing.count += 1;
  chatRateLimitStore.set(ip, existing);

  const remaining = Math.max(0, maxRequests - existing.count);
  const resetMs = Math.max(0, windowMs - (now - existing.windowStart));
  const allowed = existing.count <= maxRequests;

  return { allowed, limit: maxRequests, remaining, resetMs };
}

function pruneRateLimitStoreIfNeeded() {
  if (chatRateLimitStore.size <= 5000) return;

  const now = Date.now();
  const { windowMs } = getRateLimitConfig();

  for (const [ip, entry] of chatRateLimitStore.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      chatRateLimitStore.delete(ip);
    }
  }
}

function getChatMode(): ChatMode {
  const mode = normalizeText(process.env.CHAT_MODE || "rules");
  if (mode === "openai" || mode === "hybrid" || mode === "rules") {
    return mode;
  }
  return "rules";
}

function getCacheKey(question: string, mode: ChatMode) {
  return `${mode}:${normalizeText(question).replace(/\s+/g, " ")}`;
}

function getCachedResponse(cacheKey: string): ChatResult | null {
  const { ttlMs } = getCacheConfig();
  const cached = chatResponseCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > ttlMs) {
    chatResponseCache.delete(cacheKey);
    return null;
  }

  return {
    message: cached.message,
    source: cached.source,
    modelUsed: cached.modelUsed,
    fellBack: cached.fellBack,
  };
}

function pruneCacheIfNeeded() {
  const { maxEntries } = getCacheConfig();
  if (chatResponseCache.size <= maxEntries) return;

  const overflow = chatResponseCache.size - maxEntries;
  const entries = Array.from(chatResponseCache.entries()).sort((a, b) => a[1].createdAt - b[1].createdAt);
  for (let i = 0; i < overflow; i++) {
    chatResponseCache.delete(entries[i][0]);
  }
}

function setCachedResponse(cacheKey: string, result: ChatResult) {
  chatResponseCache.set(cacheKey, {
    ...result,
    createdAt: Date.now(),
  });
  pruneCacheIfNeeded();
}

async function buildRulesResponse(question: string): Promise<ChatResult> {
  const text = normalizeText(question);
  const intent = detectIntent(question);

  const [profile, skills, projects, experiences, education, certificates, publications] = await Promise.all([
    prisma.profile.findFirst({ include: { socialLinks: { orderBy: { order: "asc" } } } }),
    prisma.skill.findMany({ orderBy: [{ level: "desc" }, { order: "asc" }] }),
    prisma.project.findMany({ orderBy: [{ featured: "desc" }, { order: "asc" }] }),
    prisma.experience.findMany({ orderBy: [{ current: "desc" }, { startDate: "desc" }] }),
    prisma.education.findMany({ orderBy: [{ current: "desc" }, { passingYear: "desc" }] }),
    prisma.certificate.findMany({ orderBy: { order: "asc" } }),
    prisma.publication.findMany({ orderBy: [{ submitted: "asc" }, { date: "desc" }] }),
  ]);

  const userName = profile?.name || "the portfolio owner";
  const asksIdentity =
    (includesAny(text, ["who is", "tell me about", "about", "introduce"]) &&
      includesAny(text, ["himel", "faishal", "owner", userName.toLowerCase()])) ||
    includesAny(text, ["who is himel", "who is faishal", "about himel", "about faishal"]);

  const asksCurrentWorkplace =
    includesAny(text, ["current working place", "current workplace", "current company", "where does he work", "where is he working"]) ||
    (includesAny(text, ["current", "working", "work", "company"]) && includesAny(text, ["where", "place"]));

  const asksAiMlExperience =
    includesAny(text, ["ai", "ml", "machine learning", "artificial intelligence"]) &&
    includesAny(text, ["experience", "experiences", "how many", "how much", "year", "years", "duration"]);

  const asksBackendExperience =
    includesAny(text, ["backend", "back end", "api", "server side", "server"]) &&
    includesAny(text, ["experience", "experienced", "have", "worked", "work"]);

  if (asksIdentity) {
    return {
      message: profile
        ? `${profile.name} is a ${profile.title}.\n${profile.bio}`
        : "Profile details are not available yet. Please update the Profile section from admin.",
      source: "rules",
    };
  }

  if (asksCurrentWorkplace) {
    const currentExperience = experiences.find((exp) => exp.current) || experiences[0];

    if (!currentExperience) {
      return { message: "Current workplace is not available yet in the experience section.", source: "rules" };
    }

    return {
      message: `${userName} is currently working as ${currentExperience.position} at ${currentExperience.company}.`,
      source: "rules",
    };
  }

  if (asksAiMlExperience) {
    const aiMlExperiences = experiences.filter((exp) => isAiMlExperience(exp.position, exp.description));

    if (!aiMlExperiences.length) {
      return { message: "No dedicated AI/ML experience entries are available yet.", source: "rules" };
    }

    const totalMonths = countUniqueExperienceMonths(aiMlExperiences);

    const roleLines = aiMlExperiences.map(
      (exp) => `- ${exp.position} at ${exp.company} (${formatYear(exp.startDate)} - ${exp.current ? "Present" : formatYear(exp.endDate)})`
    );

    const aiMlSkills = skills
      .filter((skill) => includesAny(normalizeText(`${skill.category} ${skill.name}`), ["ai/ml", "ai", "ml", "machine learning", "tensorflow", "pytorch", "scikit-learn"]))
      .slice(0, 5)
      .map((skill) => skill.name);

    return {
      message:
        `AI/ML experience: ${formatDuration(totalMonths)} across ${aiMlExperiences.length} role(s).\n` +
        `${roleLines.join("\n")}` +
        `${aiMlSkills.length ? `\n\nKey AI/ML skills: ${aiMlSkills.join(", ")}` : ""}`,
      source: "rules",
    };
  }

  if (asksBackendExperience) {
    const backendExperiences = experiences.filter((exp) => isBackendExperience(exp.position, exp.description));
    const backendSkills = skills
      .filter((skill) => includesAny(normalizeText(`${skill.category} ${skill.name}`), ["backend", "api", "server", "database", "sql", "fastapi", "node", "express", "prisma"]))
      .slice(0, 6)
      .map((skill) => skill.name);

    if (!backendExperiences.length && !backendSkills.length) {
      return { message: "No backend-focused entries are available yet.", source: "rules" };
    }

    const totalMonths = countUniqueExperienceMonths(backendExperiences);

    const roleLines = backendExperiences.map(
      (exp) => `- ${exp.position} at ${exp.company} (${formatYear(exp.startDate)} - ${exp.current ? "Present" : formatYear(exp.endDate)})`
    );

    return {
      message:
        `Yes, ${userName} has backend experience${backendExperiences.length ? ` (${formatDuration(totalMonths)} total).` : "."}` +
        `${roleLines.length ? `\n${roleLines.join("\n")}` : ""}` +
        `${backendSkills.length ? `\n\nCore backend skills: ${backendSkills.join(", ")}` : ""}`,
      source: "rules",
    };
  }

  if (intent === "greeting") {
    return {
      message: `Hi! I am Faishal Assistant. I can answer about ${userName}'s skills, projects, experience, education, and contact details.\n\nTry: \"What are your strongest skills?\"`,
      source: "rules",
    };
  }

  if (intent === "profile") {
    return {
      message: profile
        ? `${profile.name} is a ${profile.title}.\n\n${profile.bio}`
        : "Profile details are not available yet. Please update the Profile section from admin.",
      source: "rules",
    };
  }

  if (intent === "skills") {
    if (!skills.length) {
      return { message: "No skills are listed yet in the admin panel.", source: "rules" };
    }

    const lines = skills.slice(0, 8).map((skill) => `- ${skill.name}${skill.category ? ` (${skill.category})` : ""}`);
    return {
      message: `Top skills:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "projects") {
    if (!projects.length) {
      return {
        message: "No featured projects are available yet. Add projects in admin to show them here.",
        source: "rules",
      };
    }

    const lines = projects
      .filter((project) => project.featured)
      .slice(0, 5)
      .map((project) => `- ${project.title}: ${project.description}`);
    return {
      message: `Featured projects:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "experience") {
    if (!experiences.length) {
      return { message: "No experience entries are available yet.", source: "rules" };
    }

    const lines = experiences.slice(0, 5).map(
      (exp) => `- ${exp.position} at ${exp.company} (${formatYear(exp.startDate)} - ${exp.current ? "Present" : formatYear(exp.endDate)})`
    );
    return {
      message: `Work experience summary:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "education") {
    if (!education.length) {
      return { message: "No education records are available yet.", source: "rules" };
    }

    const lines = education.slice(0, 4).map(
      (edu) => `- ${edu.degree}${edu.field ? ` in ${edu.field}` : ""}, ${edu.school} (${edu.current ? "Ongoing" : edu.passingYear})`
    );
    return {
      message: `Education:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "certificates") {
    if (!certificates.length) {
      return { message: "No certificates are listed yet.", source: "rules" };
    }

    const lines = certificates.slice(0, 4).map((cert) => `- ${cert.title}${cert.issuer ? ` - ${cert.issuer}` : ""}`);
    return {
      message: `Certificates:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "publications") {
    if (!publications.length) {
      return { message: "No publications are listed yet.", source: "rules" };
    }

    const lines = publications.slice(0, 4).map((pub) => `- ${pub.title}${pub.publisher ? ` (${pub.publisher})` : ""}`);
    return {
      message: `Publications:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  if (intent === "contact") {
    if (!profile?.email && !profile?.socialLinks?.length) {
      return {
        message: "Contact details are not configured yet. Add email or social links in the admin profile section.",
        source: "rules",
      };
    }

    const contactLines: string[] = [];
    if (profile?.email) {
      contactLines.push(`- Email: ${profile.email}`);
    }
    for (const link of profile?.socialLinks || []) {
      contactLines.push(`- ${link.platform}: ${link.url}`);
    }

    return {
      message: `You can contact ${userName} via:\n${contactLines.join("\n")}`,
      source: "rules",
    };
  }

  const searchDocs = buildSearchDocuments(profile, skills, projects, experiences, education, certificates, publications);
  const dynamicMatches = searchProfileDocuments(question, searchDocs);

  if (dynamicMatches.length) {
    const lines = dynamicMatches.map((match) => `- ${match.answer}`);
    return {
      message: `I found this in the profile data:\n${lines.join("\n")}`,
      source: "rules",
    };
  }

  return {
    message: RULES_NO_MATCH_MESSAGE,
    source: "rules",
  };
}

function getOpenAIBaseUrl() {
  const configured = (process.env.OPENAI_BASE_URL || "").trim();
  return (configured || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function getOpenAIHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when CHAT_MODE is openai or hybrid fallback is used.");
  }

  const apiKeyHeader = (process.env.OPENAI_API_KEY_HEADER || "Authorization").trim();
  const apiKeyPrefix = (process.env.OPENAI_API_KEY_PREFIX || "Bearer").trim();

  headers[apiKeyHeader] = apiKeyPrefix ? `${apiKeyPrefix} ${apiKey}` : apiKey;
  return headers;
}

async function askOpenAIWithModel(
  messages: AiMessage[],
  model: string,
  timeoutMs: number,
  maxTokens: number,
  temperature: number
): Promise<ChatResult> {
  const baseUrl = getOpenAIBaseUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const recentMessages = messages.slice(-10);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: getOpenAIHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        messages: recentMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    return { message: assistantMessage, source: "openai", modelUsed: model, fellBack: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function askOpenAI(messages: AiMessage[]): Promise<ChatResult> {
  const [profile, skills, experiences, projects] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.skill.findMany({ orderBy: [{ level: "desc" }, { order: "asc" }], take: 8 }),
    prisma.experience.findMany({ orderBy: [{ current: "desc" }, { startDate: "desc" }], take: 4 }),
    prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" }, take: 4 }),
  ]);

  const profileLine = profile
    ? `${profile.name} | ${profile.title} | ${profile.bio}`
    : "Profile data not available.";

  const skillLines = skills.length
    ? skills.map((skill) => `- ${skill.name} (${skill.category})${skill.level ? ` ${skill.level}%` : ""}`).join("\n")
    : "- No skills listed";

  const experienceLines = experiences.length
    ? experiences
        .map(
          (exp) =>
            `- ${exp.position} at ${exp.company} (${formatYear(exp.startDate)} - ${exp.current ? "Present" : formatYear(exp.endDate)})`
        )
        .join("\n")
    : "- No experience listed";

  const projectLines = projects.length
    ? projects.map((project) => `- ${project.title}: ${project.description}`).join("\n")
    : "- No featured projects listed";

  const portfolioContext = `
PROFILE
${profileLine}

TOP SKILLS
${skillLines}

EXPERIENCE
${experienceLines}

FEATURED PROJECTS
${projectLines}
`.trim();

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || "gpt-4.1-mini";
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
  const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || 350);
  const temperature = Number(process.env.OPENAI_TEMPERATURE || 0.3);

  const systemMessage = {
    role: "system" as const,
    content: `You are the portfolio assistant for ${profile?.name || "Faishal Uddin Himel"}, a software developer.

Your goals:
- Help visitors quickly understand the developer's skills, projects, experience, education, certifications, and contact intent.
- Keep responses concise, useful, and professional.
- Prefer concrete summaries over generic advice.

Response style:
- Default to 2-6 short lines.
- Use bullets when listing achievements/skills.
- If information is uncertain or missing, say so clearly and suggest what section to check (projects, experience, blog, contact).

Boundaries:
- Focus on this portfolio and the owner's professional profile.
- If a request is unrelated, politely steer the user back to portfolio-related topics.
- Do not fabricate specific facts that are not provided in the portfolio context below.

Portfolio context (source of truth):
${portfolioContext}

Tone:
- Friendly, confident, and direct.
- Avoid fluff and repetitive phrases.`,
  };

  const payload = [systemMessage, ...messages] as AiMessage[];

  try {
    const primaryResult = await askOpenAIWithModel(payload, model, timeoutMs, maxTokens, temperature);
    return { ...primaryResult, fellBack: false };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    if (!isTimeout || fallbackModel === model) {
      throw error;
    }

    const fallbackResult = await askOpenAIWithModel(
      payload,
      fallbackModel,
      timeoutMs,
      Math.max(180, Math.floor(maxTokens * 0.8)),
      temperature
    );
    return { ...fallbackResult, fellBack: true };
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = consumeRateLimit(clientIp);
    pruneRateLimitStoreIfNeeded();

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many chat requests. Please wait a moment and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetMs / 1000)),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetMs / 1000)),
          },
        }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const chatMode = getChatMode();
    const userQuestion = getLastUserQuestion(messages as Array<{ role?: string; content?: string }>);
    const cacheKey = getCacheKey(userQuestion, chatMode);
    const cached = getCachedResponse(cacheKey);

    if (cached) {
      return NextResponse.json({
        message: cached.message,
        source: cached.source,
        modelUsed: cached.modelUsed,
        fellBack: cached.fellBack ?? false,
        cached: true,
      });
    }

    let result: ChatResult;

    if (chatMode === "rules") {
      result = await buildRulesResponse(userQuestion);
    } else if (chatMode === "openai") {
      result = await askOpenAI(messages as AiMessage[]);
    } else {
      const rulesResult = await buildRulesResponse(userQuestion);
      if (rulesResult.message !== RULES_NO_MATCH_MESSAGE) {
        result = rulesResult;
      } else {
        try {
          result = await askOpenAI(messages as AiMessage[]);
        } catch (openAiError) {
          console.warn("Hybrid chat fallback failed; returning rules result", openAiError);
          result = {
            ...rulesResult,
            message: `${rulesResult.message}\nAI fallback is currently unavailable.`,
          };
        }
      }
    }

    setCachedResponse(cacheKey, result);

    return NextResponse.json({
      message: result.message,
      source: result.source,
      modelUsed: result.modelUsed,
      fellBack: result.fellBack ?? false,
      cached: false,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request.",
      },
      { status: 500 }
    );
  }
}
