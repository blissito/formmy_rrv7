/**
 * Google Search Console API Service
 * Provides SEO metrics and insights for chatbots with public URLs
 */

export interface SearchConsoleMetrics {
  property: string;
  period: {
    start: Date;
    end: Date;
  };
  performance: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export class SearchConsoleService {
  private apiKey: string;
  private accessToken?: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('GOOGLE_SEARCH_CONSOLE_API_KEY not found. SEO metrics will be unavailable.');
    }
  }

  /**
   * Sets OAuth access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Gets Search Console performance data for a property
   */
  async getPerformanceData(
    siteUrl: string,
    startDate: Date,
    endDate: Date
  ): Promise<SearchConsoleMetrics> {
    if (!this.apiKey) {
      throw new Error('Google Search Console API key not configured');
    }

    const propertyUrl = this.normalizePropertyUrl(siteUrl);
    
    try {
      // Prepare the request body
      const requestBody = {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        dimensions: ['query', 'page'],
        rowLimit: 1000,
        startRow: 0
      };

      const response = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken || this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search Console API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      return this.processSearchConsoleData(data, siteUrl, startDate, endDate);

    } catch (error) {
      console.error('Error fetching Search Console data:', error);
      
      // Return empty metrics on error
      return {
        property: siteUrl,
        period: { start: startDate, end: endDate },
        performance: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        queries: [],
        pages: [],
      };
    }
  }

  /**
   * Gets quick SEO stats for a chatbot URL
   */
  async getQuickSEOStats(siteUrl: string): Promise<{
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    try {
      const metrics = await this.getPerformanceData(siteUrl, startDate, endDate);
      
      return {
        clicks: metrics.performance.clicks,
        impressions: metrics.performance.impressions,
        ctr: metrics.performance.ctr,
        avgPosition: metrics.performance.position,
      };
    } catch (error) {
      console.error('Error getting quick SEO stats:', error);
      return { clicks: 0, impressions: 0, ctr: 0, avgPosition: 0 };
    }
  }

  /**
   * Normalizes property URL for Search Console API
   */
  private normalizePropertyUrl(url: string): string {
    // Ensure URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Remove trailing slash
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }

    return url;
  }

  /**
   * Formats date for Search Console API (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Processes raw Search Console API response
   */
  private processSearchConsoleData(
    data: any,
    property: string,
    start: Date,
    end: Date
  ): SearchConsoleMetrics {
    const rows = data.rows || [];
    
    // Aggregate totals
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalPosition = 0;
    
    const queries: Map<string, any> = new Map();
    const pages: Map<string, any> = new Map();

    rows.forEach((row: any) => {
      const [query, page] = row.keys;
      const { clicks, impressions, ctr, position } = row;

      totalClicks += clicks;
      totalImpressions += impressions;
      totalPosition += position;

      // Aggregate by query
      if (!queries.has(query)) {
        queries.set(query, { query, clicks: 0, impressions: 0, ctr: 0, position: 0 });
      }
      const queryData = queries.get(query);
      queryData.clicks += clicks;
      queryData.impressions += impressions;
      queryData.ctr = queryData.impressions > 0 ? (queryData.clicks / queryData.impressions) * 100 : 0;
      queryData.position = (queryData.position + position) / 2; // Simple average

      // Aggregate by page
      if (!pages.has(page)) {
        pages.set(page, { page, clicks: 0, impressions: 0, ctr: 0, position: 0 });
      }
      const pageData = pages.get(page);
      pageData.clicks += clicks;
      pageData.impressions += impressions;
      pageData.ctr = pageData.impressions > 0 ? (pageData.clicks / pageData.impressions) * 100 : 0;
      pageData.position = (pageData.position + position) / 2; // Simple average
    });

    const avgPosition = rows.length > 0 ? totalPosition / rows.length : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      property,
      period: { start, end },
      performance: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: Math.round(overallCTR * 100) / 100,
        position: Math.round(avgPosition * 100) / 100,
      },
      queries: Array.from(queries.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10), // Top 10 queries
      pages: Array.from(pages.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10), // Top 10 pages
    };
  }

  /**
   * Test if Search Console API is properly configured
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured'
      };
    }

    try {
      // Try to list sites - this requires minimal permissions
      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken || this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${await response.text()}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Factory function
export function getSearchConsoleService(): SearchConsoleService {
  return new SearchConsoleService();
}