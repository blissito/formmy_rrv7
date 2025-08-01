// ============================================================================
// Modern Calendar Service (2025 Pattern - Super Simplified)
// ============================================================================

// Modern error class with structured data (2025 pattern)
export class CalendarServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly timestamp = new Date().toISOString()
  ) {
    super(message);
    this.name = 'CalendarServiceError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// Modern error factory (2025 pattern)
export const CalendarError = {
  parseError: (message: string, details?: unknown) => 
    new CalendarServiceError('PARSE_ERROR', message, details),
  
  validationError: (message: string, details?: unknown) => 
    new CalendarServiceError('VALIDATION_ERROR', message, details),
  
  invalidIntent: (intent: string) => 
    new CalendarServiceError('INVALID_INTENT', `Invalid intent: ${intent}`, { intent }),
  
  notImplemented: (feature: string) => 
    new CalendarServiceError('NOT_IMPLEMENTED', `${feature} is not implemented`, { feature }),
  
  internalError: (error: unknown) => 
    new CalendarServiceError(
      'INTERNAL_ERROR', 
      error instanceof Error ? error.message : String(error), 
      error
    )
} as const;

// Modern types with strict validation (2025 pattern)
export interface CalendarRequest {
  readonly intent: 'schedule' | 'availability' | 'connect' | 'callback';
  readonly userId: string;
  readonly data: Record<string, unknown>;
}

export interface ScheduleEventData {
  readonly summary: string;
  readonly start: string; // ISO 8601
  readonly end: string;   // ISO 8601
  readonly timeZone: string;
  readonly description?: string;
  readonly location?: string;
  readonly attendees?: ReadonlyArray<{
    readonly email: string;
    readonly displayName?: string;
    readonly optional?: boolean;
  }>;
}

export interface CallbackData {
  readonly code: string;
  readonly state: string;
  readonly redirect_uri: string;
}

// Modern response types (2025 pattern)
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly timestamp: string;
}

// ============================================================================
// Request Validation (2025 Pattern - Simplified)
// ============================================================================

/**
 * Modern form data parsing with enhanced error handling
 */
export async function parseFormData(request: Request): Promise<Record<string, string>> {
  try {
    const formData = await request.formData();
    const entries: Record<string, string> = {};
    
    // Compatible iteration approach for older TypeScript configs
    formData.forEach((value, key) => {
      entries[key] = typeof value === 'string' ? value : value.name || '';
    });
    
    return entries;
  } catch (error) {
    throw CalendarError.parseError("Failed to parse form data", error);
  }
}

/**
 * Modern validation with enhanced error reporting
 */
export function validateCalendarRequest(data: Record<string, string>): CalendarRequest {
  const { intent, userId, ...rest } = data;
  
  if (!intent || !['schedule', 'availability', 'connect', 'callback'].includes(intent)) {
    throw CalendarError.invalidIntent(intent || 'undefined');
  }
  
  if (!userId || userId.trim().length === 0) {
    throw CalendarError.validationError('userId is required and cannot be empty');
  }
  
  return {
    intent: intent as CalendarRequest['intent'],
    userId: userId.trim(),
    data: rest
  };
}

/**
 * Validate schedule event data
 */
export function validateScheduleEventData(data: Record<string, unknown>): ScheduleEventData {
  const { summary, start, end, timeZone, description, location } = data;
  
  if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
    throw CalendarError.validationError('summary is required and cannot be empty');
  }
  
  if (!start || typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(start)) {
    throw CalendarError.validationError('start must be a valid ISO 8601 date string');
  }
  
  if (!end || typeof end !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(end)) {
    throw CalendarError.validationError('end must be a valid ISO 8601 date string');
  }
  
  if (!timeZone || typeof timeZone !== 'string' || timeZone.trim().length === 0) {
    throw CalendarError.validationError('timeZone is required and cannot be empty');
  }
  
  return {
    summary: summary.trim(),
    start,
    end,
    timeZone: timeZone.trim(),
    description: typeof description === 'string' ? description.trim() : undefined,
    location: typeof location === 'string' ? location.trim() : undefined
  };
}

/**
 * Validate callback data
 */
export function validateCallbackData(data: Record<string, unknown>): CallbackData {
  const { code, state, redirect_uri } = data;
  
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    throw CalendarError.validationError('code is required and cannot be empty');
  }
  
  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    throw CalendarError.validationError('state is required and cannot be empty');
  }
  
  if (!redirect_uri || typeof redirect_uri !== 'string' || !/^https?:\/\/.+/.test(redirect_uri)) {
    throw CalendarError.validationError('redirect_uri must be a valid HTTP/HTTPS URL');
  }
  
  return {
    code: code.trim(),
    state: state.trim(),
    redirect_uri
  };
}

// ============================================================================
// Modern Response Helpers (2025 Pattern)
// ============================================================================

