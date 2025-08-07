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

export { 
  UnifiedWebSearchService,
  getUnifiedWebSearchService
} from './webSearchUnified.server';
export { 
  WebSearchBetaService,
  getWebSearchBetaService
} from './webSearchBeta.server';
export { 
  GoogleCustomSearchService,
  getGoogleCustomSearchService
} from './webSearchGoogle.server';

export * from './types';