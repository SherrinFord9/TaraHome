import {useEffect, useRef, useState, type ReactNode} from 'react';
import {
  Camera, Radar, SquarePlus, MousePointer2, Hand, Undo2, Redo2, ZoomIn, ZoomOut,
  Maximize, Upload, Download, Trash2, X, Check, Plus, RotateCcw, RotateCw, Copy,
  PanelsTopLeft, DoorOpen, Contact, Lightbulb, ToggleLeft, Thermometer, BellRing,
  ServerCog, Speaker, Mic2, PlugZap, Blinds, LockKeyhole, Tv, Bot, Leaf,
  Droplets, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pencil, List, Search, Ruler,
  type LucideIcon,
} from 'lucide-react';
import {Stage, Layer, Rect, Line, Text, Group, Circle, Wedge, Arc, Image as CanvasImage} from 'react-konva';
import type Konva from 'konva';
import {
  bound, constrainItem, placementCounts, snap, placementCatalog, itemDetails,
  itemLimit, isOpening, hasCoverage, normalizeRotation, updatePlacement, removePlacement,
  snapOpening, type PlacementItem, type PlacementPlan, type PlacementKind,
} from './placement-plan';
import '../../styles/placement-planner.css';

type Props = {
  value: PlacementPlan; onChange: (plan: PlacementPlan) => void; levels: number;
  cameraZones: number; presenceZones: number;
  saveState: 'idle' | 'saving' | 'saved';
  onApplyCounts: (cameras: number, presence: number) => void; onClose: () => void;
};
type Panel = 'add' | 'edit' | 'items';
const icons: Record<PlacementKind, LucideIcon> = {
  room: SquarePlus, window: PanelsTopLeft, door: DoorOpen, camera: Camera, presence: Radar,
  windowSensor: PanelsTopLeft, doorSensor: Contact, light: Lightbulb, switch: ToggleLeft,
  thermostat: Thermometer, doorbell: BellRing, hub: ServerCog, speaker: Speaker, voice: Mic2,
  plug: PlugZap, shade: Blinds, lock: LockKeyhole, tv: Tv, vacuum: Bot, mower: Leaf, leak: Droplets,
};
const roomNames = ['Living room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining room', 'Office', 'Hallway', 'Garage', 'Yard / patio'];

function Tool({label, children, onClick, active, disabled}: {
  label: string; children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}

function NumberField({label, value, min, max, step = 0.5, onChange}: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const next = text.trim() === '' ? value : bound(Number(text), min, max);
    setText(String(next)); onChange(next);
  };
  return <label><span>{label}</span><input type="number" inputMode="decimal" step={step} min={min} max={max} value={text}
    onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => {if (e.key === 'Enter') {e.preventDefault(); commit();}}} /></label>;
}

