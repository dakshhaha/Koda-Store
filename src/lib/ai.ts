import { GEMINI_TOOLS, executeTool } from "@/lib/ai-tools";

export type AIProviderName = "gemini" | "openrouter" | "openai" | "claude" | "grok";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProvider {
  name: string;
  chat: (messages: ChatMessage[], userId?: string) => Promise<string>;
}

// =============================================================================
// GEMINI PROVIDER (with tool calling)
// =============================================================================
export class GeminiProvider implements AIProvider {
  name = "gemini";

  async chat(messages: ChatMessage[], userId?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const systemMessage = messages.find(m => m.role === "system");
    const chatMessages = messages.filter(m => m.role !== "system");

    const contents = chatMessages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const body: Record<string, unknown> = {
      contents,
      tools: GEMINI_TOOLS,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) return "No response received";

    // Check if the model wants to call a tool
    const parts = candidate.content?.parts || [];
    const functionCalls = parts.filter((p: Record<string, unknown>) => p.functionCall);

    if (functionCalls.length > 0) {
      // Execute all tool calls
      const toolResults = [];
      for (const fc of functionCalls) {
        const call = fc.functionCall as { name: string; args: Record<string, unknown> };
        console.log(`🔧 AI calling tool: ${call.name}`, call.args);
        const result = await executeTool(call.name, call.args || {}, userId);
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result },
          },
        });
      }

      // Send tool results back to the model for a natural language response
      const followUpContents = [
        ...contents,
        { role: "model", parts: functionCalls },
        { role: "user", parts: toolResults },
      ];

      const followUpBody: Record<string, unknown> = {
        contents: followUpContents,
        tools: GEMINI_TOOLS,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      };

      if (systemMessage) {
        followUpBody.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }

      const followUpResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(followUpBody),
        }
      );

      if (!followUpResponse.ok) {
        console.error("Gemini follow-up error:", await followUpResponse.text());
        // Return tool results as formatted text as fallback
        return toolResults.map(tr => tr.functionResponse.response.result).join("\n");
      }

      const followUpData = await followUpResponse.json();
      return followUpData.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
    }

    // No tool calls — return text directly
    return parts.find((p: Record<string, unknown>) => p.text)?.text || "No response received";
  }
}

// =============================================================================
// OPENROUTER PROVIDER
// =============================================================================
export class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  async chat(messages: ChatMessage[]) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://koda-store.com",
        "X-Title": "Koda Store",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        messages: messages,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received from OpenRouter";
  }
}

// =============================================================================
// CLAUDE PROVIDER
// =============================================================================
export class ClaudeProvider implements AIProvider {
  name = "claude";
  async chat(messages: ChatMessage[]) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: messages.filter(m => m.role !== "system"),
        system: messages.find(m => m.role === "system")?.content || "You are Koda Store Assistant.",
      }),
    });
    const data = await response.json();
    return data.content[0].text;
  }
}

// =============================================================================
// ROBUST PROVIDER (FALLBACK LOGIC)
// =============================================================================
export class RobustAIProvider implements AIProvider {
  name = "robust-multi-provider";
  private gemini = new GeminiProvider();
  private openRouter = new OpenRouterProvider();

  async chat(messages: ChatMessage[], userId?: string) {
    // 1. Try Gemini first (with tool calling)
    try {
      console.log("Attempting chat with Gemini (tool-calling)...");
      return await this.gemini.chat(messages, userId);
    } catch (geminiError) {
      console.error("Gemini failed, falling back to OpenRouter:", geminiError);

      // 2. Try OpenRouter with preferred model
      try {
        console.log("Attempting chat with OpenRouter (primary)...");
        return await this.openRouter.chat(messages);
      } catch (openRouterError) {
        console.error("OpenRouter primary failed, falling back to OpenRouter (free):", openRouterError);

        // 3. Try OpenRouter with a free/cheap model as last resort
        try {
          const apiKey = process.env.OPENROUTER_API_KEY;
          if (!apiKey) throw new Error("No OpenRouter API key for fallback");

          console.log("Attempting chat with OpenRouter (free fallback)...");
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://koda-store.com",
              "X-Title": "Koda Store",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-lite-preview-02-05:free",
              messages: messages,
            }),
          });
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) throw new Error("Free model fallback failed to return content");
          return content;
        } catch (ultimateError) {
          console.error("AI service is completely unavailable:", ultimateError);
          return "I'm sorry, all my neural circuits are currently busy. Please try again in 30 seconds.";
        }
      }
    }
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================
export function getAIProvider(name?: AIProviderName): AIProvider {
  const providerName = name || (process.env.ACTIVE_AI_PROVIDER as AIProviderName);

  if (!providerName || providerName === "gemini") {
    return new RobustAIProvider();
  }

  switch (providerName) {
    case "openrouter": return new OpenRouterProvider();
    case "claude": return new ClaudeProvider();
    case "openai": return new GeminiProvider(); // Map missing to something
    default: return new RobustAIProvider();
  }
}

export const SUPPORTED_AI_PROVIDERS: AIProviderName[] = ["gemini", "openrouter", "openai", "claude", "grok"];
