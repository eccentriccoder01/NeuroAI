import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export class Assistant {
  #client;
  #model;

  constructor(model = "gpt-4o-mini", client = openai) {
    this.#client = client;
    this.#model = model;
  }

  async chat(content, history, signal) {
    try {
      const result = await this.#client.chat.completions.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
      }, {
        signal, // Pass abort signal to OpenAI SDK
      });

      return result.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  }

  async *chatStream(content, history, signal) {
    try {
      const result = await this.#client.chat.completions.create({
        model: this.#model,
        messages: [...history, { content, role: "user" }],
        stream: true,
      }, {
        signal, // Pass abort signal to OpenAI SDK
      });

      for await (const chunk of result) {
        // Check if the request was aborted
        if (signal?.aborted) {
          console.log("Stream aborted - stopping generation");
          throw new DOMException("Aborted", "AbortError");
        }
        
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      // If it's an abort error, re-throw it
      if (error.name === "AbortError") {
        throw error;
      }
      // Otherwise, throw the original error
      throw error;
    }
  }
}