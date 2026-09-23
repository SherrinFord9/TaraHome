export const PLAN_FORM_URL = 'https://formspree.io/f/mqelrgbl';

export type DeliveryFailure = 'timeout' | 'network' | 'service' | 'rate_limit' | 'invalid_response';

export class PlanDeliveryError extends Error {
  readonly reason: DeliveryFailure;
  constructor(reason: DeliveryFailure) {
    super('Plan receipt could not be confirmed');
    this.reason = reason;
  }
}

export type PlanRequest = {
  reference: string;
  submittedAt: string;
  payload: Record<string, string | number>;
};

export function preparePlanRequest(payload: PlanRequest['payload'], previous?: PlanRequest): PlanRequest {
  if (previous && JSON.stringify(previous.payload) === JSON.stringify(payload)) return previous;
  return {
    reference: `TARA-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    payload: {...payload},
  };
}

export async function deliverPlan(request: PlanRequest, options: {fetchImpl?: typeof fetch; timeoutMs?: number} = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {timedOut = true; controller.abort();}, options.timeoutMs ?? 30000);
  const body = new FormData();
  Object.entries({...request.payload, requestReference: request.reference, submittedAt: request.submittedAt})
    .forEach(([key, value]) => body.append(key, String(value)));
  try {
    const response = await (options.fetchImpl || fetch)(PLAN_FORM_URL, {
      method: 'POST', headers: {Accept: 'application/json'}, body, signal: controller.signal,
    });
    if (response.status === 429) throw new PlanDeliveryError('rate_limit');
    if (!response.ok) throw new PlanDeliveryError('service');
    if (response.redirected) throw new PlanDeliveryError('invalid_response');
    let result: unknown;
    try {result = await response.json();}
    catch {throw new PlanDeliveryError(timedOut ? 'timeout' : 'invalid_response');}
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new PlanDeliveryError('invalid_response');
    const data = result as Record<string, unknown>;
    // Accept Formspree's simple acknowledgement or its documented id/data body,
    // not a 200 HTML challenge, empty object, or an error-bearing JSON response.
    const hasErrors = data.error !== undefined || (data.errors !== undefined &&
      (!Array.isArray(data.errors) || data.errors.length > 0));
    const hasId = typeof data.id === 'string' && data.id.length > 0 &&
      data.data !== null && typeof data.data === 'object' && !Array.isArray(data.data);
    if (hasErrors || data.ok === false || !(data.ok === true || hasId)) throw new PlanDeliveryError('invalid_response');
    return {providerSubmissionId: typeof data.id === 'string' ? data.id : undefined};
  } catch (error) {
    if (timedOut) throw new PlanDeliveryError('timeout');
    if (error instanceof PlanDeliveryError) throw error;
    throw new PlanDeliveryError('network');
  } finally {
    clearTimeout(timeout);
  }
}

export function planRequestCopy(request: PlanRequest, accepted: boolean, providerSubmissionId?: string) {
  return JSON.stringify({
    ...request,
    status: accepted ? 'accepted_by_form_service' : 'receipt_unconfirmed',
    emailDelivery: 'not_verified',
    providerSubmissionId,
    notice: 'Planning request only. Not a paid order or confirmation of email delivery.',
  }, null, 2);
}
