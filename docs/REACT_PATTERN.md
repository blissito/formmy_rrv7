# ReAct Pattern Implementation Guide for Ghosty

## Overview
The ReAct (Reasoning + Acting) pattern is an industry-standard approach for building AI agents that can use multiple tools dynamically. Instead of hardcoding tool-specific logic, ReAct creates a generic loop that scales to any number of tools.

## Core Pattern

```typescript
interface ReActLoop {
  maxIterations: number;  // Prevent infinite loops (typically 3-5)
  messages: Message[];     // Conversation history
  tools: Tool[];          // Available tools
  
  async execute(userQuery: string): Promise<Response> {
    let iterations = 0;
    
    while (iterations < maxIterations) {
      // 1. REASONING: LLM decides what to do
      const decision = await llm.complete({
        messages: this.messages,
        tools: this.tools,
        tool_choice: "auto"  // Let LLM decide
      });
      
      // 2. CHECK: Did LLM call tools?
      if (decision.tool_calls) {
        // 3. ACTION: Execute all requested tools
        const results = await this.executeTools(decision.tool_calls);
        
        // 4. OBSERVATION: Add results to context
        this.messages.push(decision);  // LLM's decision
        this.messages.push(...results); // Tool results
        
        // 5. LOOP: Continue for LLM to process results
        iterations++;
        continue;
      }
      
      // 6. FINAL ANSWER: No more tools needed
      if (decision.content) {
        return {
          content: decision.content,
          toolsUsed: this.getUsedTools(),
          iterations: iterations
        };
      }
    }
    
    // Fallback if max iterations reached
    return this.generateFallbackResponse();
  }
}
```

## Key Principles

### 1. **Generic Tool Execution**
Never hardcode tool-specific logic in the main loop:

```typescript
// ❌ BAD: Hardcoded tool logic
if (toolCall.name === "web_search") {
  // Special handling for web search
} else if (toolCall.name === "database_query") {
  // Special handling for database
}

// ✅ GOOD: Generic execution
const toolResult = await this.toolRegistry.execute(toolCall);
```

### 2. **Tool Registry Pattern**
Maintain a registry of available tools:

```typescript
class ToolRegistry {
  private tools = new Map<string, Tool>();
  
  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }
  
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);
    if (!tool) throw new Error(`Unknown tool: ${toolCall.name}`);
    
    return await tool.execute(toolCall.arguments);
  }
}
```

### 3. **Parallel Tool Execution**
OpenAI supports parallel tool calls for efficiency:

```typescript
// Execute multiple tools in parallel when possible
const toolResults = await Promise.all(
  toolCalls.map(call => this.executeToolSafely(call))
);
```

### 4. **State Management**
Track state across iterations:

```typescript
interface ReActState {
  iterations: number;
  toolsUsed: string[];
  totalTokens: number;
  sources: any[];
  metadata: Map<string, any>;
}
```

## Implementation for Ghosty

### Current Issues
1. Hardcoded "web_search" handling
2. Fixed 2-iteration pattern
3. No support for tool chaining
4. Tight coupling between tools and orchestration

### Recommended Refactor

```typescript
// app/services/agentOrchestrator.server.ts
export class AgentOrchestrator {
  private toolRegistry: ToolRegistry;
  private maxIterations = 5;
  
  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.registerDefaultTools();
  }
  
  private registerDefaultTools() {
    // Register all available tools
    this.toolRegistry.register(new WebSearchTool());
    this.toolRegistry.register(new DatabaseTool());
    this.toolRegistry.register(new EmailTool());
    // Easy to add more tools without changing orchestration logic
  }
  
  async process(message: string, context: Context): Promise<Response> {
    const state = new ReActState();
    const messages = [...context.history];
    
    // Add user message
    messages.push({ role: "user", content: message });
    
    while (state.iterations < this.maxIterations) {
      // Call LLM with current context
      const response = await this.callLLM(messages, {
        tools: this.toolRegistry.getToolDefinitions(),
        stream: state.iterations > 0 && !response.tool_calls
      });
      
      if (response.tool_calls) {
        // Execute tools and continue loop
        const results = await this.executeTools(response.tool_calls);
        messages.push(response);
        messages.push(...results);
        state.recordToolUse(response.tool_calls);
      } else if (response.content) {
        // Final answer
        return {
          content: response.content,
          state: state.toJSON()
        };
      }
      
      state.iterations++;
    }
    
    // Max iterations reached
    return this.handleMaxIterations(state);
  }
}
```

## Advanced Patterns

### 1. **Tool Chaining**
Some tools may depend on outputs from others:

```typescript
// Tool can specify dependencies
class DataVisualizationTool extends Tool {
  dependencies = ["database_query"];  // Needs data first
}
```

### 2. **Conditional Tools**
Enable/disable tools based on context:

```typescript
getAvailableTools(context: Context): Tool[] {
  return this.tools.filter(tool => 
    tool.isAvailable(context)
  );
}
```

### 3. **Tool Priorities**
Suggest tool order to the LLM:

```typescript
// In system prompt
"When multiple data sources are needed, prefer this order:
1. Check local cache first
2. Query database
3. Search web as last resort"
```

## Common Pitfalls to Avoid

1. **Infinite Loops**: Always set max iterations
2. **Token Explosion**: Track token usage across iterations
3. **Tool Conflicts**: Handle tools that might interfere with each other
4. **Error Handling**: Tools should fail gracefully
5. **Context Loss**: Maintain full conversation history

## Monitoring and Debugging

```typescript
// Log each iteration for debugging
console.log(`[ReAct] Iteration ${state.iterations}/${this.maxIterations}`);
console.log(`[ReAct] Tools used: ${state.toolsUsed.join(', ')}`);
console.log(`[ReAct] Tokens: ${state.totalTokens}`);
```

## Resources for Further Learning

1. **ReAct Paper**: [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
2. **LangChain ReAct**: [LangChain's implementation](https://python.langchain.com/docs/modules/agents/agent_types/react)
3. **OpenAI Function Calling**: [Official docs](https://platform.openai.com/docs/guides/function-calling)
4. **LangGraph**: Modern graph-based agent orchestration
5. **Microsoft Autogen**: Multi-agent orchestration patterns

## Testing Strategy

```typescript
describe('ReAct Orchestrator', () => {
  it('should handle single tool call', async () => {
    // Test single iteration with one tool
  });
  
  it('should chain multiple tools', async () => {
    // Test multiple iterations with tool dependencies
  });
  
  it('should respect max iterations', async () => {
    // Test loop termination
  });
  
  it('should handle parallel tool calls', async () => {
    // Test parallel execution when possible
  });
});
```

## Migration Path from Current Implementation

1. **Phase 1**: Extract tool execution to registry (keep current flow)
2. **Phase 2**: Implement generic loop (test with existing tools)
3. **Phase 3**: Add new tools without changing orchestrator
4. **Phase 4**: Enable parallel tool execution
5. **Phase 5**: Add advanced features (priorities, dependencies)

This pattern is used by:
- Claude (Anthropic) - What I use internally
- GPT-4 (OpenAI) - Via function calling
- Gemini (Google) - Via function declarations
- LangChain/LangGraph - Industry standard frameworks
- AutoGPT/BabyAGI - Autonomous agent systems