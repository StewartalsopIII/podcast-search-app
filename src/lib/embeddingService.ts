import OpenAI from 'openai';

// Embedding Service Interface
export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  getDimension(): number;
}

// OpenAI Embedding Service Implementation
export class OpenAIEmbeddingService implements EmbeddingService {
  private client: OpenAI;
  private model = 'text-embedding-3-small';
  private dimension = 1536;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text.trim(),
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating OpenAI embedding:', error);
      throw new Error('Failed to generate embedding with OpenAI');
    }
  }

  getDimension(): number {
    return this.dimension;
  }
}

// BGE API Embedding Service Implementation
export class BGEAPIEmbeddingService implements EmbeddingService {
  private apiEndpoint: string;
  private apiToken: string;
  private dimension = 768; // bge-base-en-v1.5 dimension

  constructor() {
    if (!process.env.BGE_API_ENDPOINT_URL) {
      throw new Error('BGE_API_ENDPOINT_URL environment variable is not set');
    }
    
    if (!process.env.BGE_API_TOKEN) {
      throw new Error('BGE_API_TOKEN environment variable is not set');
    }
    
    this.apiEndpoint = process.env.BGE_API_ENDPOINT_URL;
    this.apiToken = process.env.BGE_API_TOKEN;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inputs: text.trim() 
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      
      // The exact structure depends on the API response format
      // Assuming the response contains the embedding vector directly
      if (Array.isArray(result) && result.length > 0) {
        // For HuggingFace Inference Endpoints, the response is often an array of arrays
        // where the first array contains the embedding for the first input
        return Array.isArray(result[0]) ? result[0] : result;
      } 
      // Alternative for different API response structures
      else if (result.embeddings && Array.isArray(result.embeddings)) {
        return result.embeddings[0];
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (error) {
      console.error('Error generating BGE embedding:', error);
      throw new Error('Failed to generate embedding with BGE API');
    }
  }

  getDimension(): number {
    return this.dimension;
  }
}

// Factory function to get the configured embedding service
export function getEmbeddingService(): EmbeddingService {
  const provider = process.env.EMBEDDING_PROVIDER || 'openai';
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIEmbeddingService();
    case 'bge':
      return new BGEAPIEmbeddingService();
    default:
      console.warn(`Unknown embedding provider '${provider}', defaulting to OpenAI`);
      return new OpenAIEmbeddingService();
  }
}

// Utility to get the current embedding dimension based on configuration
export function getEmbeddingDimension(): number {
  return parseInt(process.env.EMBEDDING_DIMENSION || '1536', 10);
}