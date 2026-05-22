import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { buildPrompt, SYSTEM_PROMPT } from './prompt.service';
import type { AssessmentJobData } from '../queues/assessment.queue';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ── Response Schema Validation ──
const questionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  question: z.string().min(1),
  marks: z.number().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().default('Answer all questions in this section.'),
  questions: z.array(questionSchema).min(1),
});

const paperSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().default('Read all questions carefully before answering.'),
  duration: z.string().optional(),
  sections: z.array(sectionSchema).min(1),
});

export type ParsedPaper = z.infer<typeof paperSchema>;

// ── Parse AI response with fallback JSON repair ──
function parseAIResponse(raw: string): ParsedPaper {
  logger.debug(`[AI] Raw response length: ${raw.length} chars`);

  let cleaned = raw.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error('[AI] No JSON object found in AI response');
    throw new Error('No JSON object found in AI response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
    logger.debug('[AI] JSON parsed successfully on first attempt');
  } catch (e) {
    logger.warn('[AI] JSON parse failed, attempting repair...');
    // Attempt basic repair: fix trailing commas, unescaped newlines
    const repaired = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' '); // strip control chars
    try {
      parsed = JSON.parse(repaired);
      logger.info('[AI] JSON repaired and parsed successfully');
    } catch (e2) {
      logger.error('[AI] JSON repair also failed');
      throw new Error('Failed to parse AI response as JSON even after repair');
    }
  }

  // Validate against schema
  const result = paperSchema.safeParse(parsed);
  if (!result.success) {
    logger.error(`[AI] Schema validation failed: ${JSON.stringify(result.error.flatten())}`);
    throw new Error(`Schema validation failed: ${result.error.errors.map((e) => e.message).join(', ')}`);
  }

  logger.info('[AI] Schema validation passed ✅');
  return result.data;
}

// ══════════════════════════════════════════════════
//  Provider 1: Google Gemini (Primary – FREE)
// ══════════════════════════════════════════════════
async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  logger.info('[Gemini] Initializing Google Generative AI client...');
  const genAI = new GoogleGenerativeAI(apiKey);

  let modelName = env.AI_MODEL.startsWith('gemini') ? env.AI_MODEL : 'gemini-2.5-flash';
  if (modelName === 'gemini-1.5-flash') {
    modelName = 'gemini-2.5-flash';
  }
  logger.info(`[Gemini] Using model: ${modelName}`);

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    } as any,
  });

  logger.info('[Gemini] Sending generation request to gemini-1.5-flash...');

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
      },
    ],
  });

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  logger.info(`[Gemini] Received response (${text.length} chars)`);
  return text;
}

// ══════════════════════════════════════════════════
//  Provider 2: Ollama Local LLM (Fallback – FREE)
// ══════════════════════════════════════════════════
async function generateWithOllama(prompt: string): Promise<string> {
  const baseUrl = env.OLLAMA_BASE_URL;
  const model = env.OLLAMA_MODEL;

  logger.info(`[Ollama] Sending generation request to ${baseUrl} (model: ${model})...`);

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      format: 'json',
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    throw new Error(`Ollama HTTP ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const text = data?.message?.content;

  if (!text) {
    throw new Error('Empty response from Ollama');
  }

  logger.info(`[Ollama] Received response (${text.length} chars)`);
  return text;
}

// ══════════════════════════════════════════════════
//  Provider 3: OpenAI (Legacy – kept for compat)
// ══════════════════════════════════════════════════
async function generateWithOpenAI(prompt: string): Promise<string> {
  const { default: OpenAI } = await import('openai');

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  logger.info(`[OpenAI] Sending generation request to ${env.AI_MODEL}...`);
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: env.AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');

  logger.info(`[OpenAI] Received response (${text.length} chars)`);
  return text;
}

// ══════════════════════════════════════════════════
//  Main Generator: Primary → Fallback chain
// ══════════════════════════════════════════════════
export async function generateAssessment(data: AssessmentJobData): Promise<ParsedPaper> {
  const prompt = buildPrompt(data);

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('[AI] Starting assessment generation');
  logger.info(`[AI] Title: ${data.title} | Questions: ${data.numberOfQuestions}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Build ordered provider chain based on what's configured
  const providers: { name: string; fn: () => Promise<string> }[] = [];

  // Gemini is always first if key is present
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
    providers.push({ name: 'Gemini', fn: () => generateWithGemini(prompt) });
  } else {
    logger.warn('[AI] Skipping Gemini (GEMINI_API_KEY is empty in .env)');
  }

  // Ollama is always available as a local fallback
  providers.push({ name: 'Ollama', fn: () => generateWithOllama(prompt) });

  // OpenAI is last resort if key is present
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '') {
    providers.push({ name: 'OpenAI', fn: () => generateWithOpenAI(prompt) });
  }

  const failures: string[] = [];

  for (const provider of providers) {
    // Each provider gets 2 attempts (for transient/parsing failures)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        logger.info(`[AI] Trying ${provider.name} (attempt ${attempt}/2)...`);
        const rawText = await provider.fn();

        logger.info(`[AI] Parsing ${provider.name} response...`);
        const paper = parseAIResponse(rawText);

        // Assign unique IDs to questions if missing
        paper.sections.forEach((section) => {
          section.questions.forEach((q, i) => {
            if (!q.id || q.id === '') q.id = `q${i + 1}-${uuidv4().slice(0, 8)}`;
          });
        });

        const totalQuestions = paper.sections.reduce((a, s) => a + s.questions.length, 0);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(`[AI] ✅ Generation SUCCESS via ${provider.name}`);
        logger.info(`[AI] Sections: ${paper.sections.length} | Questions: ${totalQuestions}`);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return paper;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.warn(`[AI] ${provider.name} attempt ${attempt} failed: ${errorMsg}`);
        if (attempt === 2) {
          failures.push(`${provider.name}: ${errorMsg}`);
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    logger.warn(`[AI] ${provider.name} exhausted all attempts, trying next provider...`);
  }

  const detailedError = `AI Generation failed. All configured providers were exhausted:\n` + 
    failures.map((f, i) => `${i + 1}. ${f}`).join('\n') + 
    `\n\n👉 ACTION REQUIRED:\n` +
    `- Option A: Paste a free Gemini Key into your backend .env under GEMINI_API_KEY (Google AI Studio).\n` +
    `- Option B: Start Ollama locally with "ollama run llama3" (your local port 11434 responded with connection refused).`;

  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('[AI] ❌ ALL PROVIDERS FAILED');
  logger.error(`[AI] Failure Summary:\n${detailedError}`);
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  throw new Error(detailedError);
}
