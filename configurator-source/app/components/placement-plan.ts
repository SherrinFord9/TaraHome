export const placementCatalog = [
  {kind: 'room', label: 'Room', group: 'Rooms & openings', color: '#426855'},
  {kind: 'window', label: 'Window', group: 'Rooms & openings', color: '#287697'},
  {kind: 'door', label: 'Door', group: 'Rooms & openings', color: '#426855'},
  {kind: 'camera', label: 'Camera', group: 'Kit devices', color: '#286b96'},
  {kind: 'presence', label: 'mmWave sensor', group: 'Kit devices', color: '#a4522c'},
  {kind: 'windowSensor', label: 'Window sensor', group: 'Kit devices', color: '#287697'},
  {kind: 'doorSensor', label: 'Door sensor', group: 'Kit devices', color: '#426855'},
  {kind: 'light', label: 'Smart light', group: 'Kit devices', color: '#856616'},
  {kind: 'switch', label: 'Wall switch', group: 'Kit devices', color: '#856616'},
  {kind: 'thermostat', label: 'Thermostat', group: 'Kit devices', color: '#a4522c'},
  {kind: 'doorbell', label: 'Doorbell', group: 'Kit devices', color: '#286b96'},
  {kind: 'hub', label: 'Local server', group: 'Kit devices', color: '#426855'},
  {kind: 'speaker', label: 'Speaker', group: 'Compatible add-ons', color: '#795977'},
  {kind: 'voice', label: 'Voice assistant', group: 'Compatible add-ons', color: '#795977'},
  {kind: 'plug', label: 'Smart plug', group: 'Compatible add-ons', color: '#856616'},
  {kind: 'shade', label: 'Window shade', group: 'Compatible add-ons', color: '#795977'},
  {kind: 'lock', label: 'Smart lock', group: 'Compatible add-ons', color: '#426855'},
  {kind: 'tv', label: 'TV', group: 'Compatible add-ons', color: '#795977'},
  {kind: 'vacuum', label: 'Robot vacuum', group: 'Compatible add-ons', color: '#426855'},
  {kind: 'mower', label: 'Lawn mower', group: 'Compatible add-ons', color: '#426855'},
  {kind: 'leak', label: 'Leak sensor', group: 'Compatible add-ons', color: '#287697'},
] as const;

export type PlacementKind = typeof placementCatalog[number]['kind'];
export type PlacementItem = {
  id: string; kind: PlacementKind; name: string; floor: number;
  x: number; y: number; width: number; depth: number;
  rotation: number; range: number; fov: number;
  attachedTo?: string;
};
export type PlacementPlan = {
  version: 2; width: number; depth: number;
  items: PlacementItem[]; images: Record<string, string>;
};

export const emptyPlacement = (): PlacementPlan => ({version: 2, width: 60, depth: 40, items: [], images: {}});
export const bound = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export const snap = (n: number) => Math.round(n * 2) / 2;
export const normalizeRotation = (angle: number) => ((Math.round(Number.isFinite(angle) ? angle : 0) % 360) + 360) % 360;
export const hasCoverage = (kind: PlacementKind) => kind === 'camera' || kind === 'presence';
export const isOpening = (kind: PlacementKind) => kind === 'window' || kind === 'door';
export const itemDetails = (kind: PlacementKind) => placementCatalog.find(entry => entry.kind === kind)!;
export const itemLimit = (kind: PlacementKind) => kind === 'camera' ? 40 : ['window', 'windowSensor'].includes(kind) ? 180 : kind === 'light' ? 240 : 80;

export function constrainItem(item: PlacementItem, plan: Pick<PlacementPlan, 'width' | 'depth'>): PlacementItem {
  const width = bound(item.width, item.kind === 'room' ? 2 : 1, plan.width);
  const depth = bound(item.depth, item.kind === 'room' ? 2 : 0.5, plan.depth);
  return {...item, width, depth,
    x: bound(item.x, 0, plan.width - (item.kind === 'room' ? width : 0)),
    y: bound(item.y, 0, plan.depth - (item.kind === 'room' ? depth : 0)),
    rotation: normalizeRotation(item.rotation), range: bound(item.range, 1, 100),
    fov: bound(item.fov, 10, 360), floor: Math.round(bound(item.floor, 1, 8)),
  };
}

function attachSensors(items: PlacementItem[]): PlacementItem[] {
  return items.map(item => {
    if (!item.attachedTo) return item;
    const parent = items.find(candidate => candidate.id === item.attachedTo && candidate.floor === item.floor &&
      ((candidate.kind === 'window' && item.kind === 'windowSensor') || (candidate.kind === 'door' && item.kind === 'doorSensor')));
    const {attachedTo, ...unattached} = item;
    return parent ? {...item, x: parent.x, y: parent.y, rotation: parent.rotation} : unattached;
  });
}

