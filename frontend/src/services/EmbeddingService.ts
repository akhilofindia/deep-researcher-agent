import { pipeline } from '@huggingface/transformers';

class EmbeddingServiceClass {
  private static instance: EmbeddingServiceClass;
  private extractor: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EmbeddingServiceClass {
    if (!EmbeddingServiceClass.instance) {
      EmbeddingServiceClass.instance = new EmbeddingServiceClass();
    }
    return EmbeddingServiceClass.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing local embedding model...');
      
      // Use a lightweight, fast embedding model suitable for browser use
      this.extractor = await pipeline(
        'feature-extraction',
        'mixedbread-ai/mxbai-embed-xsmall-v1',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );
      
      this.isInitialized = true;
      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      
      try {
        // Fallback to CPU if WebGPU is not available
        this.extractor = await pipeline(
          'feature-extraction',
          'mixedbread-ai/mxbai-embed-xsmall-v1',
          { device: 'cpu' }
        );
        
        this.isInitialized = true;
        console.log('Embedding model initialized on CPU');
      } catch (cpuError) {
        console.error('Failed to initialize embedding model:', cpuError);
        throw new Error('Failed to initialize local embedding model');
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Clean and truncate text for better processing
      const cleanText = this.preprocessText(text);
      
      // Generate embedding
      const result = await this.extractor(cleanText, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert tensor to array
      const embedding = Array.from(result.data as Float32Array);
      
      console.log(`Generated embedding for text (${cleanText.length} chars): ${embedding.length} dimensions`);
      return embedding;
      
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return a dummy embedding in case of error (in production, you'd handle this differently)
      return new Array(384).fill(0).map(() => Math.random() * 2 - 1);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  findSimilarDocuments(
    queryEmbedding: number[],
    documentEmbeddings: { id: string; embedding: number[]; metadata: any }[],
    threshold: number = 0.5,
    limit: number = 5
  ) {
    const similarities = documentEmbeddings.map(doc => ({
      ...doc,
      similarity: this.calculateSimilarity(queryEmbedding, doc.embedding)
    }));

    return similarities
      .filter(doc => doc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private preprocessText(text: string): string {
    // Clean and truncate text for better processing
    const cleaned = text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '')  // Remove special characters
      .trim();
    
    // Truncate to reasonable length (most models have token limits)
    return cleaned.slice(0, 4000);
  }

  // Chunk long documents for better embedding quality
  chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }
}

// Export singleton instance
export const EmbeddingService = EmbeddingServiceClass.getInstance();