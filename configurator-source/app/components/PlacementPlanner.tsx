import {useEffect, useRef, useState, type ReactNode} from 'react';
import {Camera, Radar, SquarePlus, MousePointer2, Hand, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Upload, Download, Trash2, X, Check} from 'lucide-react';
import {Stage, Layer, Rect, Line, Text, Group, Circle, Wedge, Image as CanvasImage} from 'react-konva';
import type Konva from 'konva';
import {bound, constrainItem, placementCounts, snap, type PlacementItem, type PlacementPlan} from './placement-plan';
import '../../styles/placement-planner.css';

type Props = {
  value: PlacementPlan;
  onChange: (plan: PlacementPlan) => void;
  levels: number;
  cameraZones: number;
  presenceZones: number;
  onApplyCounts: (cameras: number, presence: number) => void;
  onClose: () => void;
};

function Tool({label, children, onClick, active, disabled}: {
  label: string; children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>;
}

function NumberField({label, value, min, max, onChange}: {label: string; value: number; min: number; max: number; onChange: (n: number) => void}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {const next = bound(Number(text), min, max); setText(String(next)); onChange(next);};
  return <label><span>{label}</span><input type="number" inputMode="decimal" step="0.5" min={min} max={max} value={text}
    onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => {if (e.key === 'Enter') {e.preventDefault(); commit();}}} /></label>;
}

