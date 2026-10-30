import dotenv from "dotenv";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createVoyage } from "voyage-ai-provider";
import { createOllama } from "ollama-ai-provider";

// Ensure environment variables are loaded
dotenv.config();
dotenv.config({ path: ".env.local" });

export type ChatProvider = "google" | "anthropic" | "openai" | "ollama";
export type EmbeddingProvider = "google" | "voyage" | "openai" | "ollama";

export const VALID_CHAT_PROVIDERS: ChatProvider[] = ["google", "anthropic", "openai", "ollama"];
export const VALID_EMBEDDING_PROVIDERS: EmbeddingProvider[] = ["google", "voyage", "openai", "ollama"];

export interface ProviderValidationResult {
  valid: boolean;
  missingVar?: string;
  provider: string;
  message?: string;
}

/**
 * Validates that the required environment variables for the configured chat provider exist.
 */
export function validateChatEnv(): ProviderValidationResult {
  const provider = (process.env.CHAT_PROVIDER || "anthropic").toLowerCase() as ChatProvider;

  if (!VALID_CHAT_PROVIDERS.includes(provider)) {
    return {
      valid: false,
      provider,
      message: `Invalid CHAT_PROVIDER "${provider}". Supported providers: ${VALID_CHAT_PROVIDERS.join(", ")}`,
    };
  }

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "ANTHROPIC_API_KEY",
        provider,
        message: `Missing required environment variable for CHAT_PROVIDER="anthropic": ANTHROPIC_API_KEY is not defined.`,
      };
    }
  } else if (provider === "google") {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "GOOGLE_GENERATIVE_AI_API_KEY",
        provider,
        message: `Missing required environment variable for CHAT_PROVIDER="google": GOOGLE_GENERATIVE_AI_API_KEY is not defined.`,
      };
    }
  } else if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "OPENAI_API_KEY",
        provider,
        message: `Missing required environment variable for CHAT_PROVIDER="openai": OPENAI_API_KEY is not defined.`,
      };
    }
  }

  return { valid: true, provider };
}

/**
 * Validates that the required environment variables for the configured embedding provider exist.
 */
export function validateEmbeddingEnv(): ProviderValidationResult {
  const rawProvider = (process.env.EMBEDDING_PROVIDER || "google").toLowerCase();

  if (rawProvider === "anthropic") {
    return {
      valid: false,
      provider: "anthropic",
      message: `Anthropic does not offer an embedding model and cannot be used for embeddings. Supported EMBEDDING_PROVIDER values: ${VALID_EMBEDDING_PROVIDERS.join(", ")}`,
    };
  }

  const provider = rawProvider as EmbeddingProvider;
  if (!VALID_EMBEDDING_PROVIDERS.includes(provider)) {
    return {
      valid: false,
      provider,
      message: `Invalid EMBEDDING_PROVIDER "${provider}". Supported providers: ${VALID_EMBEDDING_PROVIDERS.join(", ")}`,
    };
  }

  if (provider === "google") {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "GOOGLE_GENERATIVE_AI_API_KEY",
        provider,
        message: `Missing required environment variable for EMBEDDING_PROVIDER="google": GOOGLE_GENERATIVE_AI_API_KEY is not defined.`,
      };
    }
  } else if (provider === "voyage") {
    const key = process.env.VOYAGE_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "VOYAGE_API_KEY",
        provider,
        message: `Missing required environment variable for EMBEDDING_PROVIDER="voyage": VOYAGE_API_KEY is not defined.`,
      };
    }
  } else if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim() === "" || key.includes("your-")) {
      return {
        valid: false,
        missingVar: "OPENAI_API_KEY",
        provider,
        message: `Missing required environment variable for EMBEDDING_PROVIDER="openai": OPENAI_API_KEY is not defined.`,
      };
    }
  }

  return { valid: true, provider };
}

/**
 * Validates all required AI provider environment variables at startup and logs clear errors if missing.
 */
export function validateProviderEnv(): void {
  const chatCheck = validateChatEnv();
  if (!chatCheck.valid) {
    console.error(`[OpsPilot Startup Validation] ❌ ${chatCheck.message}`);
  } else {
    console.log(`[OpsPilot Startup Validation] ✅ Chat Provider: ${chatCheck.provider} (Model: ${process.env.CHAT_MODEL || "default"})`);
  }

  const embCheck = validateEmbeddingEnv();
  if (!embCheck.valid) {
    console.error(`[OpsPilot Startup Validation] ❌ ${embCheck.message}`);
  } else {
    console.log(`[OpsPilot Startup Validation] ✅ Embedding Provider: ${embCheck.provider} (Model: ${process.env.EMBEDDING_MODEL || "default"}, Dim: ${process.env.EMBEDDING_DIM || "768"})`);
  }
}

/**
 * Returns the configured LanguageModel for chat.
 * Supported providers: google, anthropic, openai, ollama
 */
export function getChatModel(): any {
  const check = validateChatEnv();
  if (!check.valid) {
    throw new Error(check.message || `Chat provider configuration error: missing ${check.missingVar}`);
  }

  const provider = (process.env.CHAT_PROVIDER || "anthropic").toLowerCase() as ChatProvider;

  switch (provider) {
    case "anthropic": {
      const modelName = process.env.CHAT_MODEL || "claude-haiku-5-5";
      const client = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
      });
      return client(modelName);
    }

    case "openai": {
      const modelName = process.env.CHAT_MODEL || "gpt-4o-mini";
      const client = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });
      return client(modelName);
    }

    case "ollama": {
      const modelName = process.env.CHAT_MODEL || "llama3";
      const client = createOllama({
        baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
      });
      return client(modelName);
    }

    case "google":
    default: {
      const modelName = process.env.CHAT_MODEL || "gemini-2.0-flash";
      const client = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
      });
      return client(modelName);
    }
  }
}

/**
 * Returns the configured EmbeddingModel for vector search.
 * Supported providers: google, voyage, openai, ollama.
 * (Anthropic is rejected as it offers no embedding model).
 */
export function getEmbeddingModel(): any {
  const check = validateEmbeddingEnv();
  if (!check.valid) {
    throw new Error(check.message || `Embedding provider configuration error: missing ${check.missingVar}`);
  }

  const rawProvider = (process.env.EMBEDDING_PROVIDER || "google").toLowerCase();
  const dim = parseInt(process.env.EMBEDDING_DIM || "768", 10);

  if (rawProvider === "anthropic") {
    throw new Error(
      "Anthropic does not offer an embedding model and cannot be used for embeddings. Please set EMBEDDING_PROVIDER to google, voyage, openai, or ollama."
    );
  }

  const provider = rawProvider as EmbeddingProvider;

  switch (provider) {
    case "voyage": {
      const modelName = process.env.EMBEDDING_MODEL || "voyage-3";
      const client = createVoyage({
        apiKey: process.env.VOYAGE_API_KEY,
        baseURL: process.env.VOYAGE_BASE_URL,
      });
      return client.textEmbeddingModel(modelName);
    }

    case "openai": {
      const modelName = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
      const client = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });
      return client.textEmbeddingModel(modelName);
    }

    case "ollama": {
      const modelName = process.env.EMBEDDING_MODEL || "nomic-embed-text";
      const client = createOllama({
        baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
      });
      return client.textEmbeddingModel(modelName);
    }

    case "google":
    default: {
      const modelName = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
      const client = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
      });
      // Pass outputDimensionality to match EMBEDDING_DIM as specified
      return client.textEmbeddingModel(modelName, {
        outputDimensionality: dim,
      });
    }
  }
}

// Run initial validation on module load to warn immediately if an env var is missing
validateProviderEnv();
