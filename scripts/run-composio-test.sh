#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Run the test
npx tsx scripts/test-composio-calendar-fixed.ts
