export function useTracking() {
  const { $posthog } = useNuxtApp()

  return {
    trackFormView: () => $posthog?.capture('lead_form_viewed'),
    trackFormSubmit: (intent?: string) => $posthog?.capture('lead_form_submitted', { intent }),
    trackFormSuccess: (leadId: string) =>
      $posthog?.capture('lead_form_success', { lead_id: leadId }),
    trackFormError: (error: string) => $posthog?.capture('lead_form_error', { error }),
  }
}