export default function PlacementPlanner({value, onChange, levels, cameraZones, presenceZones, saveState, onApplyCounts, onClose}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const surface = useRef<HTMLDivElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const glyphSource = useRef<HTMLDivElement>(null);
  const [glyphs, setGlyphs] = useState<Record<string, HTMLImageElement>>({});
  const [floor, setFloor] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('add');
  const [search, setSearch] = useState('');
  const [tool, setTool] = useState<'select' | 'room' | 'pan'>('select');
  const [size, setSize] = useState({width: 800, height: 480});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [past, setPast] = useState<PlacementPlan[]>([]);
  const [future, setFuture] = useState<PlacementPlan[]>([]);
  const [drawing, setDrawing] = useState<{x: number; y: number; endX: number; endY: number} | null>(null);
  const drawingRef = useRef<typeof drawing>(null);
  const [turning, setTurning] = useState<{id: string; angle: number} | null>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCoverage, setShowCoverage] = useState(true);
  const uploadGeneration = useRef(0);
  const latest = useRef({value, commit});
  latest.current = {value, commit};
  const counts = placementCounts(value);
  const floorCount = Math.max(levels, floor, ...value.items.map(i => i.floor), ...Object.keys(value.images).map(Number));
  const items = value.items.filter(i => i.floor === floor);
  const item = items.find(i => i.id === selected);
  const rooms = items.filter(i => i.kind === 'room');
  const scale = Math.max(0.1, Math.min((size.width - 32) / value.width, (size.height - 40) / value.depth)) * zoom;
  const offset = {x: (size.width - value.width * scale) / 2 + pan.x, y: (size.height - value.depth * scale) / 2 + pan.y};
  const imageData = value.images[floor];
  const roomFor = (placement: PlacementItem) => rooms.find(room => placement.x >= room.x && placement.x <= room.x + room.width && placement.y >= room.y && placement.y <= room.y + room.depth);
  const angleFor = (placement: PlacementItem) => turning?.id === placement.id ? turning.angle : placement.rotation;

  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; node.showModal();
    return () => {uploadGeneration.current++; node.close(); document.body.style.overflow = overflow; previous?.focus();};
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({width: entry.contentRect.width, height: entry.contentRect.height}));
    observer.observe(surface.current!); return () => observer.disconnect();
  }, []);

  // Use the same Lucide artwork in the catalogue, canvas and PNG export.
  useEffect(() => {
    let alive = true;
    const entries = [...glyphSource.current!.querySelectorAll<SVGSVGElement>('svg')].map(svg => new Promise<[string, HTMLImageElement]>(resolve => {
      const image = new window.Image();
      image.onload = () => resolve([svg.parentElement!.dataset.glyph!, image]);
      image.onerror = () => resolve([svg.parentElement!.dataset.glyph!, image]);
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    }));
    void Promise.all(entries).then(images => {if (alive) setGlyphs(Object.fromEntries(images.filter(([, image]) => image.naturalWidth > 0)));});
    return () => {alive = false;};
  }, []);

  useEffect(() => {
    setBackground(null);
    if (!imageData) return;
    let alive = true;
    const image = new window.Image();
    image.onload = () => {if (alive) setBackground(image);};
    image.onerror = () => {if (alive) setError('This floor-plan image could not be opened. Remove it and upload another image.');};
    image.src = imageData;
    return () => {alive = false;};
  }, [imageData]);

  function commit(next: PlacementPlan) {
    if (JSON.stringify(next) === JSON.stringify(value)) return;
    setPast(list => [...list.slice(-24), value]); setFuture([]); onChange(next); setNotice('');
  }
  function update(patch: Partial<PlacementItem>) {
    if (item) commit(updatePlacement(value, item.id, patch));
  }
  function focusMap() {
    surface.current?.closest('.tp-body')?.scrollTo({top: 0});
    surface.current?.closest('.tp-map-column')?.scrollTo({top: 0});
  }
  function showPanel(next: Panel) {
    setPanel(next);
    if (window.matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => inspector.current?.scrollIntoView({block: 'start'}));
    else inspector.current?.scrollTo({top: 0});
  }
  function select(id: string) {setSelected(id); setPanel('edit'); setTool('select'); setTurning(null);}
  function fit() {setZoom(1); setPan({x: 0, y: 0}); focusMap();}
  function frameRoom(room: PlacementItem) {
    const base = Math.max(0.1, Math.min((size.width - 32) / value.width, (size.height - 40) / value.depth));
    const nextZoom = bound(Math.min((size.width - 64) / (room.width + 8), (size.height - 64) / (room.depth + 8)) / base, 0.5, 3);
    setZoom(nextZoom);
    setPan({x: (value.width / 2 - room.x - room.width / 2) * base * nextZoom, y: (value.depth / 2 - room.y - room.depth / 2) * base * nextZoom});
  }
  function undo() {
    const previous = past.at(-1); if (!previous) return;
    setPast(past.slice(0, -1)); setFuture([value, ...future]); onChange(previous); setTurning(null);
  }
  function redo() {
    const next = future[0]; if (!next) return;
    setPast([...past, value]); setFuture(future.slice(1)); onChange(next); setTurning(null);
  }
  function allowed(kind: PlacementKind, extra = 1) {
    if (value.items.filter(i => i.kind === kind).length >= itemLimit(kind) || value.items.length + extra > 600) {
      setError('The plan has reached its ' + itemDetails(kind).label.toLowerCase() + ' limit.'); return false;
    }
    return true;
  }
  function add(kind: PlacementKind, geometry: Partial<PlacementItem> = {}) {
    if (!allowed(kind)) return;
    const index = value.items.filter(i => i.kind === kind).length + 1;
    const room = item?.kind === 'room' ? item : item && roomFor(item) || rooms.at(-1);
    const deviceIndex = items.filter(i => i.kind !== 'room' && !isOpening(i.kind)).length;
    const preferred = kind === 'camera' ? [0.8, 0.75] : kind === 'presence' ? [0.2, 0.75] : kind === 'speaker' ? [0.2, 0.4] : [0.5, 0.5];
    const candidates = room ? [preferred, ...[0.25, 0.5, 0.75].flatMap(y => [0.2, 0.5, 0.8].map(x => [x, y]))]
      .map(([x, y]) => ({x: room.x + room.width * x, y: room.y + room.depth * y})) : [];
    const devices = items.filter(i => i.kind !== 'room' && !isOpening(i.kind));
    const distance = (p: {x: number; y: number}) => Math.min(...devices.map(i => Math.hypot(i.x - p.x, i.y - p.y)));
    const position = candidates.find(p => distance(p) >= 4) || candidates.sort((a, b) => distance(b) - distance(a))[0];
    const opening = (kind === 'windowSensor' && item?.kind === 'window') || (kind === 'doorSensor' && item?.kind === 'door') ? item : undefined;
    if (opening && value.items.some(i => i.attachedTo === opening.id && i.kind === kind)) {
      select(value.items.find(i => i.attachedTo === opening.id && i.kind === kind)!.id); return;
    }
    const added = constrainItem({
      id: crypto.randomUUID(), kind, name: itemDetails(kind).label + ' ' + index, floor,
      x: position?.x ?? value.width / 2 + deviceIndex % 3 * 4 - 4,
      y: position?.y ?? value.depth / 2 + Math.floor(deviceIndex / 3) % 3 * 4 - 4,
      width: 12, depth: 10, rotation: 0, range: kind === 'camera' ? 25 : 12, fov: kind === 'camera' ? 90 : 120,
      ...(kind === 'room' ? {name: rooms.length ? 'Room ' + index : 'Living room', x: 4 + rooms.length % 3 * 20, y: 4 + Math.floor(rooms.length / 3) * 16, width: 16, depth: 12} : {}),
      ...(isOpening(kind) ? {x: room ? room.x + room.width / 2 : value.width / 2, y: room ? room.y + (kind === 'door' ? room.depth : 0) : value.depth / 2, width: kind === 'window' ? 4 : 3, depth: 0.5} : {}),
      ...(opening ? {attachedTo: opening.id, name: opening.name + ' sensor', x: opening.x, y: opening.y, rotation: opening.rotation} : {}),
      ...geometry,
    }, value);
    commit({...value, items: [...value.items, added]}); select(added.id); setError('');
    if (kind === 'room') frameRoom(added); else if (room) frameRoom(room);
    focusMap();
  }
  function duplicate() {
    if (!item || !allowed(item.kind)) return;
    add(item.kind, {...item, id: crypto.randomUUID(), attachedTo: undefined, name: (item.name + ' copy').slice(0, 48), x: item.x + 3, y: item.y + 3});
  }
  function remove() {
    if (!item) return;
    commit(removePlacement(value, item.id)); setSelected(null); setPanel('items');
  }
  function rotate(amount: number) {
    if (!item) return;
    if (item.kind === 'room') update({width: item.depth, depth: item.width});
    else update({rotation: normalizeRotation(item.rotation + amount)});
  }
  function move(dx: number, dy: number) {
    if (item) update({x: item.x + dx, y: item.y + dy, attachedTo: undefined});
  }
  function point() {
    const p = stage.current?.getRelativePointerPosition();
    return p ? {x: bound(snap(p.x), 0, value.width), y: bound(snap(p.y), 0, value.depth)} : null;
  }
  function finishRoom() {
    const finished = drawingRef.current;
    if (!finished) return;
    drawingRef.current = null;
    const width = Math.abs(finished.endX - finished.x), depth = Math.abs(finished.endY - finished.y);
    add('room', {x: Math.min(finished.x, finished.endX), y: Math.min(finished.y, finished.endY), width: width < 2 ? 12 : width, depth: depth < 2 ? 10 : depth});
    setDrawing(null);
  }
  function dragEnd(placement: PlacementItem, node: Konva.Node) {
    const next = snapOpening({...placement, attachedTo: undefined, x: snap(node.x()), y: snap(node.y())}, value);
    node.position({x: next.x, y: next.y}); commit(updatePlacement(value, placement.id, next));
  }
  function turnHandle(node: Konva.Node, finish: boolean) {
    if (!item) return;
    const pointer = stage.current?.getRelativePointerPosition();
    if (!pointer) return;
    const angle = normalizeRotation(Math.atan2(pointer.y - item.y, pointer.x - item.x) * 180 / Math.PI);
    node.position({x: item.x + Math.cos(angle * Math.PI / 180) * 58 / scale, y: item.y + Math.sin(angle * Math.PI / 180) * 58 / scale});
    if (finish) {update({rotation: angle}); setTurning(null);}
    else setTurning({id: item.id, angle});
  }
  async function upload(file?: File) {
    if (!file) return;
    const generation = ++uploadGeneration.current;
    setError(''); setImageBusy(true);
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a PNG, JPG, or WebP image under 10 MB.');
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const data = canvas.toDataURL('image/webp', 0.8), current = latest.current.value;
      const total = Object.entries(current.images).filter(([f]) => f !== String(floor)).reduce((sum, [, image]) => sum + image.length, data.length);
      if (data.length > 400_000 || total > 1_200_000) throw new Error('This image is too detailed to save locally. Choose a smaller image or remove an unused floor-plan image.');
      if (generation !== uploadGeneration.current) return;
      latest.current.commit({...current, images: {...current.images, [floor]: data}});
    } catch (err) {
      if (generation === uploadGeneration.current) setError(err instanceof Error ? err.message : 'The image could not be opened.');
    } finally {if (generation === uploadGeneration.current) setImageBusy(false);}
  }
  function download() {
    if (!stage.current) return;
    const canvas = document.createElement('canvas');
    const mapHeight = Math.min(2000, Math.round(1600 * value.depth / value.width));
    const mapWidth = Math.min(1600, mapHeight * value.width / value.depth);
    canvas.width = 1600; canvas.height = mapHeight + 110;
    const ctx = canvas.getContext('2d')!;
    const handles = stage.current.find('.tp-selection-handle');
    handles.forEach(node => node.hide());
    const image = stage.current.toCanvas({x: offset.x, y: offset.y, width: value.width * scale, height: value.depth * scale, pixelRatio: 2});
    handles.forEach(node => node.show());
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, (canvas.width - mapWidth) / 2, 0, mapWidth, mapHeight);
    ctx.fillStyle = '#193a32'; ctx.font = '22px sans-serif';
    ctx.fillText('Tara | Floor ' + floor + ' | ' + value.width + ' x ' + value.depth + ' ft | Illustrative coverage', 24, canvas.height - 72);
    ctx.font = '18px sans-serif'; ctx.fillText('Walls, mounting height and device specifications are not simulated. Confirm placement on site.', 24, canvas.height - 42);
    ctx.fillText('Additional devices are scope requests, not confirmed included hardware.', 24, canvas.height - 16);
    const link = document.createElement('a'); link.download = 'tara-placement-floor-' + floor + '.png'; link.href = canvas.toDataURL('image/png'); link.click();
  }
  const imageFit = background ? Math.min(value.width / background.width, value.depth / background.height) : 1;
  const mismatch = counts.cameras !== cameraZones || counts.presence !== presenceZones;
  const SelectedIcon = item ? icons[item.kind] : MousePointer2;
  const attachedSensor = item && value.items.find(i => i.attachedTo === item.id);
  const sensorKind = item?.kind === 'window' ? 'windowSensor' : 'doorSensor';
  const visibleCatalog = placementCatalog.filter(entry => entry.label.toLowerCase().includes(search.toLowerCase().trim()));

  return <dialog ref={dialog} className="tara-placement" aria-labelledby="tara-placement-title" aria-describedby="tara-placement-caveat" data-analytics-private onCancel={e => {e.preventDefault(); onClose();}}>
    <div ref={glyphSource} hidden aria-hidden="true">{placementCatalog.map(entry => {const Icon = icons[entry.kind]; return <span key={entry.kind} data-glyph={entry.kind}><Icon size={24} color="#ffffff" /></span>;})}<span data-glyph="rotate"><RotateCw size={24} color="#ffffff" /></span></div>
    <header className="tp-header"><div><span>Tara / Home plan</span><h2 id="tara-placement-title">Plan your rooms & devices</h2></div><Tool label="Close placement planner" onClick={onClose}><X /></Tool></header>
    <div className="tp-toolbar" aria-label="Map tools">
      <button type="button" className="tp-add-button" onClick={() => showPanel('add')}><Plus /><span>Add items</span></button>
      <div className="tp-tools"><Tool label="Undo" disabled={!past.length} onClick={undo}><Undo2 /></Tool><Tool label="Redo" disabled={!future.length} onClick={redo}><Redo2 /></Tool></div>
      <div className="tp-tools tp-files"><Tool label="Upload floor plan" disabled={imageBusy} onClick={() => fileInput.current?.click()}><Upload /></Tool>
        <Tool label="Download floor map" disabled={imageBusy || Boolean(imageData && !background) || !Object.keys(glyphs).length} onClick={download}><Download /></Tool>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => {void upload(e.target.files?.[0]); e.target.value = '';}} />
      </div>
    </div>
    <div className="tp-body">
      <div className="tp-map-column">
        <div className="tp-map-bar">
          <div className="tp-floor"><label htmlFor="tp-floor">Floor</label><select id="tp-floor" value={floor} disabled={imageBusy} onChange={e => {setFloor(Number(e.target.value)); setSelected(null); setTurning(null); fit();}}>
            {Array.from({length: floorCount}, (_, i) => <option key={i} value={i + 1}>Floor {i + 1}</option>)}
          </select></div>
          <div className="tp-tools"><Tool label="Select and move" active={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 /></Tool>
            <Tool label="Draw room" active={tool === 'room'} onClick={() => {setTool('room'); focusMap();}}><SquarePlus /></Tool>
            <Tool label="Pan map" active={tool === 'pan'} onClick={() => {setTool('pan'); focusMap();}}><Hand /></Tool></div>
          <label className="tp-check"><input type="checkbox" checked={showCoverage} onChange={e => setShowCoverage(e.target.checked)} /> Coverage</label>
        </div>
        <div className="tp-selection-bar">
          <div className="tp-selection-name"><SelectedIcon /><strong>{item?.name || 'Floor ' + floor}</strong>
            {item && <Tool label="Edit selected placement" onClick={() => showPanel('edit')}><Pencil /></Tool>}</div>
          {item ? <div className="tp-quick-actions">
            <div className="tp-rotate"><span>Rotate</span><Tool label={item.kind === 'room' ? 'Rotate room left 90 degrees' : 'Rotate left 45 degrees'} disabled={Boolean(item.attachedTo)} onClick={() => rotate(-45)}><RotateCcw /></Tool>
              <output aria-label="Rotation">{item.kind === 'room' ? '90\u00b0' : angleFor(item) + '\u00b0'}</output>
              <Tool label={item.kind === 'room' ? 'Rotate room right 90 degrees' : 'Rotate right 45 degrees'} disabled={Boolean(item.attachedTo)} onClick={() => rotate(45)}><RotateCw /></Tool></div>
            <div className="tp-tools"><Tool label="Duplicate selected placement" onClick={duplicate}><Copy /></Tool><Tool label="Delete selected placement" onClick={remove}><Trash2 /></Tool></div>
          </div> : <button type="button" onClick={() => add('room')}><SquarePlus />{items.length ? 'Add room' : 'Add first room'}</button>}
          {item && isOpening(item.kind) && <button type="button" className="tp-attach-button" onClick={() => attachedSensor ? select(attachedSensor.id) : add(sensorKind)}>
            {attachedSensor ? <Check /> : <Plus />}{attachedSensor ? 'Sensor attached' : 'Add ' + (item.kind === 'window' ? 'window' : 'door') + ' sensor'}</button>}
        </div>
        <div ref={surface} className={'tp-surface tp-mode-' + tool} aria-label={'Floor ' + floor + ' placement map'} role="img">
          <Stage ref={stage} width={size.width} height={size.height} scaleX={scale} scaleY={scale} x={offset.x} y={offset.y}
            draggable={tool === 'pan'} onDragEnd={e => {if (e.target === stage.current) setPan({x: e.target.x() - (size.width - value.width * scale) / 2, y: e.target.y() - (size.height - value.depth * scale) / 2});}}
            onPointerDown={e => {
              if (tool === 'room') {const p = point(); if (p) {drawingRef.current = {...p, endX: p.x, endY: p.y}; setDrawing(drawingRef.current);}}
              else if (e.target === stage.current) {setSelected(null); setTurning(null);}
            }}
            onPointerMove={() => {if (drawingRef.current) {const p = point(); if (p) {drawingRef.current = {...drawingRef.current, endX: p.x, endY: p.y}; setDrawing(drawingRef.current);}}}}
            onPointerUp={finishRoom} onPointerLeave={finishRoom}>
            <Layer>
              <Rect width={value.width} height={value.depth} fill="#fafcfb" stroke="#b8c8c1" strokeWidth={1 / scale} listening={false} />
              <Group clipX={0} clipY={0} clipWidth={value.width} clipHeight={value.depth}>
                {background && <CanvasImage image={background} x={(value.width - background.width * imageFit) / 2} y={(value.depth - background.height * imageFit) / 2} width={background.width * imageFit} height={background.height * imageFit} opacity={0.65} listening={false} />}
                {Array.from({length: Math.floor(value.width / 5) + 1}, (_, i) => <Line key={'x' + i} points={[i * 5, 0, i * 5, value.depth]} stroke="#dfe7e2" strokeWidth={0.7 / scale} listening={false} />)}
                {Array.from({length: Math.floor(value.depth / 5) + 1}, (_, i) => <Line key={'y' + i} points={[0, i * 5, value.width, i * 5]} stroke="#dfe7e2" strokeWidth={0.7 / scale} listening={false} />)}
                {items.filter(i => i.kind === 'room').map(room => <Group key={room.id} x={room.x} y={room.y} draggable={tool === 'select'}
                  onClick={() => tool === 'select' && select(room.id)} onTap={() => tool === 'select' && select(room.id)} onDragStart={() => select(room.id)} onDragEnd={e => dragEnd(room, e.target)}>
                  <Rect width={room.width} height={room.depth} fill={room.id === selected ? '#d4e9dd70' : '#e5ede54d'} stroke={room.id === selected ? '#297253' : '#6b8077'} strokeWidth={(room.id === selected ? 4 : 3) / scale} />
                  <Text text={room.name} x={8 / scale} y={8 / scale} width={Math.max(0, room.width - 16 / scale)} height={Math.max(0, room.depth - 16 / scale)} fontSize={15 / scale} fill="#224c3b" ellipsis wrap="none" listening={false} />
                </Group>)}
                {items.filter(i => isOpening(i.kind)).map(opening => <Group key={opening.id} x={opening.x} y={opening.y} draggable={tool === 'select'}
                  onClick={() => tool === 'select' && select(opening.id)} onTap={() => tool === 'select' && select(opening.id)} onDragStart={() => select(opening.id)} onDragEnd={e => dragEnd(opening, e.target)}>
                  <Group rotation={angleFor(opening)}>
                    <Rect x={-opening.width / 2} y={-7 / scale} width={opening.width} height={14 / scale} fill="#fafcfb" stroke={selected === opening.id ? '#193a32' : itemDetails(opening.kind).color} strokeWidth={2 / scale} hitStrokeWidth={30 / scale} />
                    {opening.kind === 'window' ? <Line points={[-opening.width / 2, 0, opening.width / 2, 0]} stroke="#287697" strokeWidth={2 / scale} listening={false} /> : <>
                      <Line points={[-opening.width / 2, 0, -opening.width / 2, -opening.width]} stroke="#426855" strokeWidth={2 / scale} listening={false} />
                      <Arc x={-opening.width / 2} innerRadius={opening.width} outerRadius={opening.width} angle={90} rotation={-90} stroke="#6b8077" strokeWidth={1 / scale} listening={false} />
                    </>}
                  </Group>
                </Group>)}
                {items.filter(i => i.kind !== 'room' && !isOpening(i.kind)).map(device => {
                  const color = itemDetails(device.kind).color, angle = angleFor(device);
                  const attached = Boolean(device.attachedTo);
                  const side = device.kind === 'windowSensor' ? -1 : 1;
                  const dx = attached ? -Math.sin(angle * Math.PI / 180) * 30 / scale * side : 0;
                  const dy = attached ? Math.cos(angle * Math.PI / 180) * 30 / scale * side : 0;
                  return <Group key={device.id} x={device.x} y={device.y} draggable={tool === 'select' && !attached}
                    onClick={() => tool === 'select' && select(device.id)} onTap={() => tool === 'select' && select(device.id)} onDragStart={() => select(device.id)} onDragEnd={e => dragEnd(device, e.target)}>
                    {showCoverage && hasCoverage(device.kind) && <Wedge radius={device.range} angle={device.fov} rotation={angle - device.fov / 2} fill={device.kind === 'camera' ? '#61abde30' : '#e4a16e30'} stroke={color} strokeWidth={1 / scale} dash={device.kind === 'presence' ? [4 / scale, 4 / scale] : undefined} listening={false} />}
                    {attached && <Line points={[0, 0, dx, dy]} stroke={color} strokeWidth={2 / scale} listening={false} />}
                    <Circle x={dx} y={dy} radius={(selected === device.id ? 22 : 19) / scale} fill={color} stroke="#fff" strokeWidth={2 / scale} hitStrokeWidth={8 / scale} />
                    {glyphs[device.kind] && <CanvasImage image={glyphs[device.kind]} x={dx} y={dy} offsetX={12 / scale} offsetY={12 / scale} rotation={angle} width={24 / scale} height={24 / scale} listening={false} />}
                    {selected === device.id && <Text text={device.name} x={dx - 54 / scale} y={dy + 25 / scale} width={108 / scale} height={18 / scale} align="center" fontSize={13 / scale} fill="#193a32" ellipsis wrap="none" listening={false} />}
                    {hasCoverage(device.kind) && <Line points={[0, 0, Math.cos(angle * Math.PI / 180) * 30 / scale, Math.sin(angle * Math.PI / 180) * 30 / scale]} stroke={color} strokeWidth={3 / scale} listening={false} />}
                  </Group>;
                })}
                {drawing && <Rect x={Math.min(drawing.x, drawing.endX)} y={Math.min(drawing.y, drawing.endY)} width={Math.abs(drawing.endX - drawing.x)} height={Math.abs(drawing.endY - drawing.y)} fill="#b8dbc880" stroke="#297253" strokeWidth={2 / scale} listening={false} />}
              </Group>
              {item && item.kind !== 'room' && !item.attachedTo && tool === 'select' && <Group name="tp-selection-handle">
                <Line points={[item.x, item.y, item.x + Math.cos(angleFor(item) * Math.PI / 180) * 58 / scale, item.y + Math.sin(angleFor(item) * Math.PI / 180) * 58 / scale]} stroke="#193a32" strokeWidth={2 / scale} dash={[3 / scale, 3 / scale]} listening={false} />
                <Group x={item.x + Math.cos(angleFor(item) * Math.PI / 180) * 58 / scale} y={item.y + Math.sin(angleFor(item) * Math.PI / 180) * 58 / scale} draggable
                  onPointerDown={e => {e.cancelBubble = true;}} onDragStart={e => {e.cancelBubble = true;}}
                  onDragMove={e => {e.cancelBubble = true; turnHandle(e.target, false);}} onDragEnd={e => {e.cancelBubble = true; turnHandle(e.target, true);}}>
                  <Circle radius={22 / scale} fill="#193a32" stroke="#fff" strokeWidth={2 / scale} />
                  {glyphs.rotate && <CanvasImage image={glyphs.rotate} x={-12 / scale} y={-12 / scale} width={24 / scale} height={24 / scale} listening={false} />}
                </Group>
              </Group>}
              <Text text={value.width + ' x ' + value.depth + ' ft | Grid: 5 ft'} y={value.depth + 5 / scale} fontSize={12 / scale} fill="#486256" listening={false} />
            </Layer>
          </Stage>
        </div>
        <div className="tp-map-bottom"><span>{imageBusy ? 'Opening image...' : items.length + ' items on this floor'}</span><div className="tp-tools">
          <Tool label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut /></Tool>
          <Tool label="Fit map" onClick={fit}><Maximize /></Tool><Tool label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}><ZoomIn /></Tool>
        </div></div>
        <p className="tp-caveat" id="tara-placement-caveat">Illustrative camera and mmWave coverage. Walls, furniture, mounting height and actual device performance are not simulated.</p>
        {error && <p className="tp-error" role="alert">{error}</p>}
      </div>
      <aside ref={inspector} className="tp-inspector" aria-label="Placement properties">
        <div className="tp-panel-tabs" role="tablist" aria-label="Placement options">
          {(['add', 'edit', 'items'] as const).map((tab, index) => <button type="button" key={tab} role="tab" id={'tp-tab-' + tab} aria-selected={panel === tab} aria-controls={'tp-panel-' + tab} tabIndex={panel === tab ? 0 : -1}
            onKeyDown={e => {if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {e.preventDefault(); const next = (['add', 'edit', 'items'] as const)[(index + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setPanel(next); document.getElementById('tp-tab-' + next)?.focus();}}} onClick={() => setPanel(tab)}>
            {tab === 'add' ? <Plus /> : tab === 'edit' ? <Pencil /> : <List />}{tab === 'add' ? 'Add' : tab === 'edit' ? 'Edit' : 'Items'}</button>)}
        </div>
        <div role="tabpanel" id="tp-panel-add" aria-labelledby="tp-tab-add" hidden={panel !== 'add'}>
          <label className="tp-search"><span><Search /> Find an item</span><input type="search" placeholder="Window, speaker..." value={search} onChange={e => setSearch(e.target.value)} /></label>
          {['Rooms & openings', 'Kit devices', 'Compatible add-ons'].map(group => {
            const entries = visibleCatalog.filter(entry => entry.group === group);
            return entries.length ? <section key={group} className="tp-catalog-section"><h3>{group}</h3><div className="tp-catalog">
              {entries.map(entry => {const Icon = icons[entry.kind]; return <button type="button" key={entry.kind} aria-label={entry.kind === 'presence' ? 'Add mmWave sensor' : 'Add ' + entry.label.toLowerCase()} onClick={() => add(entry.kind)}><Icon /><span>{entry.label}</span><Plus className="tp-small-plus" /></button>;})}
            </div></section> : null;
          })}
          {!visibleCatalog.length && <p>No matching items.</p>}
          <p>Exact products and compatibility are confirmed during scope review. Add-ons are not automatically included in the kit price.</p>
        </div>
        <div role="tabpanel" id="tp-panel-edit" aria-labelledby="tp-tab-edit" hidden={panel !== 'edit'}>
          {item ? <section>
            <h3>{itemDetails(item.kind).label}</h3>
            <label><span>Name</span><input maxLength={48} value={item.name} onChange={e => update({name: e.target.value})} /></label>
            {item.kind === 'room' && <label><span>Room type</span><select value={roomNames.includes(item.name) ? item.name : ''} onChange={e => {if (e.target.value) update({name: e.target.value});}}><option value="">Custom name</option>{roomNames.map(name => <option key={name}>{name}</option>)}</select></label>}
            {item.kind !== 'room' && !item.attachedTo && rooms.length > 0 && <label><span>Room or area</span><select value={roomFor(item)?.id || ''} onChange={e => {const room = rooms.find(r => r.id === e.target.value); if (room) update({x: room.x + room.width / 2, y: isOpening(item.kind) ? room.y : room.y + room.depth / 2});}}>
              <option value="">Outside rooms</option>{rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>}
            {item.attachedTo ? <><p>Attached to {items.find(i => i.id === item.attachedTo)?.name}.</p><button type="button" onClick={() => update({attachedTo: undefined})}>Detach sensor</button></> : <>
              <div className="tp-nudge"><span>Move 1 ft</span><div className="tp-tools">
                <Tool label="Move left 1 foot" onClick={() => move(-1, 0)}><ArrowLeft /></Tool><Tool label="Move up 1 foot" onClick={() => move(0, -1)}><ArrowUp /></Tool>
                <Tool label="Move down 1 foot" onClick={() => move(0, 1)}><ArrowDown /></Tool><Tool label="Move right 1 foot" onClick={() => move(1, 0)}><ArrowRight /></Tool>
              </div></div>
              {item.kind !== 'room' && <label htmlFor="tp-direction"><span>Direction <output aria-hidden="true">{angleFor(item)} deg</output></span><input id="tp-direction" type="range" min={0} max={359} step={1} value={angleFor(item)}
                onChange={e => setTurning({id: item.id, angle: Number(e.target.value)})} onPointerUp={e => {update({rotation: Number(e.currentTarget.value)}); setTurning(null);}}
                onKeyUp={e => {update({rotation: Number(e.currentTarget.value)}); setTurning(null);}} onBlur={e => {update({rotation: Number(e.currentTarget.value)}); setTurning(null);}} /></label>}
            </>}
            {item.kind === 'room' && <div className="tp-fields"><NumberField label="Width (ft)" value={item.width} min={2} max={value.width} onChange={width => update({width})} /><NumberField label="Depth (ft)" value={item.depth} min={2} max={value.depth} onChange={depth => update({depth})} /></div>}
            {isOpening(item.kind) && <NumberField label="Opening width (ft)" value={item.width} min={1} max={20} onChange={width => update({width})} />}
            {hasCoverage(item.kind) && <div className="tp-fields"><NumberField label="Range (ft)" value={item.range} min={1} max={100} onChange={range => update({range})} /><NumberField label="Angle (deg)" value={item.fov} min={10} max={360} onChange={fov => update({fov})} /></div>}
            {!item.attachedTo && <details className="tp-exact"><summary>Exact position</summary><div className="tp-fields"><NumberField label="X (ft)" value={item.x} min={0} max={value.width} onChange={x => update({x})} /><NumberField label="Y (ft)" value={item.y} min={0} max={value.depth} onChange={y => update({y})} /></div></details>}
          </section> : <section><h3>No item selected</h3><button type="button" onClick={() => setPanel('add')}><Plus /> Add an item</button></section>}
          <details className="tp-map-settings"><summary><Ruler /> Map dimensions</summary><div className="tp-fields">
            <NumberField label="Map width (ft)" value={value.width} min={10} max={200} onChange={width => {const next = {...value, width}; commit({...next, items: next.items.map(i => constrainItem(i, next))}); fit();}} />
            <NumberField label="Map depth (ft)" value={value.depth} min={10} max={200} onChange={depth => {const next = {...value, depth}; commit({...next, items: next.items.map(i => constrainItem(i, next))}); fit();}} />
          </div></details>
        </div>
        <div role="tabpanel" id="tp-panel-items" aria-labelledby="tp-tab-items" hidden={panel !== 'items'}>
          <section><h3>Floor {floor} items</h3><div className="tp-item-list">
            {items.map(i => {const Icon = icons[i.kind]; return <button key={i.id} type="button" aria-pressed={i.id === selected} onClick={() => {select(i.id); focusMap();}}><Icon /><span>{i.name || 'Unnamed placement'}</span></button>;})}
            {!items.length && <p>No placements yet.</p>}
          </div>{imageData && <button type="button" className="tp-text-button" disabled={imageBusy} onClick={() => {const images = {...value.images}; delete images[floor]; commit({...value, images});}}><Trash2 /> Remove floor-plan image</button>}</section>
          <section className="tp-counts"><h3>Camera & presence estimate</h3><dl><div><dt>Cameras placed</dt><dd>{counts.cameras}</dd></div><div><dt>mmWave sensors placed</dt><dd>{counts.presence}</dd></div></dl>
            <p>Current quote: {cameraZones} camera zones, {presenceZones} presence zones. Other placements go to scope review and are not priced here.</p>
            <button type="button" className="tp-apply" disabled={!mismatch || counts.cameras + counts.presence === 0} onClick={() => {onApplyCounts(counts.cameras, counts.presence); setNotice('Camera and presence counts applied to the quote.');}}><Check /> Apply counts to quote</button>
            {notice && <p role="status">{notice}</p>}
          </section>
        </div>
      </aside>
    </div>
    <footer className="tp-footer"><p>{saveState === 'saved' ? 'Saved on this device.' : saveState === 'saving' ? 'Saving plan...' : 'Not saved on this device.'} Floor-plan images are not sent with your inquiry.</p><button type="button" onClick={onClose}><Check /> Done</button></footer>
  </dialog>;
}
