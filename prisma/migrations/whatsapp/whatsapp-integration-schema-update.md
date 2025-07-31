# WhatsApp Integration Schema Update

**Date:** $(date)
**Migration Type:** Schema Update (MongoDB)

## Changes Made

### Integration Model Updates

Added new fields to support WhatsApp Business API integration:

- `phoneNumberId: String?` - WhatsApp Phone Number ID from Business API
- `businessAccountId: String?` - WhatsApp Business Account ID
- `webhookVerifyToken: String?` - Token for webhook verification
- `lastActivity: DateTime?` - Timestamp of last integration activity
- `errorMessage: String?` - Store error messages for troubleshooting

### Message Model Updates

Added channel tracking fields:

- `channel: String?` - Track message source ('web', 'whatsapp', 'telegram')
- `externalMessageId: String?` - Store external message IDs (e.g., WhatsApp message ID)

## Requirements Addressed

- **Requirement 1.1**: Support for WhatsApp Business API credential storage
- **Requirement 2.1**: Integration status tracking and error handling
- **Requirement 3.1**: Channel identification for message routing

## Database Impact

- **Backward Compatible**: All new fields are optional (nullable)
- **No Data Loss**: Existing records remain unchanged
- **Indexing**: Consider adding indexes on `channel` and `externalMessageId` for performance

## Next Steps

1. Update application code to use new fields
2. Add validation for WhatsApp-specific fields
3. Implement integration management logic
4. Add webhook processing for incoming messages

## Rollback Plan

If rollback is needed:

1. Remove the new fields from the schema
2. Run `npx prisma generate` to update the client
3. Update application code to remove references to new fields
