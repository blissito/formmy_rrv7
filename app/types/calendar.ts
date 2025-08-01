import { Schema } from "@effect/schema";

/**
 * Represents a calendar event with all necessary fields
 */
export interface CalendarEvent {
  /** Unique identifier for the event */
  id?: string;
  
  /** Event title/summary */
  summary: string;
  
  /** Event description (optional) */
  description?: string;
  
  /** Event location (optional) */
  location?: string;
  
  /** Event start time in ISO 8601 format */
  start: string;
  
  /** Event end time in ISO 8601 format */
  end: string;
  
  /** IANA timezone string (e.g., 'America/Mexico_City') */
  timeZone: string;
  
  /** Calendar ID where the event will be created */
  calendarId?: string;
  
  /** List of attendee email addresses (optional) */
  attendees?: Array<{
    email: string;
    displayName?: string;
    optional?: boolean;
  }>;
  
  /** Whether the event is a recurring event */
  recurring?: boolean;
  
  /** Recurrence rule in RFC 5545 format (optional) */
  recurrence?: string[];
  
  /** Whether the event is private (only visible to the calendar owner) */
  private?: boolean;
  
  /** Whether the event is an all-day event */
  allDay?: boolean;
}

/**
 * Represents a time period for checking availability
 */
export interface AvailabilityWindow {
  /** Start time of the availability window in ISO 8601 format */
  start: string;
  
  /** End time of the availability window in ISO 8601 format */
  end: string;
  
  /** IANA timezone string */
  timeZone: string;
}

/**
 * Represents a busy time slot in a calendar
 */
export interface BusyTime {
  /** Start time of the busy period in ISO 8601 format */
  start: string;
  
  /** End time of the busy period in ISO 8601 format */
  end: string;
}

/**
 * Represents the result of an availability check
 */
export interface AvailabilityResult {
  /** List of time slots that are already busy */
  busy: BusyTime[];
  
  /** List of available time slots */
  availableSlots: Array<{
    start: string;
    end: string;
  }>;
  
  /** The time zone used for the availability check */
  timeZone: string;
}

/**
 * Schema for validating calendar events
 */
export const CalendarEventSchema = Schema.Struct({
  summary: Schema.String,
  description: Schema.optional(Schema.String),
  location: Schema.optional(Schema.String),
  start: Schema.String,
  end: Schema.String,
  timeZone: Schema.String,
  calendarId: Schema.optional(Schema.String),
  attendees: Schema.optional(
    Schema.Array(
      Schema.Struct({
        email: Schema.String,
        displayName: Schema.optional(Schema.String),
        optional: Schema.optional(Schema.Boolean),
      })
    )
  ),
  recurring: Schema.optional(Schema.Boolean),
  recurrence: Schema.optional(Schema.Array(Schema.String)),
  private: Schema.optional(Schema.Boolean),
  allDay: Schema.optional(Schema.Boolean),
});

/**
 * Schema for validating availability check requests
 */
export const AvailabilityWindowSchema = Schema.Struct({
  start: Schema.String,
  end: Schema.String,
  timeZone: Schema.String,
});

/**
 * Type for the intent field in the form data
 */
export type CalendarIntent = 
  | 'schedule' 
  | 'availability' 
  | 'connect' 
  | 'callback';

/**
 * Base interface for calendar operation requests
 */
export interface CalendarRequest {
  /** The operation to perform */
  intent: CalendarIntent;
  
  /** User ID for authentication/authorization */
  userId: string;
  
  /** Additional data specific to the operation */
  data?: unknown;
}

/**
 * Request for scheduling an event
 */
export interface ScheduleEventRequest extends CalendarRequest {
  intent: 'schedule';
  data: CalendarEvent;
}

/**
 * Request for checking availability
 */
export interface CheckAvailabilityRequest extends CalendarRequest {
  intent: 'availability';
  data: {
    /** Time window to check for availability */
    window: AvailabilityWindow;
    
    /** Duration of the desired event in minutes */
    durationMinutes: number;
    
    /** Optional calendar ID to check (defaults to primary calendar) */
    calendarId?: string;
  };
}

/**
 * Request for OAuth connection
 */
export interface ConnectCalendarRequest extends CalendarRequest {
  intent: 'connect';
  data: {
    /** OAuth authorization code */
    code: string;
    
    /** Redirect URI used for OAuth */
    redirectUri: string;
  };
}

/**
 * Request for OAuth callback
 */
export interface OAuthCallbackRequest extends CalendarRequest {
  intent: 'callback';
  data: {
    /** OAuth authorization code */
    code: string;
    
    /** OAuth state parameter */
    state: string;
    
    /** Redirect URI used for OAuth */
    redirect_uri: string;
  };
}

/**
 * Union type of all possible calendar requests
 */
export type CalendarOperation = 
  | ScheduleEventRequest 
  | CheckAvailabilityRequest 
  | ConnectCalendarRequest 
  | OAuthCallbackRequest;

/**
 * Response structure for successful operations
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Response structure for error conditions
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type of all possible responses
 */
export type CalendarResponse<T = unknown> = 
  | SuccessResponse<T> 
  | ErrorResponse;

/**
 * Type guard for ErrorResponse
 */
export const isErrorResponse = (
  response: CalendarResponse
): response is ErrorResponse => {
  return !response.success;
};
