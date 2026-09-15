type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = AnalyticsProps & {
  event: string;
  path: string;
  url: string;
  timestamp: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: {props?: AnalyticsProps}) => void;
    posthog?: {capture?: (eventName: string, properties?: AnalyticsProps) => void};
    fbq?: (...args: unknown[]) => void;
    ttq?: {track?: (eventName: string, properties?: AnalyticsProps) => void};
    rdt?: (...args: unknown[]) => void;
    taraClickEvents?: AnalyticsEvent[];
    __taraAnalyticsReady?: boolean;
  }
}

const STORAGE_KEY = 'tara_click_events';

function compactText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim().slice(0, 120) || undefined;
}

function saveLocalEvent(event: AnalyticsEvent) {
  const events = [...(window.taraClickEvents || []), event].slice(-80);
  window.taraClickEvents = events;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Analytics should never block interaction.
  }
}

export function trackEvent(eventName: string, props: AnalyticsProps = {}) {
  if (typeof window === 'undefined') return;

  const event: AnalyticsEvent = {
    ...props,
    event: eventName,
    path: window.location.pathname,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  saveLocalEvent(event);

  window.gtag?.('event', eventName, {
    event_category: props.category || 'engagement',
    event_label: props.label || props.text || props.href || props.section,
    ...props,
  });
  window.plausible?.(eventName, {props});
  window.posthog?.capture?.(eventName, event);
  window.fbq?.('trackCustom', eventName, event);
  window.ttq?.track?.(eventName, event);
  window.rdt?.('track', 'Custom', {customEventName: eventName, ...event});
  window.dispatchEvent(new CustomEvent('tara:analytics', {detail: event}));
}

function clickableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('a, button, [role="button"], input[type="submit"], input[type="button"]');
}

function clickProps(element: HTMLElement): AnalyticsProps {
  const anchor = element instanceof HTMLAnchorElement ? element : element.closest<HTMLAnchorElement>('a');
  const label =
    element.dataset.analytics ||
    element.getAttribute('aria-label') ||
    compactText(element.textContent) ||
    anchor?.getAttribute('href') ||
    element.tagName.toLowerCase();

  return {
    label,
    text: compactText(element.textContent),
    tag: element.tagName.toLowerCase(),
    href: anchor?.getAttribute('href') || undefined,
    section: element.dataset.analyticsSection || anchor?.hash?.replace('#', '') || undefined,
    role: element.getAttribute('role') || undefined,
    id: element.id || undefined,
    className: compactText(element.className),
  };
}

function handleClick(event: MouseEvent) {
  const element = clickableTarget(event.target);
  if (!element || element.closest('[data-analytics-private]')) return;
  trackEvent('site_click', clickProps(element));
}

function handleSubmit(event: SubmitEvent) {
  if (!(event.target instanceof HTMLFormElement)) return;
  const form = event.target;
  trackEvent('site_form_submit', {
    label: form.dataset.analytics || form.id || form.getAttribute('name') || 'form',
    action: form.getAttribute('action') || undefined,
    formId: form.id || undefined,
    className: compactText(form.className),
  });
}

export function initSiteAnalytics() {
  if (typeof window === 'undefined' || window.__taraAnalyticsReady) {
    return () => {};
  }

  window.__taraAnalyticsReady = true;
  document.addEventListener('click', handleClick, true);
  document.addEventListener('submit', handleSubmit, true);

  return () => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('submit', handleSubmit, true);
    window.__taraAnalyticsReady = false;
  };
}
