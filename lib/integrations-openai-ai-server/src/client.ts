import OpenAI from "openai";

const userKey = process.env.OPENAI_API_KEY;
const replitKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const replitBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

if (!userKey && !(replitKey && replitBaseUrl)) {
  throw new Error(
    "No OpenAI credentials found. Set OPENAI_API_KEY or provision the Replit OpenAI AI integration.",
  );
}

export const openai = userKey
  ? new OpenAI({ apiKey: userKey })
  : new OpenAI({ apiKey: replitKey, baseURL: replitBaseUrl });
