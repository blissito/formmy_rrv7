import {
  ConversationStatus,
  MessageRole,
  type Conversation,
  type Message,
} from "@prisma/client";
import { db } from "~/utils/db.server";
import { getMessagesByConversationId } from "./messageModel.server";

/**
 * Interface for conversation export options
 */
export interface ConversationExportOptions {
  chatbotId: string;
  format: "csv" | "json";
  startDate?: Date;
  endDate?: Date;
  includeMessages?: boolean;
}

/**
 * Interface for exported conversation data
 */
export interface ExportedConversation {
  id: string;
  sessionId: string;
  visitorIp?: string | null;
  visitorId?: string | null;
  status: ConversationStatus;
  startedAt: Date;
  endedAt?: Date | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  messages?: ExportedMessage[];
}

/**
 * Interface for exported message data
 */
export interface ExportedMessage {
  id: string;
  content: string;
  role: MessageRole;
  tokens?: number | null;
  responseTime?: number | null;
  createdAt: Date;
}

/**
 * Error class for export errors
 */
export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportError";
  }
}

/**
 * Fetches conversations for export with optional date filtering
 */
async function fetchConversationsForExport(
  chatbotId: string,
  startDate?: Date,
  endDate?: Date,
  includeMessages: boolean = true
): Promise<ExportedConversation[]> {
  // Build the where clause with date filters if provided
  const where: any = { chatbotId };

  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      where.createdAt.gte = startDate;
    }

    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // Fetch conversations
  const conversations = await db.conversation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // If no messages are needed, return conversations as is
  if (!includeMessages) {
    return conversations as ExportedConversation[];
  }

  // Fetch messages for each conversation
  const exportedConversations: ExportedConversation[] = [];

  for (const conversation of conversations) {
    const messages = await getMessagesByConversationId(conversation.id);

    exportedConversations.push({
      ...conversation,
      messages: messages.map((message) => ({
        id: message.id,
        content: message.content,
        role: message.role,
        tokens: message.tokens,
        responseTime: message.responseTime,
        createdAt: message.createdAt,
      })),
    });
  }

  return exportedConversations;
}

/**
 * Exports conversations to JSON format
 */
export async function exportConversationsToJSON(
  options: ConversationExportOptions
): Promise<string> {
  try {
    const { chatbotId, startDate, endDate, includeMessages = true } = options;

    const conversations = await fetchConversationsForExport(
      chatbotId,
      startDate,
      endDate,
      includeMessages
    );

    return JSON.stringify(conversations, null, 2);
  } catch (error) {
    throw new ExportError(
      `Failed to export conversations to JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Converts a value to a CSV-safe string
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains a comma, newline, or double quote, wrap it in double quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    // Replace double quotes with two double quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date for CSV export
 */
function formatDateForCSV(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString();
}

/**
 * Exports conversations to CSV format
 */
export async function exportConversationsToCSV(
  options: ConversationExportOptions
): Promise<string> {
  try {
    const { chatbotId, startDate, endDate, includeMessages = true } = options;

    const conversations = await fetchConversationsForExport(
      chatbotId,
      startDate,
      endDate,
      includeMessages
    );

    // If there are no conversations, return empty CSV with headers
    if (conversations.length === 0) {
      return "id,sessionId,visitorIp,visitorId,status,startedAt,endedAt,messageCount,createdAt,updatedAt\n";
    }

    // Generate CSV for conversations
    let csv =
      "id,sessionId,visitorIp,visitorId,status,startedAt,endedAt,messageCount,createdAt,updatedAt\n";

    for (const conv of conversations) {
      csv +=
        [
          escapeCSV(conv.id),
          escapeCSV(conv.sessionId),
          escapeCSV(conv.visitorIp),
          escapeCSV(conv.visitorId),
          escapeCSV(conv.status),
          formatDateForCSV(conv.startedAt),
          formatDateForCSV(conv.endedAt),
          escapeCSV(conv.messageCount),
          formatDateForCSV(conv.createdAt),
          formatDateForCSV(conv.updatedAt),
        ].join(",") + "\n";
    }

    // If messages are included, add a separator and message data
    if (
      includeMessages &&
      conversations.some((c) => c.messages && c.messages.length > 0)
    ) {
      csv += "\n# MESSAGES\n";
      csv +=
        "conversationId,messageId,role,content,tokens,responseTime,createdAt\n";

      for (const conv of conversations) {
        if (!conv.messages) continue;

        for (const msg of conv.messages) {
          csv +=
            [
              escapeCSV(conv.id),
              escapeCSV(msg.id),
              escapeCSV(msg.role),
              escapeCSV(msg.content),
              escapeCSV(msg.tokens),
              escapeCSV(msg.responseTime),
              formatDateForCSV(msg.createdAt),
            ].join(",") + "\n";
        }
      }
    }

    return csv;
  } catch (error) {
    throw new ExportError(
      `Failed to export conversations to CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Main export function that handles both formats
 */
export async function exportConversations(
  options: ConversationExportOptions
): Promise<string> {
  const { format } = options;

  switch (format) {
    case "json":
      return exportConversationsToJSON(options);
    case "csv":
      return exportConversationsToCSV(options);
    default:
      throw new ExportError(`Unsupported export format: ${format}`);
  }
}
