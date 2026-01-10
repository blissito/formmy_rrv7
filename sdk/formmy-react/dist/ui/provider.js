import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @formmy.app/react - Provider Component
 *
 * Provides Formmy configuration to all child components.
 *
 * Usage:
 * ```tsx
 * import { FormmyProvider } from '@formmy.app/react';
 *
 * function App() {
 *   return (
 *     <FormmyProvider publishableKey="formmy_pk_live_xxx">
 *       <YourApp />
 *     </FormmyProvider>
 *   );
 * }
 * ```
 */
import { createContext, useContext, useMemo } from "react";
const DEFAULT_BASE_URL = "https://formmy.app";
// Valid publishable key prefixes (supports old and new format)
const VALID_PK_PREFIXES = ["formmy_pk_live_", "pk_live_"];
const FormmyContext = createContext(null);
export function FormmyProvider({ publishableKey, secretKey, baseUrl = DEFAULT_BASE_URL, children, }) {
    // Validate publishable key format (dev-time check)
    if (publishableKey && !VALID_PK_PREFIXES.some(p => publishableKey.startsWith(p))) {
        console.warn("[FormmyProvider] Invalid publishableKey format. Expected formmy_pk_live_xxx");
    }
    const value = useMemo(() => ({
        publishableKey,
        secretKey,
        baseUrl,
    }), [publishableKey, secretKey, baseUrl]);
    return (_jsx(FormmyContext.Provider, { value: value, children: children }));
}
/**
 * Hook to access Formmy configuration from context
 * @throws Error if used outside FormmyProvider
 */
export function useFormmy() {
    const context = useContext(FormmyContext);
    if (!context) {
        throw new Error("useFormmy must be used within a FormmyProvider");
    }
    return context;
}
/**
 * Hook to access Formmy configuration, returns null if not in provider
 * Useful for optional Formmy integration
 */
export function useFormmyOptional() {
    return useContext(FormmyContext);
}
//# sourceMappingURL=provider.js.map