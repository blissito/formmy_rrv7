import { useEffect, useRef } from 'react';
import { useFetcher } from 'react-router';

/**
 * Hook to handle plan purchase redirect after OAuth login
 *
 * Flow:
 * 1. User clicks PAID plan in /planes → saves intent to localStorage, redirects to OAuth
 * 2. User clicks "Iniciar sesión" button → CLEARS localStorage, redirects to OAuth
 * 3. User completes Google OAuth login
 * 4. Dashboard loads → this hook reads localStorage
 * 5. If plan intent exists → redirects to Stripe checkout (came from plan purchase)
 * 6. If NO intent → normal dashboard load (came from login button)
 * 7. Clears localStorage after redirect
 */
export function usePlanRedirect() {
  const fetcher = useFetcher();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasProcessed.current) return;

    // Check if there's a saved plan intent from purchase flow
    const planIntentData = localStorage.getItem('formmy_plan_intent');

    if (planIntentData) {
      try {
        const data = JSON.parse(planIntentData);
        const { intent } = data;

        console.log('[usePlanRedirect] Found plan intent, redirecting to Stripe:', intent);
        hasProcessed.current = true;

        // Clear localStorage immediately to prevent loops
        localStorage.removeItem('formmy_plan_intent');

        // Submit to Stripe API to create checkout session
        // This will redirect the user to Stripe checkout page
        fetcher.submit(
          { intent },
          { method: 'post', action: '/api/stripe' }
        );

        console.log('[usePlanRedirect] Redirecting to Stripe checkout...');
      } catch (error) {
        console.error('[usePlanRedirect] Error parsing plan intent:', error);
        localStorage.removeItem('formmy_plan_intent');
      }
    }
  }, [fetcher]);

  return {
    isRedirecting: fetcher.state !== 'idle',
  };
}