/**
 * Type-safe response creation with modern patterns
 */
export function createJsonResponse<T>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, headers = {} } = options;
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...headers,
    },
  });
}

/**
 * Modern error response with structured error information
 */
export function createErrorResponse(
  error: CalendarServiceError,
  options: {
    status?: number;
    includeStack?: boolean;
  } = {}
): Response {
  const { status = 400, includeStack = false } = options;
  
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      ...(includeStack && error.stack && { stack: error.stack })
    },
    timestamp: error.timestamp
  };
  
  return createJsonResponse(errorResponse, { status });
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number;
    message?: string;
  } = {}
): Response {
  const { status = 200, message = "Operation successful" } = options;
  
  const successResponse: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  return createJsonResponse(successResponse, { status });
}

// ============================================================================
// Modern Request Handlers (2025 Pattern - Simplified)
// ============================================================================

/**
 * Modern event scheduling with enhanced error handling
 */
export async function handleScheduleEvent(
  data: ScheduleEventData,
  accessToken: string
): Promise<Response> {
  try {
    // TODO: Implement actual Google Calendar integration
    // For now, return a mock success response
    const mockEventData = {
      id: `event_${Date.now()}`,
      ...data,
      created: new Date().toISOString()
    };
    
    return createSuccessResponse(mockEventData, {
      message: "Event scheduled successfully"
    });
  } catch (error) {
    return createErrorResponse(
      error instanceof CalendarServiceError 
        ? error 
        : CalendarError.internalError(error),
      { status: 500 }
    );
  }
}

/**
 * Modern availability checking with enhanced patterns
 */
export async function handleCheckAvailability(
  data: Record<string, unknown>,
  accessToken: string
): Promise<Response> {
  try {
    // TODO: Implement actual availability checking
    return createErrorResponse(
      CalendarError.notImplemented("Availability check"),
      { status: 501 }
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof CalendarServiceError 
        ? error 
        : CalendarError.internalError(error),
      { status: 500 }
    );
  }
}

/**
 * Modern calendar connection with URL validation
 */
export async function handleConnectCalendar(
  data: Record<string, unknown>
): Promise<Response> {
  try {
    // TODO: Implement actual calendar connection
    return createErrorResponse(
      CalendarError.notImplemented("Calendar connection"),
      { status: 501 }
    );
  } catch (error) {
    return createErrorResponse(
      error instanceof CalendarServiceError 
        ? error 
        : CalendarError.internalError(error),
      { status: 500 }
    );
  }
}

/**
 * Modern OAuth callback handling with secure redirects
 */
export async function handleOAuthCallback(
  data: CallbackData
): Promise<Response> {
  try {
    // Secure redirect URL construction with validation
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_URL || 'https://your-domain.com'
      : 'http://localhost:3000';
    
    const url = new URL('/calendar/success', baseUrl);
    url.searchParams.set('code', data.code);
    url.searchParams.set('state', data.state);
    url.searchParams.set('timestamp', Date.now().toString());
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff"
      },
    });
  } catch (error) {
    return createErrorResponse(
      error instanceof CalendarServiceError 
        ? error 
        : CalendarError.internalError(error),
      { status: 500 }
    );
  }
}

// ============================================================================
// Modern Main Service Function (2025 Pattern - Super Simplified)
// ============================================================================

/**
 * Intent handler mapping for type safety and maintainability
 */
const intentHandlers = {
  schedule: async (data: Record<string, unknown>, accessToken: string, userId: string) => {
    const eventData = validateScheduleEventData(data);
    return handleScheduleEvent(eventData, accessToken);
  },
    
  availability: async (data: Record<string, unknown>, accessToken: string, userId: string) => {
    return handleCheckAvailability(data, accessToken);
  },
    
  connect: async (data: Record<string, unknown>, accessToken: string, userId: string) => {
    return handleConnectCalendar(data);
  },
    
  callback: async (data: Record<string, unknown>, accessToken: string, userId: string) => {
    const callbackData = validateCallbackData(data);
    return handleOAuthCallback(callbackData);
  }
} as const;

/**
 * Modern main service function with enhanced error handling and type safety
 */
export async function handleCalendarRequest({
  request,
  accessToken = "",
}: {
  request: Request;
  accessToken?: string;
}): Promise<Response> {
  try {
    // Parse and validate form data
    const formData = await parseFormData(request);
    
    // Validate base request structure
    const baseRequest = validateCalendarRequest(formData);
    
    // Extract intent and data
    const { intent, userId, data } = baseRequest;
    
    // Route to the appropriate handler based on the intent
    const handler = intentHandlers[intent];
    return await handler(data, accessToken, userId);
    
  } catch (error) {
    return createErrorResponse(
      error instanceof CalendarServiceError 
        ? error 
        : CalendarError.internalError(error),
      { status: 500 }
    );
  }
}
