import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deliverPlan, preparePlanRequest, planRequestCopy, PlanDeliveryError} from './app/components/plan-delivery.ts';

const request = preparePlanRequest({email: 'delivery-qa@example.com', message: 'Private test plan', _gotcha: ''});

test('unchanged retries share a reference; changed requests receive a new reference', () => {
  assert.equal(preparePlanRequest({...request.payload}, request), request);
  assert.notEqual(preparePlanRequest({...request.payload, message: 'Changed'}, request).reference, request.reference);
  assert.match(request.reference, /^TARA-[A-F0-9]{16}$/);
});

test('sends original fields plus reference, timestamp, and an actual honeypot value', async () => {
  let calls = 0;
  const prepared = preparePlanRequest({...request.payload, _gotcha: 'filled'});
  await deliverPlan(prepared, {fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'https://formspree.io/f/mqelrgbl');
    assert.equal(init?.method, 'POST');
    const data = init?.body as FormData;
    assert.equal(data.get('requestReference'), prepared.reference);
    assert.equal(data.get('submittedAt'), prepared.submittedAt);
    assert.equal(data.get('email'), prepared.payload.email);
    assert.equal(data.get('_gotcha'), 'filled');
    return Response.json({ok: true});
  }});
  assert.equal(calls, 1);
});

test('accepts the documented id/data response without treating it as email delivery', async () => {
  const result = await deliverPlan(request, {fetchImpl: async () => Response.json({id: 'qa-only-id', data: {}})});
  const copy = JSON.parse(planRequestCopy(request, true, result.providerSubmissionId));
  assert.equal(copy.providerSubmissionId, 'qa-only-id');
  assert.equal(copy.status, 'accepted_by_form_service');
  assert.equal(copy.emailDelivery, 'not_verified');
});

for (const body of ['<html>Verification required</html>', '{}', '{"ok":false}', '{"ok":true,"errors":[{"message":"blocked"}]}', 'null', '[]', '{"id":"x"}', '{"ok":true,"error":"blocked"}']) {
  test(`rejects an ambiguous HTTP 200: ${body}`, async () => {
    await assert.rejects(deliverPlan(request, {fetchImpl: async () => new Response(body)}),
      (e: unknown) => e instanceof PlanDeliveryError && e.reason === 'invalid_response');
  });
}

test('classifies rate limit, server, network and timeout failures without automatic retry', async () => {
  for (const [status, reason] of [[429, 'rate_limit'], [503, 'service']] as const) {
    await assert.rejects(deliverPlan(request, {fetchImpl: async () => new Response('', {status})}),
      (e: unknown) => e instanceof PlanDeliveryError && e.reason === reason);
  }
  await assert.rejects(deliverPlan(request, {fetchImpl: async () => {throw new TypeError('network');}}),
    (e: unknown) => e instanceof PlanDeliveryError && e.reason === 'network');
  let calls = 0;
  await assert.rejects(deliverPlan(request, {timeoutMs: 5, fetchImpl: async (_url, init) => {
    calls++;
    return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
  }}), (e: unknown) => e instanceof PlanDeliveryError && e.reason === 'timeout');
  assert.equal(calls, 1);
  assert.equal(JSON.parse(planRequestCopy(request, false)).status, 'receipt_unconfirmed');
});
