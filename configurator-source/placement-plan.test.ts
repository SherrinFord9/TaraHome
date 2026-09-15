import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyPlacement, readPlacement, constrainItem, placementCounts, placementSubmission, snap, placementCatalog, normalizeRotation, updatePlacement, removePlacement, snapOpening} from './app/components/placement-plan.ts';

test('older and malformed drafts get a clean optional map', () => {
  for (const input of [undefined, null, [], {}, {version: 99}]) assert.deepEqual(readPlacement(input), emptyPlacement());
  assert.equal(readPlacement({version: 1}).version, 2);
  assert.equal(readPlacement({version: 1}).width, 60);
});
test('geometry is finite, bounded, and counts retain their meaning', () => {
  const plan = readPlacement({version: 1, width: 60, depth: 40, items: [
    {id: 'r', kind: 'room', name: 'Living', x: 100, y: -4, width: 20, depth: 10, floor: 99},
    {id: 'c', kind: 'camera', name: 'Entry', x: 18, y: 12, rotation: 900, range: 200, fov: 999, floor: 1},
    {id: 'm', kind: 'presence', name: 'Sofa', x: 22, y: 20, rotation: 45, range: 12, fov: 120, floor: 1},
    {id: 'm', kind: 'presence'}, {id: 'bad', kind: 'script'}, null,
  ]});
  assert.deepEqual(placementCounts(plan), {rooms: 1, cameras: 1, presence: 1, windows: 0, doors: 0, devices: 2});
  assert.equal(plan.items[0].x, 40); assert.equal(plan.items[0].y, 0); assert.equal(plan.items[0].floor, 8);
  assert.equal(plan.items[1].rotation, 180); assert.equal(plan.items[1].range, 100); assert.equal(plan.items[1].fov, 360);
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

test('all catalogue categories survive restoration and submission without inflating camera zones', () => {
  const plan = readPlacement({version: 2, items: placementCatalog.map(entry => ({id: entry.kind, kind: entry.kind, name: entry.label, floor: 1}))});
  assert.equal(plan.items.length, placementCatalog.length);
  assert.equal(placementCounts(plan).cameras, 1);
  assert.equal(placementCounts(plan).presence, 1);
  assert.equal(placementCounts(plan).devices, placementCatalog.length - 3);
  const payload = JSON.parse(placementSubmission(plan));
  assert.equal(payload.version, 2);
  assert.ok(payload.items.some(item => item.kind === 'speaker'));
  assert.ok(payload.additionalDevices.includes('not a confirmed inventory'));
});

test('sensor attachment follows its opening and is removed together, without changing other devices', () => {
  const plan = readPlacement({version: 2, items: [
    {id: 'w', kind: 'window', floor: 1, x: 10, y: 10, width: 4},
    {id: 's', kind: 'windowSensor', floor: 1, attachedTo: 'w'},
    {id: 'speaker', kind: 'speaker', floor: 1, x: 15, y: 12},
  ]});
  const moved = updatePlacement(plan, 'w', {x: 20, y: 8, rotation: 90});
  assert.equal(moved.items[1].x, 20);
  assert.equal(moved.items[1].y, 8);
  assert.equal(moved.items[1].rotation, 90);
  assert.deepEqual(moved.items[2], plan.items[2]);
  assert.deepEqual(removePlacement(moved, 'w').items.map(item => item.id), ['speaker']);
  assert.equal(updatePlacement(moved, 's', {attachedTo: undefined, x: 30}).items[1].x, 30);
});

test('invalid or cross-floor sensor attachments are detached on restore', () => {
  const plan = readPlacement({version: 2, items: [
    {id: 'w', kind: 'window', floor: 1}, {id: 'door', kind: 'door', floor: 1},
    {id: 'wrong-type', kind: 'windowSensor', attachedTo: 'door', floor: 1},
    {id: 'wrong-floor', kind: 'windowSensor', attachedTo: 'w', floor: 2},
    {id: 'missing', kind: 'windowSensor', attachedTo: 'gone', floor: 1},
    {id: 'self', kind: 'doorSensor', attachedTo: 'self', floor: 1},
  ]});
  assert.ok(plan.items.every(item => item.attachedTo === undefined));
});

test('openings snap to nearby same-floor walls, not distant rooms', () => {
  const plan = readPlacement({version: 2, items: [
    {id: 'r', kind: 'room', floor: 1, x: 4, y: 4, width: 20, depth: 16},
    {id: 'w', kind: 'window', floor: 1, x: 12, y: 5, width: 4},
  ]});
  assert.equal(snapOpening(plan.items[1], plan).y, 4);
  const side = snapOpening({...plan.items[1], x: 23, y: 12}, plan);
  assert.equal(side.x, 24); assert.equal(side.rotation, 90);
  const otherFloor = {...plan.items[1], floor: 2};
  assert.equal(snapOpening(otherFloor, plan).y, 5);
});

test('rotation wraps in either direction and per-kind safety limits still apply', () => {
  assert.equal(normalizeRotation(-45), 315);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(405), 45);
  const plan = readPlacement({version: 2, items: Array.from({length: 100}, (_, n) => ({id: String(n), kind: 'camera', floor: 1}))});
  assert.equal(plan.items.length, 40);
});

test('moving a room carries its openings, attached sensors and devices, not outside placements', () => {
  const plan = readPlacement({version: 2, items: [
    {id: 'r', kind: 'room', floor: 1, x: 4, y: 4, width: 20, depth: 16},
    {id: 'w', kind: 'window', floor: 1, x: 12, y: 4, width: 4},
    {id: 's', kind: 'windowSensor', floor: 1, attachedTo: 'w'},
    {id: 'speaker', kind: 'speaker', floor: 1, x: 15, y: 12},
    {id: 'outside', kind: 'camera', floor: 1, x: 40, y: 20},
  ]});
  const next = updatePlacement(plan, 'r', {x: 8, y: 9});
  assert.equal(next.items[1].x, 16); assert.equal(next.items[1].y, 9);
  assert.equal(next.items[2].x, 16); assert.equal(next.items[2].y, 9);
  assert.equal(next.items[3].x, 19); assert.equal(next.items[3].y, 17);
  assert.deepEqual(next.items[4], plan.items[4]);
  assert.equal(plan.items[1].x, 12);
});

test('moving an opening to another floor carries its attached sensor', () => {
  const plan = readPlacement({version: 2, items: [
    {id: 'd', kind: 'door', floor: 1}, {id: 's', kind: 'doorSensor', floor: 1, attachedTo: 'd'},
  ]});
  const next = updatePlacement(plan, 'd', {floor: 2});
  assert.equal(next.items[1].floor, 2);
  assert.equal(next.items[1].attachedTo, 'd');
});
