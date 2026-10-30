import { validateChatEnv, validateEmbeddingEnv, getEmbeddingModel, getChatModel } from "../lib/models";

console.log("================================================");
console.log("OpsPilot Model & Provider Unit Tests");
console.log("================================================");

// 1. Initial validation with current .env.local
const chatCheck = validateChatEnv();
console.log("Chat Check:", chatCheck);

const embCheck = validateEmbeddingEnv();
console.log("Embedding Check:", embCheck);

// 2. Test Anthropic embedding rejection
console.log("\n[Test] Setting EMBEDDING_PROVIDER='anthropic'");
process.env.EMBEDDING_PROVIDER = "anthropic";
try {
  getEmbeddingModel();
  console.error("❌ FAILED: Anthropic should not be accepted for embeddings!");
  process.exit(1);
} catch (e: any) {
  console.log("✅ PASSED: Anthropic rejected for embeddings with error:", e.message);
}

// 3. Test missing variable detection
console.log("\n[Test] Setting CHAT_PROVIDER='anthropic' with empty key");
process.env.CHAT_PROVIDER = "anthropic";
delete process.env.ANTHROPIC_API_KEY;
try {
  getChatModel();
  console.error("❌ FAILED: Missing key should have thrown!");
  process.exit(1);
} catch (e: any) {
  console.log("✅ PASSED: Missing key threw clear error:", e.message);
}

console.log("\n================================================");
console.log("All Model Provider Tests Passed Successfully! ✅");
console.log("================================================");
