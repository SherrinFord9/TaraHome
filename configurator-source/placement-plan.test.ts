import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPlacement, readPlacement, constrainItem, placementCounts, placementSubmission, snap} from './app/components/placement-plan.ts';

test('older and malformed drafts get a clean optional map', () => {
  for (const input of [undefined, null, [], {}, {version: 2}]) assert.deepEqual(readPlacement(input), emptyPlacement());
});
test('geometry is finite, bounded, and counts retain their meaning', () => {
  const plan = readPlacement({version: 1, width: 60, depth: 40, items: [
    {id: 'r', kind: 'room', name: 'Living', x: 100, y: -4, width: 20, depth: 10, floor: 99},
    {id: 'c', kind: 'camera', name: 'Entry', x: 18, y: 12, rotation: 900, range: 200, fov: 999, floor: 1},
    {id: 'm', kind: 'presence', name: 'Sofa', x: 22, y: 20, rotation: 45, range: 12, fov: 120, floor: 1},
    {id: 'm', kind: 'presence'}, {id: 'bad', kind: 'script'}, null,
  ]});
  assert.deepEqual(placementCounts(plan), {rooms: 1, cameras: 1, presence: 1});
  assert.equal(plan.items[0].x, 40); assert.equal(plan.items[0].y, 0); assert.equal(plan.items[0].floor, 8);
  assert.equal(plan.items[1].rotation, 359); assert.equal(plan.items[1].range, 100); assert.equal(plan.items[1].fov, 360);
  assert.equal(snap(3.24), 3); assert.equal(snap(3.26), 3.5);
  for (const item of plan.items) for (const v of Object.values(item)) if (typeof v === 'number') assert.ok(Number.isFinite(v));
  assert.equal(constrainItem({...plan.items[0], width: 1000}, plan).width, 60);
});
test('only bounded local raster images survive restoration, never submission', () => {
  const plan = readPlacement({version: 1, width: 60, depth: 40, items: [], images: {
    1: 'data:image/png;base64,AAAA', 2: 'https://external.example/track.png',
    3: 'data:image/svg+xml;base64,AAAA', 4: 'data:image/png;base64,' + 'A'.repeat(400_000),
    9: 'data:image/png;base64,AAAA',
  }});
  assert.deepEqual(Object.keys(plan.images), ['1']);
  const payload = placementSubmission(plan);
  assert.equal(payload.includes('data:image'), false);
  assert.equal(JSON.parse(payload).floorPlanImagesAttached, false);
  assert.equal(JSON.parse(payload).units, 'feet');
});
