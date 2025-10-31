import { GoogleGenerativeAI } from "@google/generative-ai";

const googleai = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

export class Assistant {
  #chat;
  #isConnected = false;
  #connectionCheckInterval = null;

  constructor(model = "gemini-2.0-flash") {
    const gemini = googleai.getGenerativeModel({ model });
    this.#chat = gemini.startChat({ history: [] });
    this.startConnectionMonitoring();
  }

  // Check if we have internet connection
  async checkInternetConnection() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      return false;
    }
  }

  // Check if API is responding
  async checkAPIHealth() {
    try {
      // Simple API health check - you might need to adjust this based on Google AI API
      const testResult = await this.#chat.sendMessage("Hello");
      return !!testResult?.response?.text;
    } catch (error) {
      return false;
    }
  }

  // Monitor connection status
  async checkOverallConnection() {
    const hasInternet = await this.checkInternetConnection();
    if (hasInternet) {
      const apiHealthy = await this.checkAPIHealth();
      this.#isConnected = hasInternet && apiHealthy;
    } else {
      this.#isConnected = false;
    }
    return this.#isConnected;
  }

  // Start monitoring connection
  startConnectionMonitoring() {
    // Check immediately
    this.checkOverallConnection();
    
    // Check every 30 seconds
    this.#connectionCheckInterval = setInterval(() => {
      this.checkOverallConnection();
    }, 30000);
  }

  // Stop monitoring
  stopConnectionMonitoring() {
    if (this.#connectionCheckInterval) {
      clearInterval(this.#connectionCheckInterval);
      this.#connectionCheckInterval = null;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.#isConnected;
  }

  async chat(content) {
    if (!this.#isConnected) {
      throw new Error("No internet connection or API unavailable");
    }

    try {
      const result = await this.#chat.sendMessage(content);
      return result.response.text();
    } catch (error) {
      // Update connection status on error
      await this.checkOverallConnection();
      throw error;
    }
  }

  async *chatStream(content, messages, signal) {
    if (!this.#isConnected) {
      throw new Error("No internet connection or API unavailable");
    }

    try {
      const result = await this.#chat.sendMessageStream(content);

      for await (const chunk of result.stream) {
        // Check if the request was aborted
        if (signal?.aborted) {
          console.log("Stream aborted - stopping generation");
          throw new DOMException("Aborted", "AbortError");
        }
        
        yield chunk.text();
      }
    } catch (error) {
      // Update connection status on error
      await this.checkOverallConnection();
      
      // If it's an abort error, re-throw it
      if (error.name === "AbortError") {
        throw error;
      }
      // Otherwise, throw the original error
      throw error;
    }
  }
}