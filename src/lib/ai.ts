import { GEMINI_TOOLS, executeTool } from "@/lib/ai-tools";

export type AIProviderName = "gemini" | "openrouter" | "openai" | "claude" | "grok";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProvider {
  name: string;
  chat: (messages: ChatMessage[], userId?: string) => Promise<string>;
  chatStream: (messages: ChatMessage[], userId?: string) => Promise<ReadableStream>;
}

// =============================================================================
// GEMINI PROVIDER (with tool calling & streaming)
// =============================================================================
export class GeminiProvider implements AIProvider {
  name = "gemini";

  async chat(messages: ChatMessage[], userId?: string) {
    // Current non-streaming implementation remains for backward compatibility
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) return "No response received";

    const parts = candidate.content?.parts || [];
    const functionCalls = parts.filter((p: Record<string, unknown>) => p.functionCall);

    if (functionCalls.length > 0) {
      const toolResults = [];
      for (const fc of functionCalls) {
        const call = fc.functionCall as { name: string; args: Record<string, unknown> };
        const result = await executeTool(call.name, call.args || {}, userId);
        toolResults.push({ functionResponse: { name: call.name, response: { result } } });
      }

      const followUpResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [...contents, { role: "model", parts: functionCalls }, { role: "user", parts: toolResults }],
            tools: GEMINI_TOOLS,
            systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
          }),
        }
      );
      const followUpData = await followUpResponse.json();
      return followUpData.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
    }

    return parts.find((p: Record<string, unknown>) => p.text)?.text || "No response received";
  }

  async chatStream(messages: ChatMessage[], userId?: string): Promise<ReadableStream> {
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    // Streaming using streamGenerateContent
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) throw new Error(`Gemini Stream error: ${response.status}`);

    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });
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
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        messages: messages,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received";
  }

  async chatStream(messages: ChatMessage[]): Promise<ReadableStream> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter Stream error: ${response.status}`);

    return new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") {
                  controller.close();
                  return;
                }
                try {
                  const data = JSON.parse(dataStr);
                  const text = data.choices?.[0]?.delta?.content;
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch (e) {}
              }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });
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

  async chatStream(messages: ChatMessage[]): Promise<ReadableStream> {
    // Basic Claude streaming implementation (simplified)
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
        stream: true,
      }),
    });

    return response.body || new ReadableStream({ start(c) { c.close(); } });
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
    try {
      return await this.gemini.chat(messages, userId);
    } catch (e) {
      return await this.openRouter.chat(messages);
    }
  }

  async chatStream(messages: ChatMessage[], userId?: string): Promise<ReadableStream> {
    try {
      return await this.gemini.chatStream(messages, userId);
    } catch (e) {
      console.warn("Gemini stream failed, falling back to OpenRouter stream.");
      try {
        return await this.openRouter.chatStream(messages);
      } catch (e2) {
        // Fallback to a simple readable stream that says error
        return new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("I'm sorry, I encountered an error connecting to my AI core. Please try again soon."));
            controller.close();
          }
        });
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
    case "openai": return new GeminiProvider(); 
    default: return new RobustAIProvider();
  }
}

export const SUPPORTED_AI_PROVIDERS: AIProviderName[] = ["gemini", "openrouter", "openai", "claude", "grok"];