export function updatePlacement(plan: PlacementPlan, id: string, patch: Partial<PlacementItem>): PlacementPlan {
  const before = plan.items.find(item => item.id === id);
  if (!before) return plan;
  const after = constrainItem({...before, ...patch}, plan);
  return {...plan, items: attachSensors(plan.items.map(item => {
    if (item.id === id) return after;
    if (item.attachedTo === id) return {...item, floor: after.floor};
    if (before.kind === 'room' && item.kind !== 'room' && !item.attachedTo && item.floor === before.floor &&
        item.x >= before.x && item.x <= before.x + before.width && item.y >= before.y && item.y <= before.y + before.depth) {
      return constrainItem({...item, x: item.x + after.x - before.x, y: item.y + after.y - before.y}, plan);
    }
    return item;
  }))};
}

export function removePlacement(plan: PlacementPlan, id: string): PlacementPlan {
  return {...plan, items: plan.items.filter(item => item.id !== id && item.attachedTo !== id)};
}

export function snapOpening(item: PlacementItem, plan: PlacementPlan): PlacementItem {
  if (!isOpening(item.kind)) return constrainItem(item, plan);
  const candidates = plan.items.filter(room => room.kind === 'room' && room.floor === item.floor).flatMap(room => {
    const half = item.width / 2;
    return [
      {x: bound(item.x, room.x + Math.min(half, room.width / 2), room.x + room.width - Math.min(half, room.width / 2)), y: room.y, rotation: 0},
      {x: bound(item.x, room.x + Math.min(half, room.width / 2), room.x + room.width - Math.min(half, room.width / 2)), y: room.y + room.depth, rotation: 0},
      {x: room.x, y: bound(item.y, room.y + Math.min(half, room.depth / 2), room.y + room.depth - Math.min(half, room.depth / 2)), rotation: 90},
      {x: room.x + room.width, y: bound(item.y, room.y + Math.min(half, room.depth / 2), room.y + room.depth - Math.min(half, room.depth / 2)), rotation: 90},
    ];
  });
  const closest = candidates.sort((a, b) => Math.hypot(a.x - item.x, a.y - item.y) - Math.hypot(b.x - item.x, b.y - item.y))[0];
  return constrainItem(closest && Math.hypot(closest.x - item.x, closest.y - item.y) <= 2 ? {...item, ...closest} : item, plan);
}

// Preserve version-one drafts, but validate every field before rendering a map.
export function readPlacement(value: unknown): PlacementPlan {
  const fallback = emptyPlacement();
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Omit<Partial<PlacementPlan>, 'version'> & {version?: number};
  if (![1, 2].includes(raw.version || 0)) return fallback;
  const plan = {...fallback, width: bound(Number(raw.width ?? fallback.width), 10, 200), depth: bound(Number(raw.depth ?? fallback.depth), 10, 200)};
  const ids = new Set<string>();
  const kindCounts = new Map<PlacementKind, number>();
  if (Array.isArray(raw.items)) {
    for (const item of raw.items.slice(0, 600)) {
      if (!item || !placementCatalog.some(entry => entry.kind === item.kind) || typeof item.id !== 'string') continue;
      const id = item.id.slice(0, 80);
      const count = kindCounts.get(item.kind) || 0;
      if (!id || ids.has(id) || count >= itemLimit(item.kind)) continue;
      ids.add(id);
      kindCounts.set(item.kind, count + 1);
      plan.items.push(constrainItem({id, kind: item.kind,
        name: typeof item.name === 'string' ? item.name.slice(0, 48) : itemDetails(item.kind).label,
        floor: Number(item.floor), x: Number(item.x), y: Number(item.y),
        width: Number(item.width), depth: Number(item.depth), rotation: Number(item.rotation),
        range: Number(item.range), fov: Number(item.fov),
        ...(typeof item.attachedTo === 'string' ? {attachedTo: item.attachedTo.slice(0, 80)} : {})}, plan));
    }
  }
  plan.items = attachSensors(plan.items);
  if (raw.images && typeof raw.images === 'object') {
    let total = 0;
    for (const [floor, data] of Object.entries(raw.images)) {
      if (/^[1-8]$/.test(floor) && typeof data === 'string' && data.length <= 400_000 &&
          /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data) && total + data.length <= 1_200_000) {
        plan.images[floor] = data;
        total += data.length;
      }
    }
  }
  return plan;
}

export function placementCounts(plan: PlacementPlan) {
  return {cameras: plan.items.filter(i => i.kind === 'camera').length,
    presence: plan.items.filter(i => i.kind === 'presence').length,
    rooms: plan.items.filter(i => i.kind === 'room').length,
    windows: plan.items.filter(i => i.kind === 'window').length,
    doors: plan.items.filter(i => i.kind === 'door').length,
    devices: plan.items.filter(i => i.kind !== 'room' && !isOpening(i.kind)).length};
}

export function placementSubmission(plan: PlacementPlan) {
  return JSON.stringify({version: 2, units: 'feet', width: plan.width, depth: plan.depth,
    items: plan.items, coverage: 'Illustrative only; no wall occlusion, mounting height, or model validation.',
    additionalDevices: 'Placement requests for scope review, not a confirmed inventory or included price.',
    floorPlanImagesAttached: false});
}
