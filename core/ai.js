import OpenAI from 'openai';
import { logger } from './logger.js';

export class AIService {
  constructor(config) {
    this.config = config;
    
    const aiConfig = config.ai || {};
    const apiKey = process.env.DOCPKG_API_KEY || process.env.OPENAI_API_KEY || aiConfig.apiKey;
    const baseURL = process.env.DOCPKG_API_BASE || aiConfig.baseURL; // Optional, for Ollama etc.
    
    if (!apiKey && !baseURL) {
        // Allow instantiation without key, but methods will fail/warn
        this.client = null;
    } else {
        this.client = new OpenAI({
            apiKey: apiKey || 'dummy', // Ollama might not need a key
            baseURL: baseURL,
            dangerouslyAllowBrowser: true // Not browser, but suppresses some warnings in odd envs
        });
    }
    
    this.model = process.env.DOCPKG_MODEL || aiConfig.model || 'gpt-4o-mini';
  }

  isConfigured() {
      return !!this.client;
  }

  async analyzeDoc(content) {
    if (!this.client) {
        throw new Error('AI Service not configured. Set OPENAI_API_KEY or configure docpkg.json.');
    }

    // Prompt for summarization and tagging
    const prompt = `
You are a technical documentation assistant. Analyze the following documentation content.
Return a JSON object with:
1. "summary": A concise summary of the document (max 50 words).
2. "tags": An array of 3-5 relevant semantic tags (lowercase, kebab-case).
3. "sections": An array of objects with "title" and "summary" for major sections if they exist.

Content:
${content.substring(0, 15000)} 
`; // Truncate to avoid massive context costs for now

    try {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const result = response.choices[0].message.content;
        return JSON.parse(result);
    } catch (error) {
        logger.error(`AI Analysis failed: ${error.message}`);
        throw error;
    }
  }
}
