/**
 * @formmy.app/react - Type definitions
 */
export interface FormmyConfig {
    /** Publishable key for frontend (pk_live_xxx) */
    publishableKey?: string;
    /** Secret key for backend (sk_live_xxx) */
    secretKey?: string;
    /** Base URL for Formmy API (default: https://formmy.app) */
    baseUrl?: string;
}
export interface FormmyProviderProps extends FormmyConfig {
    children: React.ReactNode;
}
export interface UseFormmyChatOptions {
    /** Agent ID to chat with */
    agentId: string;
    /** Initial messages to load */
    initialMessages?: Message[];
    /** Existing conversation ID to continue */
    conversationId?: string;
    /** Called when a new message is received */
    onMessage?: (message: Message) => void;
    /** Called on error */
    onError?: (error: Error) => void;
    /** Called when streaming finishes */
    onFinish?: () => void;
}
export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content?: string;
    parts?: MessagePart[];
    createdAt?: Date;
}
export type MessagePart = {
    type: "text";
    text: string;
} | {
    type: string;
    toolCallId: string;
    toolName: string;
    args: unknown;
    output?: unknown;
};
export interface Agent {
    id: string;
    name: string;
    slug: string;
    aiModel: string;
    instructions?: string;
    welcomeMessage?: string;
    customInstructions?: string;
    status: "ACTIVE" | "INACTIVE" | "DELETED";
    createdAt: string;
    updatedAt?: string;
}
export interface CreateAgentInput {
    name: string;
    instructions?: string;
    welcomeMessage?: string;
    model?: string;
}
export interface UpdateAgentInput {
    name?: string;
    instructions?: string;
    welcomeMessage?: string;
    customInstructions?: string;
    model?: string;
}
export interface ChatBubbleProps {
    /** Agent ID to chat with */
    agentId: string;
    /** Position of the bubble trigger */
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    /** Theme customization */
    theme?: ChatTheme;
    /** Initial open state */
    defaultOpen?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
}
export interface ChatTheme {
    /** Primary color for buttons and accents */
    primaryColor?: string;
    /** Background color for the chat panel */
    backgroundColor?: string;
    /** Text color */
    textColor?: string;
    /** Border radius for the panel */
    borderRadius?: string;
}
export interface ConversationSummary {
    id: string;
    sessionId: string;
    name?: string;
    status: "ACTIVE" | "COMPLETED" | "TIMEOUT";
    messageCount: number;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ConversationMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    parts?: object[];
    createdAt: string;
}
export interface ConversationDetail extends ConversationSummary {
    messages: ConversationMessage[];
}
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    code?: string;
}
export interface AgentsListResponse {
    agents: Agent[];
}
export interface AgentResponse {
    agent: Agent;
}
export interface ConversationsListResponse {
    conversations: ConversationSummary[];
    pagination: {
        hasMore: boolean;
        nextCursor: string | null;
    };
}
export interface ConversationResponse {
    conversation: ConversationDetail;
}
//# sourceMappingURL=types.d.ts.map