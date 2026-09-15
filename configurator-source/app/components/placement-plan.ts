export type PlacementKind = 'room' | 'camera' | 'presence';
export type PlacementItem = {
  id: string;
  kind: PlacementKind;
  name: string;
  floor: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  range: number;
  fov: number;
};
export type PlacementPlan = {
  version: 1;
  width: number;
  depth: number;
  items: PlacementItem[];
  images: Record<string, string>;
};

export const emptyPlacement = (): PlacementPlan => ({version: 1, width: 60, depth: 40, items: [], images: {}});
export const bound = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export const snap = (n: number) => Math.round(n * 2) / 2;

export function constrainItem(item: PlacementItem, plan: Pick<PlacementPlan, 'width' | 'depth'>): PlacementItem {
  const width = bound(item.width, 2, plan.width);
  const depth = bound(item.depth, 2, plan.depth);
  return {...item, width, depth,
    x: bound(item.x, 0, plan.width - (item.kind === 'room' ? width : 0)),
    y: bound(item.y, 0, plan.depth - (item.kind === 'room' ? depth : 0)),
    rotation: bound(item.rotation, 0, 359), range: bound(item.range, 1, 100),
    fov: bound(item.fov, 10, 360), floor: Math.round(bound(item.floor, 1, 8)),
  };
}

// Stored drafts are untrusted, including older or partially saved versions.
export function readPlacement(value: unknown): PlacementPlan {
  const fallback = emptyPlacement();
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<PlacementPlan>;
  if (raw.version !== 1) return fallback;
  const plan = {...fallback, width: bound(Number(raw.width), 10, 200), depth: bound(Number(raw.depth), 10, 200)};
  const ids = new Set<string>();
  const kindCounts = {room: 0, camera: 0, presence: 0};
  if (Array.isArray(raw.items)) {
    for (const item of raw.items.slice(0, 200)) {
      if (!item || !['room', 'camera', 'presence'].includes(item.kind) || typeof item.id !== 'string') continue;
      const id = item.id.slice(0, 80);
      if (!id || ids.has(id) || kindCounts[item.kind] >= (item.kind === 'camera' ? 40 : 80)) continue;
      ids.add(id);
      kindCounts[item.kind]++;
      plan.items.push(constrainItem({id, kind: item.kind,
        name: typeof item.name === 'string' ? item.name.slice(0, 48) : item.kind,
        floor: Number(item.floor), x: Number(item.x), y: Number(item.y),
        width: Number(item.width), depth: Number(item.depth), rotation: Number(item.rotation),
        range: Number(item.range), fov: Number(item.fov)}, plan));
    }
  }
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
    rooms: plan.items.filter(i => i.kind === 'room').length};
}

export function placementSubmission(plan: PlacementPlan) {
  return JSON.stringify({version: 1, units: 'feet', width: plan.width, depth: plan.depth,
    items: plan.items, coverage: 'Illustrative only; no wall occlusion, mounting height, or model validation.',
    floorPlanImagesAttached: false});
}
