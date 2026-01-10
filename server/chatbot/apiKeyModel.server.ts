/**
 * API Key Model - SDK Key validation
 *
 * Las SDK keys se crean directamente en el dashboard (dashboard.api-keys_.tsx)
 * usando Prisma. Este archivo solo contiene la lógica de validación.
 */

import type { ApiKey, KeyScope as KeyScopeEnum } from "@prisma/client";
import pkg from "@prisma/client";
const { KeyScope } = pkg;
import { nanoid } from "nanoid";
import { db } from "../../app/utils/db.server";

/**
 * Generates an SDK key with appropriate prefix
 * formmy_sk_live_xxx = Secret key (backend, full access)
 * formmy_pk_live_xxx = Publishable key (frontend, domain-restricted)
 */
export function generateSdkKey(scope: KeyScopeEnum): string {
  const prefix = scope === KeyScope.SECRET ? "formmy_sk_live_" : "formmy_pk_live_";
  return `${prefix}${nanoid(32)}`;
}

/**
 * Validates an SDK key and returns auth context
 * Updates usage stats on each validation
 */
export async function validateSdkKey(key: string): Promise<{
  apiKey: ApiKey;
  userId: string;
  scope: KeyScopeEnum;
} | null> {
  const apiKey = await db.apiKey.findUnique({
    where: { key },
  });

  if (!apiKey || !apiKey.isActive) {
    return null;
  }

  // Update last used timestamp and request counts
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
      monthlyRequests: { increment: 1 },
    },
  });

  return {
    apiKey,
    userId: apiKey.userId,
    scope: apiKey.keyScope,
  };
}
