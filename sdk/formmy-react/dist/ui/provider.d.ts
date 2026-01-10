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
import type { FormmyConfig, FormmyProviderProps } from "../core/types";
interface FormmyContextValue extends FormmyConfig {
    baseUrl: string;
}
export declare function FormmyProvider({ publishableKey, secretKey, baseUrl, children, }: FormmyProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access Formmy configuration from context
 * @throws Error if used outside FormmyProvider
 */
export declare function useFormmy(): FormmyContextValue;
/**
 * Hook to access Formmy configuration, returns null if not in provider
 * Useful for optional Formmy integration
 */
export declare function useFormmyOptional(): FormmyContextValue | null;
export {};
//# sourceMappingURL=provider.d.ts.map