export default function PlacementPlanner({value, onChange, levels, cameraZones, presenceZones, onApplyCounts, onClose}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<Konva.Stage>(null);
  const surface = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [floor, setFloor] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'room' | 'pan'>('select');
  const [size, setSize] = useState({width: 800, height: 480});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [past, setPast] = useState<PlacementPlan[]>([]);
  const [future, setFuture] = useState<PlacementPlan[]>([]);
  const [drawing, setDrawing] = useState<{x: number; y: number; endX: number; endY: number} | null>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCoverage, setShowCoverage] = useState(true);
  const uploadGeneration = useRef(0);
  const latest = useRef({value, commit});
  latest.current = {value, commit};
  const counts = placementCounts(value);
  const floorCount = Math.max(levels, ...value.items.map(i => i.floor), ...Object.keys(value.images).map(Number));
  const items = value.items.filter(i => i.floor === floor);
  const item = items.find(i => i.id === selected);
  const scale = Math.min((size.width - 32) / value.width, (size.height - 40) / value.depth) * zoom;
  const offset = {x: (size.width - value.width * scale) / 2 + pan.x, y: (size.height - value.depth * scale) / 2 + pan.y};
  const imageData = value.images[floor];

  useEffect(() => {
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => {uploadGeneration.current++; node.close(); document.body.style.overflow = overflow; previous?.focus();};
  }, []);

  useEffect(() => {
    const node = surface.current!;
    const observer = new ResizeObserver(([entry]) => setSize({width: entry.contentRect.width, height: entry.contentRect.height}));
    observer.observe(node);
    return () => observer.disconnect();
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
    if (!item) return;
    commit({...value, items: value.items.map(i => i.id === item.id ? constrainItem({...i, ...patch}, value) : i)});
  }
  function focusMap() {surface.current?.closest('.tp-body')?.scrollTo({top: 0});}
  function fit() {setZoom(1); setPan({x: 0, y: 0}); focusMap();}
  function undo() {
    const previous = past.at(-1); if (!previous) return;
    setPast(past.slice(0, -1)); setFuture([value, ...future]); onChange(previous); setSelected(null);
  }
  function redo() {
    const next = future[0]; if (!next) return;
    setPast([...past, value]); setFuture(future.slice(1)); onChange(next); setSelected(null);
  }
  function add(kind: PlacementItem['kind'], geometry: Partial<PlacementItem> = {}) {
    const limit = kind === 'camera' ? 40 : 80;
    if (value.items.filter(i => i.kind === kind).length >= limit || value.items.length >= 200) {
      setError(`The plan has reached its ${kind === 'presence' ? 'mmWave sensor' : kind} limit.`); return;
    }
    const index = value.items.filter(i => i.kind === kind).length + 1;
    const label = kind === 'presence' ? 'mmWave' : kind === 'camera' ? 'Camera' : 'Room';
    const added = constrainItem({id: crypto.randomUUID(), kind, name: `${label} ${index}`, floor,
      x: kind === 'room' ? snap(value.width / 2 - 6) + index : snap(value.width * (kind === 'camera' ? 0.3 : 0.6)) + ((index - 1) % 4) * 4,
      y: kind === 'room' ? snap(value.depth / 2 - 5) + index : snap(value.depth * (kind === 'camera' ? 0.4 : 0.6)) + ((index - 1) % 4) * 4,
      width: 12, depth: 10, rotation: 0, range: kind === 'camera' ? 25 : 12, fov: kind === 'camera' ? 90 : 120,
      ...geometry}, value);
    commit({...value, items: [...value.items, added]}); setSelected(added.id); setTool('select'); setError(''); focusMap();
  }
  function point() {
    const p = stage.current?.getRelativePointerPosition();
    return p ? {x: bound(snap(p.x), 0, value.width), y: bound(snap(p.y), 0, value.depth)} : null;
  }
  function finishRoom() {
    if (!drawing) return;
    const width = Math.abs(drawing.endX - drawing.x);
    const depth = Math.abs(drawing.endY - drawing.y);
    add('room', {x: Math.min(drawing.x, drawing.endX), y: Math.min(drawing.y, drawing.endY),
      width: width < 2 ? 12 : width, depth: depth < 2 ? 10 : depth});
    setDrawing(null);
  }
  async function upload(file?: File) {
    if (!file) return;
    const generation = ++uploadGeneration.current;
    setError(''); setImageBusy(true);
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        throw new Error('Choose a PNG, JPG, or WebP image under 10 MB.');
      }
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      const data = canvas.toDataURL('image/webp', 0.8);
      const current = latest.current.value;
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
    canvas.width = 1600; canvas.height = Math.round(1600 * value.depth / value.width) + 90;
    const ctx = canvas.getContext('2d')!;
    const image = stage.current.toCanvas({x: offset.x, y: offset.y, width: value.width * scale, height: value.depth * scale, pixelRatio: 2});
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height - 90);
    ctx.fillStyle = '#193a32'; ctx.font = '22px sans-serif';
    ctx.fillText(`Tara | Floor ${floor} | ${value.width} x ${value.depth} ft | Illustrative coverage`, 24, canvas.height - 52);
    ctx.font = '18px sans-serif'; ctx.fillText('Walls, mounting height and device specifications are not simulated. Confirm placement on site.', 24, canvas.height - 20);
    const link = document.createElement('a'); link.download = `tara-placement-floor-${floor}.png`; link.href = canvas.toDataURL('image/png'); link.click();
  }
  const imageFit = background ? Math.min(value.width / background.width, value.depth / background.height) : 1;
  const mismatch = counts.cameras !== cameraZones || counts.presence !== presenceZones;

  return <dialog ref={dialog} className="tara-placement" aria-labelledby="tara-placement-title" aria-describedby="tara-placement-caveat" data-analytics-private
    onCancel={e => {e.preventDefault(); onClose();}}>
    <header className="tp-header"><div><span>Tara / Home plan</span><h2 id="tara-placement-title">Device placement</h2></div>
      <Tool label="Close placement planner" onClick={onClose}><X /></Tool></header>
    <div className="tp-toolbar" aria-label="Map tools">
      <div className="tp-tools">
        <Tool label="Select and move" active={tool === 'select'} onClick={() => setTool('select')}><MousePointer2 /></Tool>
        <Tool label="Draw room" active={tool === 'room'} onClick={() => {setTool('room'); focusMap();}}><SquarePlus /></Tool>
        <Tool label="Add camera" onClick={() => add('camera')}><Camera /></Tool>
        <Tool label="Add mmWave sensor" onClick={() => add('presence')}><Radar /></Tool>
        <Tool label="Pan map" active={tool === 'pan'} onClick={() => {setTool('pan'); focusMap();}}><Hand /></Tool>
      </div>
      <div className="tp-tools">
        <Tool label="Undo" disabled={!past.length} onClick={undo}><Undo2 /></Tool>
        <Tool label="Redo" disabled={!future.length} onClick={redo}><Redo2 /></Tool>
        <Tool label="Upload floor plan" disabled={imageBusy} onClick={() => fileInput.current?.click()}><Upload /></Tool>
        <Tool label="Download floor map" disabled={imageBusy || Boolean(imageData && !background)} onClick={download}><Download /></Tool>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => {void upload(e.target.files?.[0]); e.target.value = '';}} />
      </div>
    </div>
    <div className="tp-body">
      <div className="tp-map-column">
        <div className="tp-map-bar">
          <div className="tp-floor"><label htmlFor="tp-floor">Floor</label><select id="tp-floor" value={floor} disabled={imageBusy} onChange={e => {setFloor(Number(e.target.value)); setSelected(null); fit();}}>
            {Array.from({length: floorCount}, (_, i) => <option key={i} value={i + 1}>Floor {i + 1}</option>)}
          </select></div>
          <label className="tp-check"><input type="checkbox" checked={showCoverage} onChange={e => setShowCoverage(e.target.checked)} /> Coverage</label>
          <div className="tp-tools tp-zoom">
            <Tool label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut /></Tool>
            <Tool label="Fit map" onClick={fit}><Maximize /></Tool>
            <Tool label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}><ZoomIn /></Tool>
          </div>
        </div>
        <div ref={surface} className={`tp-surface tp-mode-${tool}`} aria-label={`Floor ${floor} placement map`} role="img">
          <Stage ref={stage} width={size.width} height={size.height} scaleX={scale} scaleY={scale} x={offset.x} y={offset.y}
            draggable={tool === 'pan'} onDragEnd={e => {if (e.target === stage.current) setPan({x: e.target.x() - (size.width - value.width * scale) / 2, y: e.target.y() - (size.height - value.depth * scale) / 2});}}
            onPointerDown={e => {
              if (tool === 'room') {const p = point(); if (p) setDrawing({...p, endX: p.x, endY: p.y});}
              else if (e.target === stage.current) setSelected(null);
            }}
            onPointerMove={() => {if (drawing) {const p = point(); if (p) setDrawing({...drawing, endX: p.x, endY: p.y});}}}
            onPointerUp={finishRoom} onPointerLeave={finishRoom}>
            <Layer>
              <Rect width={value.width} height={value.depth} fill="#fafcfb" stroke="#b8c8c1" strokeWidth={1 / scale} listening={false} />
              <Group clipX={0} clipY={0} clipWidth={value.width} clipHeight={value.depth}>
                {background && <CanvasImage image={background} x={(value.width - background.width * imageFit) / 2} y={(value.depth - background.height * imageFit) / 2}
                  width={background.width * imageFit} height={background.height * imageFit} opacity={0.65} listening={false} />}
                {Array.from({length: Math.floor(value.width / 5) + 1}, (_, i) => <Line key={`x${i}`} points={[i * 5, 0, i * 5, value.depth]} stroke="#dfe7e2" strokeWidth={0.7 / scale} listening={false} />)}
                {Array.from({length: Math.floor(value.depth / 5) + 1}, (_, i) => <Line key={`y${i}`} points={[0, i * 5, value.width, i * 5]} stroke="#dfe7e2" strokeWidth={0.7 / scale} listening={false} />)}
                {items.filter(i => i.kind === 'room').map(room => <Group key={room.id} x={room.x} y={room.y} draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelected(room.id)} onTap={() => tool === 'select' && setSelected(room.id)}
                  onDragStart={() => setSelected(room.id)} onDragEnd={e => {const next = constrainItem({...room, x: snap(e.target.x()), y: snap(e.target.y())}, value);
                    e.target.position({x: next.x, y: next.y}); commit({...value, items: value.items.map(i => i.id === room.id ? next : i)});}}>
                  <Rect width={room.width} height={room.depth} fill={room.id === selected ? '#d4e9dd88' : '#e5ede566'} stroke={room.id === selected ? '#297253' : '#6b8077'} strokeWidth={(room.id === selected ? 3 : 2) / scale} />
                  <Text text={room.name} x={6 / scale} y={6 / scale} width={Math.max(0, room.width - 12 / scale)} height={Math.max(0, room.depth - 12 / scale)} fontSize={14 / scale} fill="#224c3b" ellipsis wrap="none" listening={false} />
                </Group>)}
                {items.filter(i => i.kind !== 'room').map(device => {
                  const color = device.kind === 'camera' ? '#286b96' : '#ab5c35';
                  const index = items.filter(i => i.kind === device.kind).findIndex(i => i.id === device.id);
                  return <Group key={device.id} x={device.x} y={device.y} draggable={tool === 'select'}
                    onClick={() => tool === 'select' && setSelected(device.id)} onTap={() => tool === 'select' && setSelected(device.id)} onDragStart={() => setSelected(device.id)}
                    onDragEnd={e => {const next = constrainItem({...device, x: snap(e.target.x()), y: snap(e.target.y())}, value);
                      e.target.position({x: next.x, y: next.y}); commit({...value, items: value.items.map(i => i.id === device.id ? next : i)});}}>
                    {showCoverage && <Wedge radius={device.range} angle={device.fov} rotation={device.rotation - device.fov / 2} fill={device.kind === 'camera' ? '#61abde30' : '#e4a16e30'}
                      stroke={color} strokeWidth={1 / scale} dash={device.kind === 'presence' ? [4 / scale, 4 / scale] : undefined} listening={false} />}
                    <Circle radius={(device.id === selected ? 19 : 16) / scale} fill={color} stroke="#ffffff" strokeWidth={2 / scale} hitStrokeWidth={12 / scale} />
                    <Text text={`${device.kind === 'camera' ? 'C' : 'M'}${index + 1}`} x={-15 / scale} y={-7 / scale} width={30 / scale} align="center" fontSize={12 / scale} fill="#ffffff" listening={false} />
                    <Line points={[0, 0, Math.cos(device.rotation * Math.PI / 180) * 25 / scale, Math.sin(device.rotation * Math.PI / 180) * 25 / scale]} stroke={color} strokeWidth={3 / scale} listening={false} />
                  </Group>;
                })}
                {drawing && <Rect x={Math.min(drawing.x, drawing.endX)} y={Math.min(drawing.y, drawing.endY)} width={Math.abs(drawing.endX - drawing.x)} height={Math.abs(drawing.endY - drawing.y)} fill="#b8dbc880" stroke="#297253" strokeWidth={2 / scale} listening={false} />}
              </Group>
              <Text text={`${value.width} x ${value.depth} ft | Grid: 5 ft`} y={value.depth + 5 / scale} fontSize={12 / scale} fill="#486256" listening={false} />
            </Layer>
          </Stage>
        </div>
        <div className="tp-legend"><span><Camera /> Camera view</span><span><Radar /> mmWave coverage</span><span>{imageBusy ? 'Opening image...' : `${items.length} placements on this floor`}</span></div>
        {!items.length && <div className="tp-empty"><strong>Floor {floor}</strong><button type="button" onClick={() => add('room')}><SquarePlus /> Add first room</button></div>}
        <p className="tp-caveat" id="tara-placement-caveat">Illustrative coverage, not a tested detection map. Walls, furniture, mounting height, and device specifications are not simulated. Range and angle must be confirmed for the selected model.</p>
        {error && <p className="tp-error" role="alert">{error}</p>}
      </div>
      <aside className="tp-inspector" aria-label="Placement properties">
        {item ? <section>
          <div className="tp-inspector-title"><h3>{item.kind === 'room' ? 'Room' : item.kind === 'camera' ? 'Camera' : 'mmWave sensor'}</h3>
            <Tool label="Delete selected placement" onClick={() => {commit({...value, items: value.items.filter(i => i.id !== item.id)}); setSelected(null);}}><Trash2 /></Tool></div>
          <label><span>Name</span><input maxLength={48} value={item.name} onChange={e => update({name: e.target.value})} /></label>
          <div className="tp-fields"><NumberField label="X (ft)" value={item.x} min={0} max={value.width} onChange={x => update({x})} /><NumberField label="Y (ft)" value={item.y} min={0} max={value.depth} onChange={y => update({y})} /></div>
          {item.kind === 'room' ? <div className="tp-fields"><NumberField label="Width (ft)" value={item.width} min={2} max={value.width} onChange={width => update({width})} /><NumberField label="Depth (ft)" value={item.depth} min={2} max={value.depth} onChange={depth => update({depth})} /></div> : <>
            <label htmlFor="tp-direction"><span>Direction <output aria-hidden="true">{item.rotation} deg</output></span><input id="tp-direction" type="range" min={0} max={359} step={1} value={item.rotation} onChange={e => update({rotation: Number(e.target.value)})} /></label>
            <div className="tp-fields"><NumberField label="Range (ft)" value={item.range} min={1} max={100} onChange={range => update({range})} /><NumberField label="Angle (deg)" value={item.fov} min={10} max={360} onChange={fov => update({fov})} /></div>
          </>}
        </section> : <section><h3>Map dimensions</h3><div className="tp-fields">
          <NumberField label="Width (ft)" value={value.width} min={10} max={200} onChange={width => {const next = {...value, width}; commit({...next, items: next.items.map(i => constrainItem(i, next))}); fit();}} />
          <NumberField label="Depth (ft)" value={value.depth} min={10} max={200} onChange={depth => {const next = {...value, depth}; commit({...next, items: next.items.map(i => constrainItem(i, next))}); fit();}} />
        </div><p>Dimensions are estimates until measured. Uploaded plans retain their proportions and fit inside this area.</p></section>}
        {item && <button type="button" className="tp-text-button" onClick={() => setSelected(null)}>Map dimensions</button>}
        <section><h3>Floor {floor}</h3><div className="tp-item-list">
          {items.map(i => <button key={i.id} type="button" aria-pressed={i.id === selected} onClick={() => {setSelected(i.id); setTool('select');}}>
            {i.kind === 'room' ? <SquarePlus /> : i.kind === 'camera' ? <Camera /> : <Radar />}<span>{i.name || 'Unnamed placement'}</span></button>)}
          {!items.length && <p>No placements yet.</p>}
        </div>{imageData && <button type="button" className="tp-text-button" disabled={imageBusy} onClick={() => {const images = {...value.images}; delete images[floor]; commit({...value, images});}}><Trash2 /> Remove floor-plan image</button>}</section>
        <section className="tp-counts"><h3>Whole-home scope</h3><dl><div><dt>Cameras placed</dt><dd>{counts.cameras}</dd></div><div><dt>mmWave sensors placed</dt><dd>{counts.presence}</dd></div></dl>
          <p>Current quote: {cameraZones} camera zones, {presenceZones} presence zones. Applying placements uses one planning zone per marker and updates the estimate.</p>
          <button type="button" className="tp-apply" disabled={!mismatch || counts.cameras + counts.presence === 0} onClick={() => {onApplyCounts(counts.cameras, counts.presence); setNotice('Device counts applied to the quote.');}}><Check /> Apply counts to quote</button>
          {notice && <p role="status">{notice}</p>}
        </section>
      </aside>
    </div>
    <footer className="tp-footer"><p>Placement details are included when you send your plan. Uploaded floor-plan images stay on this device.</p><button type="button" onClick={onClose}><Check /> Done</button></footer>
  </dialog>;
}
