import {
  generateMockMarketData,
  calculateMockSentiment,
} from '../data/mock-market-intelligence';

export interface MarketIntelligenceResponse {
  company: string;
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  articleCount: number;
  headlines: Array<{
    title: string;
    source: string;
    publishedAt: string;
  }>;
  lastUpdated: string;
}

export class MarketIntelligenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketIntelligenceError';
  }
}

interface CacheEntry {
  data: MarketIntelligenceResponse;
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export class MarketIntelligenceService {
  private cache = new Map<string, CacheEntry>();

  async getMarketIntelligence(company: string): Promise<MarketIntelligenceResponse> {
    const key = company.toLowerCase();
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Simulate network delay (300–600 ms)
    await new Promise((resolve) =>
      setTimeout(resolve, 300 + Math.random() * 300)
    );

    try {
      const mockData = generateMockMarketData(company);
      const sentiment = calculateMockSentiment(mockData.headlines);

      const response: MarketIntelligenceResponse = {
        company,
        sentiment,
        articleCount: mockData.articleCount,
        headlines: mockData.headlines,
        lastUpdated: new Date().toISOString(),
      };

      this.cache.set(key, { data: response, expiresAt: Date.now() + TTL_MS });
      return response;
    } catch (err) {
      throw new MarketIntelligenceError(
        `Failed to fetch market intelligence for "${company}"`
      );
    }
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();
