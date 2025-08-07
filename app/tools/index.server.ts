export interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export interface ToolContext {
  userId?: string;
  projectId?: string;
  sessionId?: string;
  [key: string]: any;
}

export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;
  
  protected context?: ToolContext;

  setContext(context: ToolContext) {
    this.context = context;
    return this;
  }

  abstract execute(params: any): Promise<any>;
}

export { WebSearchService } from './webSearch.server';
export { 
  UnifiedWebSearchService,
  getUnifiedWebSearchService,
  cleanupUnifiedWebSearchService
} from './webSearchUnified.server';
export { 
  YahooWebSearchService,
  getYahooWebSearchService,
  cleanupYahooWebSearchService
} from './webSearchYahoo.server';
export { 
  BingWebSearchService,
  getBingWebSearchService,
  cleanupBingWebSearchService
} from './webSearchBing.server';
export { 
  PlaywrightWebSearchService, 
  getWebSearchService, 
  cleanupWebSearchService 
} from './webSearchPlaywright.server';
export { 
  PuppeteerWebSearchService, 
  getPuppeteerWebSearchService, 
  cleanupPuppeteerWebSearchService 
} from './webSearchPuppeteer.server';

export * from './types';