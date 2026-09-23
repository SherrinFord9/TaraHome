import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
  type ReactNode,
  type ComponentType,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  DoorOpen,
  Download,
  House,
  LampDesk,
  Map,
  Mail,
  Lightbulb,
  Minus,
  Moon,
  PanelsTopLeft,
  Plus,
  Radar,
  RotateCcw,
  Send,
  Shapes,
  Smartphone,
  Sun,
  Thermometer,
  WandSparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import {trackEvent} from './analytics';
import {deliverPlan, preparePlanRequest, planRequestCopy, PlanDeliveryError, type PlanRequest, type DeliveryFailure} from './plan-delivery';
import {emptyPlacement, readPlacement, placementCounts, placementSubmission, type PlacementPlan} from './placement-plan';
import type PlacementPlanner from './PlacementPlanner';
import '../../styles/configurator.css';

type StepId = 'home' | 'goals' | 'scope' | 'review' | 'contact';
type HomeType = '' | 'apartment' | 'townhouse' | 'single-family' | 'other';
type GoalId = 'lighting' | 'comfort' | 'entry' | 'presence' | 'cameras' | 'voice' | 'existing';
type PlanMode = 'undecided' | 'guided' | 'selected';
type CameraCoverage = 'none' | 'entry' | 'perimeter' | 'custom';

type DraftInput = {
  homeType: HomeType;
  bedrooms: number;
  levels: number;
  planMode: PlanMode;
  goals: GoalId[];
  rooms: number;
  exteriorDoors: number;
  windows: number;
  smartLights: number;
  thermostats: number;
  doorbells: number;
  presenceZones: number;
  cameraCoverage: CameraCoverage;
  cameraZones: number;
  notes: string;
  placement: PlacementPlan;
};

type ContactInput = {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  message: string;
};

type CountKey = keyof Pick<
  DraftInput,
  | 'bedrooms'
  | 'levels'
  | 'rooms'
  | 'exteriorDoors'
  | 'windows'
  | 'smartLights'
  | 'thermostats'
  | 'doorbells'
  | 'presenceZones'
  | 'cameraZones'
>;

type StoredPlan = {
  version: 2;
  draft: DraftInput;
  step: StepId;
  furthestStep: number;
};

const PLAN_STORAGE_KEY = 'tara-configurator-plan-v2';

function trackDelivery(event: string, props: Record<string, string | number>) {
  try {trackEvent(event, props);} catch { /* Measurement must never block or reverse form delivery. */ }
}
const steps: Array<{id: StepId; shortLabel: string; label: string}> = [
  {id: 'home', shortLabel: 'Home', label: 'Your home'},
  {id: 'goals', shortLabel: 'Goals', label: 'What matters'},
  {id: 'scope', shortLabel: 'Scope', label: 'Recommended scope'},
  {id: 'review', shortLabel: 'Review', label: 'Review plan'},
  {id: 'contact', shortLabel: 'Send', label: 'Send plan'},
];

const initialDraft: DraftInput = {
  homeType: '',
  bedrooms: 3,
  levels: 1,
  planMode: 'undecided',
  goals: [],
  rooms: 8,
  exteriorDoors: 3,
  windows: 17,
  smartLights: 16,
  thermostats: 1,
  doorbells: 1,
  presenceZones: 7,
  cameraCoverage: 'none',
  cameraZones: 0,
  notes: '',
  placement: emptyPlacement(),
};

const initialContact: ContactInput = {
  name: '',
  email: '',
  phone: '',
  zipCode: '',
  message: '',
};

const homeOptions: Array<{
  id: Exclude<HomeType, ''>;
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {id: 'apartment', title: 'Apartment or condo', body: 'One unit in a shared building.', Icon: Building2},
  {id: 'townhouse', title: 'Townhouse', body: 'Attached home with its own entries.', Icon: PanelsTopLeft},
  {id: 'single-family', title: 'Single-family home', body: 'Detached home with private exterior.', Icon: House},
  {id: 'other', title: 'Something else', body: 'Cabin, ADU, duplex, or another layout.', Icon: Shapes},
];

const goalOptions: Array<{
  id: GoalId;
  title: string;
  body: string;
  Icon: LucideIcon;
}> = [
  {id: 'lighting', title: 'Lighting that follows the room', body: 'Scenes, switches, and lights that respond to presence.', Icon: Lightbulb},
  {id: 'comfort', title: 'More consistent comfort', body: 'Thermostat routines based on time, presence, and away mode.', Icon: Thermometer},
  {id: 'entry', title: 'Doors and packages', body: 'Door state, a smart doorbell, and useful arrival routines.', Icon: DoorOpen},
  {id: 'presence', title: 'Better presence detection', body: 'Know when a room is occupied without relying on a short timer.', Icon: Radar},
  {id: 'cameras', title: 'Exterior camera coverage', body: 'Named entry, driveway, side-gate, yard, or package zones.', Icon: Camera},
  {id: 'voice', title: 'Voice and local AI', body: 'One assistant for routines, suggestions, and system health.', Icon: Waves},
  {id: 'existing', title: 'Connect devices I own', body: 'Bring compatible lights, plugs, speakers, TVs, or vacuums together.', Icon: Smartphone},
];

const cameraOptions: Array<{
  id: Exclude<CameraCoverage, 'none'>;
  title: string;
  body: string;
  zones: number;
}> = [
  {id: 'entry', title: 'Entries', body: 'Front walk, packages, and a primary approach.', zones: 2},
  {id: 'perimeter', title: 'Exterior perimeter', body: 'Entries plus driveway, side gate, and yard.', zones: 5},
  {id: 'custom', title: 'Custom', body: 'Set the number of named areas yourself.', zones: 3},
];

const scopeItems: Array<{
  key: CountKey;
  label: string;
  helper: string;
  min: number;
  max: number;
}> = [
  {key: 'rooms', label: 'Rooms and key spaces', helper: 'Living spaces, bedrooms, offices, halls, and utility areas.', min: 1, max: 80},
  {key: 'exteriorDoors', label: 'Exterior doors', helper: 'Front, back, garage entry, patio, balcony, and side doors.', min: 1, max: 40},
  {key: 'windows', label: 'Windows', helper: 'Openings that may need a labeled contact sensor.', min: 0, max: 180},
  {key: 'smartLights', label: 'Smart lights or zones', helper: 'Bulbs, switches, dimmers, or grouped lighting zones.', min: 0, max: 240},
  {key: 'thermostats', label: 'Thermostats', helper: 'Independent comfort zones or thermostat locations.', min: 0, max: 12},
  {key: 'doorbells', label: 'Doorbells', helper: 'Primary and secondary visitor entries.', min: 0, max: 8},
  {key: 'presenceZones', label: 'Presence zones', helper: 'Rooms that should know someone is still there.', min: 0, max: 80},
];

const homeTypeLabels: Record<Exclude<HomeType, ''>, string> = {
  apartment: 'Apartment or condo',
  townhouse: 'Townhouse',
  'single-family': 'Single-family home',
  other: 'Other home type',
};

const goalLabels = Object.fromEntries(goalOptions.map((goal) => [goal.id, goal.title])) as Record<GoalId, string>;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function packagePricePoint(value: number) {
  return Math.max(2999, Math.ceil((value + 1) / 250) * 250 - 1);
}

function recommendationFor(draft: DraftInput) {
  const bedroomCount = clamp(draft.bedrooms, 0, 30);
  const levelCount = clamp(draft.levels, 1, 8);
  const roomOffset: Record<Exclude<HomeType, ''>, number> = {
    apartment: 3,
    townhouse: 4,
    'single-family': 5,
    other: 4,
  };
  const doorBaseline: Record<Exclude<HomeType, ''>, number> = {
    apartment: 1,
    townhouse: 2,
    'single-family': 3,
    other: 2,
  };
  const homeType = draft.homeType || 'single-family';
  const rooms = clamp(bedroomCount + roomOffset[homeType] + Math.max(0, levelCount - 1), 3, 80);
  const exteriorDoors = doorBaseline[homeType];
  const windows = clamp(
    homeType === 'apartment'
      ? bedroomCount * 2 + 3
      : bedroomCount * 3 + rooms,
    2,
    180,
  );
  const guided = draft.planMode !== 'selected';
  const hasGoal = (goal: GoalId) => guided || draft.goals.includes(goal);
  const cameraZones =
    draft.cameraCoverage === 'none'
      ? 0
      : draft.cameraCoverage === 'entry'
        ? 2
        : draft.cameraCoverage === 'perimeter'
          ? 5
          : clamp(draft.cameraZones || 3, 1, 40);

  return {
    rooms,
    exteriorDoors,
    windows,
    smartLights: hasGoal('lighting') ? rooms * 2 : rooms,
    thermostats: hasGoal('comfort') ? levelCount : 1,
    doorbells: 1,
    presenceZones: hasGoal('presence') || hasGoal('lighting') || hasGoal('comfort')
      ? Math.max(3, rooms - 1)
      : Math.max(2, bedroomCount),
    cameraZones,
  };
}

function withRecommendation(draft: DraftInput): DraftInput {
  return {...draft, ...recommendationFor(draft)};
}

function readStoredPlan(): StoredPlan | null {
  if (typeof window === 'undefined') return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PLAN_STORAGE_KEY) || 'null') as Partial<StoredPlan> | null;
    if (!parsed || parsed.version !== 2 || !parsed.draft || !steps.some((step) => step.id === parsed.step)) return null;

    const draft = parsed.draft as Partial<DraftInput>;
    const homeType = homeOptions.some((option) => option.id === draft.homeType) ? draft.homeType as HomeType : '';
    if (!homeType) return null;

    return {
      version: 2,
      draft: {
        ...initialDraft,
        ...draft,
        homeType,
        placement: readPlacement(draft.placement),
        goals: Array.isArray(draft.goals)
          ? draft.goals.filter((goal): goal is GoalId => goalOptions.some((option) => option.id === goal))
          : [],
      },
      step: parsed.step as StepId,
      furthestStep: clamp(Number(parsed.furthestStep || 0), 0, steps.length - 1),
    };
  } catch {
    return null;
  }
}

function Counter({
  id,
  label,
  helper,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  helper?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="tara-cfg-counter">
      <div className="tara-cfg-counter-copy">
        <label htmlFor={id}>{label}</label>
        {helper && <span>{helper}</span>}
      </div>
      <div className="tara-cfg-counter-control">
        <button type="button" onClick={() => onChange(clamp(value - 1, min, max))} disabled={value <= min} aria-label={`Decrease ${label}`} title={`Decrease ${label}`}>
          <Minus aria-hidden="true" />
        </button>
        <input id={id} type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(event) => onChange(clamp(Number.parseInt(event.target.value || String(min), 10), min, max))} />
        <button type="button" onClick={() => onChange(clamp(value + 1, min, max))} disabled={value >= max} aria-label={`Increase ${label}`} title={`Increase ${label}`}>
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  Icon,
  title,
  body,
  multiple = false,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  title: string;
  body: string;
  multiple?: boolean;
}) {
  return (
    <button type="button" className={`tara-cfg-choice ${selected ? 'is-selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <span className="tara-cfg-choice-icon" aria-hidden="true"><Icon /></span>
      <span className="tara-cfg-choice-copy">
        <strong>{title}</strong>
        <small>{body}</small>
      </span>
      <span className={`tara-cfg-choice-state ${multiple ? 'is-square' : ''}`} aria-hidden="true">
        {selected && <Check />}
      </span>
    </button>
  );
}

function StageHeader({eyebrow, title, body, headingRef}: {eyebrow: string; title: string; body: string; headingRef: RefObject<HTMLHeadingElement | null>}) {
  return (
    <header className="tara-cfg-stage-head">
      <p>{eyebrow}</p>
      <h1 id="tara-configurator-heading" ref={headingRef} tabIndex={-1}>{title}</h1>
      <div>{body}</div>
    </header>
  );
}

function StageActions({
  showBack,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  disabled = false,
  icon,
}: {
  showBack: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="tara-cfg-stage-actions">
      {showBack ? (
        <button type="button" className="tara-cfg-button tara-cfg-button--quiet" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> Back
        </button>
      ) : <span />}
      <button type="button" className="tara-cfg-button tara-cfg-button--primary" onClick={onContinue} disabled={disabled}>
        {continueLabel} {icon || <ArrowRight aria-hidden="true" />}
      </button>
    </div>
  );
}

export function ConfiguratorPage({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}) {
  const [storedPlan] = useState(readStoredPlan);
  const [draft, setDraft] = useState<DraftInput>(storedPlan?.draft || initialDraft);
  const [step, setStep] = useState<StepId>(storedPlan?.step || 'home');
  const [furthestStep, setFurthestStep] = useState(storedPlan?.furthestStep || 0);
  const [contact, setContact] = useState<ContactInput>(initialContact);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [deliveryFailure, setDeliveryFailure] = useState<DeliveryFailure>('network');
  const [requestRecord, setRequestRecord] = useState<PlanRequest>();
  const [providerSubmissionId, setProviderSubmissionId] = useState<string>();
  const requestRef = useRef<PlanRequest | undefined>(undefined);
  const submittingRef = useRef(false);
  const [showRestored, setShowRestored] = useState(Boolean(storedPlan));
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(storedPlan ? 'saved' : 'idle');
  const [resetArmed, setResetArmed] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [Planner, setPlanner] = useState<ComponentType<Parameters<typeof PlacementPlanner>[0]> | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState('');
  const mapped = placementCounts(draft.placement);
  const openPlanner = async () => {
    setPlannerError('');
    if (Planner) {setPlannerOpen(true); return;}
    setPlannerLoading(true);
    try {
      const module = await import('./PlacementPlanner');
      setPlanner(() => module.default); setPlannerOpen(true);
    } catch {setPlannerError('The placement planner could not load. Check your connection and try again.');}
    finally {setPlannerLoading(false);}
  };
  const headingRef = useRef<HTMLHeadingElement>(null);
  const didMount = useRef(false);
  const didTrackView = useRef(false);
  const stepIndex = steps.findIndex((item) => item.id === step);

  const plan = useMemo(() => {
    const cameraZones = draft.cameraCoverage === 'none' ? 0 : draft.cameraZones;
    const plannedDevices =
      1 +
      draft.exteriorDoors +
      draft.windows +
      draft.smartLights +
      draft.thermostats +
      draft.doorbells +
      draft.presenceZones +
      cameraZones;
    const hasCameras = cameraZones > 0;
    const packageName = hasCameras ? 'Camera kit' : 'Starter smart home kit';
    const devicesBeforeCameras = plannedDevices - cameraZones;
    const starterEstimate = packagePricePoint(2999 + Math.max(0, devicesBeforeCameras - 20) * 75);
    const estimatedPrice = hasCameras
      ? packagePricePoint(
          9999
          + Math.max(0, starterEstimate - 4999)
          + Math.max(0, cameraZones - 2) * 750,
        )
      : starterEstimate;
    const price = usdFormatter.format(estimatedPrice);
    const priceLabel = 'Planning estimate';
    const effectiveGoals = draft.planMode === 'guided'
      ? ['lighting', 'comfort', 'entry', 'presence'] as GoalId[]
      : draft.goals;
    const rows: Array<[string, number]> = [
      ['Local server', 1],
      ['Door sensors', draft.exteriorDoors],
      ['Window sensors', draft.windows],
      ['Smart lights or zones', draft.smartLights],
      ['Presence zones', draft.presenceZones],
      ['Thermostats', draft.thermostats],
      ['Doorbells', draft.doorbells],
      ['Camera zones', cameraZones],
    ];

    return {cameraZones, plannedDevices, hasCameras, packageName, estimatedPrice, price, priceLabel, effectiveGoals, rows};
  }, [draft]);

  useEffect(() => {
    if (didTrackView.current) return;
    didTrackView.current = true;
    trackEvent('configurator_view', {category: 'configurator', restoredPlan: Boolean(storedPlan)});
  }, [storedPlan]);

  useEffect(() => {
    if (!draft.homeType || submitStatus === 'success') return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      const value: StoredPlan = {version: 2, draft, step, furthestStep};
      try {
        window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(value));
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [draft, step, furthestStep, submitStatus]);

  useEffect(() => {
    if (!draft.homeType || submitStatus === 'success') return;
    const flush = () => {
      try {window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({version: 2, draft, step, furthestStep} satisfies StoredPlan));}
      catch { /* Browsers can disable local storage; sending the plan remains available. */ }
    };
    const onVisibility = () => {if (document.visibilityState === 'hidden') flush();};
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVisibility);};
  }, [draft, step, furthestStep, submitStatus]);

  const closePlanner = () => {
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({version: 2, draft, step, furthestStep} satisfies StoredPlan));
      setSaveState('saved');
    } catch {setSaveState('idle');}
    setPlannerOpen(false);
  };

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    window.requestAnimationFrame(() => headingRef.current?.focus({preventScroll: true}));
  }, [step]);

  const goToStep = (nextStep: StepId, direction: 'forward' | 'back' | 'edit' = 'forward') => {
    const nextIndex = steps.findIndex((item) => item.id === nextStep);
    const nextFurthestStep = direction === 'forward' ? Math.max(furthestStep, nextIndex) : furthestStep;
    if (direction === 'forward') {
      trackEvent('configurator_step_complete', {
        category: 'configurator',
        step,
        stepNumber: stepIndex + 1,
        plannedDevices: plan.plannedDevices,
        planningEstimate: plan.estimatedPrice,
        packagePath: plan.packageName,
      });
      setFurthestStep(nextFurthestStep);
      if (nextStep === 'review') {
        trackEvent('configurator_review_reached', {
          category: 'configurator',
          plannedDevices: plan.plannedDevices,
          packagePath: plan.packageName,
          cameraZones: plan.cameraZones,
        });
      }
    } else {
      trackEvent(direction === 'edit' ? 'configurator_plan_edit' : 'configurator_step_back', {
        category: 'configurator',
        fromStep: step,
        toStep: nextStep,
      });
    }
    if (draft.homeType) {
      try {
        window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({
          version: 2,
          draft,
          step: nextStep,
          furthestStep: nextFurthestStep,
        } satisfies StoredPlan));
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      }
    }
    setStep(nextStep);
  };

  const next = () => {
    const nextStep = steps[stepIndex + 1]?.id;
    if (nextStep) goToStep(nextStep);
  };

  const back = () => {
    const previousStep = steps[stepIndex - 1]?.id;
    if (previousStep) goToStep(previousStep, 'back');
  };

  const updateHomeType = (homeType: Exclude<HomeType, ''>) => {
    setDraft((current) => withRecommendation({...current, homeType}));
    setShowRestored(false);
    trackEvent('configurator_home_type_selected', {category: 'configurator', homeType});
  };

  const updateProfileCount = (key: 'bedrooms' | 'levels', value: number) => {
    setDraft((current) => withRecommendation({...current, [key]: value}));
  };

  const chooseGuidedPlan = () => {
    setDraft((current) => withRecommendation({
      ...current,
      planMode: 'guided',
      goals: [],
      cameraCoverage: 'none',
      cameraZones: 0,
    }));
    trackEvent('configurator_recommend_for_me', {category: 'configurator'});
  };

  const toggleGoal = (goal: GoalId) => {
    setDraft((current) => {
      const selected = current.planMode === 'selected' ? current.goals : [];
      const removing = selected.includes(goal);
      const goals = removing ? selected.filter((item) => item !== goal) : [...selected, goal];
      const cameraCoverage = goal === 'cameras'
        ? removing ? 'none' : current.cameraCoverage === 'none' ? 'entry' : current.cameraCoverage
        : current.cameraCoverage;
      return withRecommendation({
        ...current,
        planMode: 'selected',
        goals,
        cameraCoverage,
        cameraZones: cameraCoverage === 'none' ? 0 : current.cameraZones,
      });
    });
    trackEvent('configurator_goal_toggled', {category: 'configurator', goal});
  };

  const updateCameraCoverage = (coverage: Exclude<CameraCoverage, 'none'>, zones: number) => {
    setDraft((current) => withRecommendation({...current, cameraCoverage: coverage, cameraZones: zones}));
    trackEvent('configurator_camera_coverage_selected', {category: 'configurator', coverage});
  };

  const updateScopeCount = (key: CountKey, value: number) => {
    setDraft((current) => ({...current, [key]: value}));
  };

  const resetScope = () => {
    setDraft((current) => withRecommendation(current));
    trackEvent('configurator_scope_reset', {category: 'configurator'});
  };

  const resetPlan = () => {
    if (!resetArmed) {
      setResetArmed(true);
      window.setTimeout(() => setResetArmed(false), 4000);
      return;
    }
    try {window.localStorage.removeItem(PLAN_STORAGE_KEY);} catch { /* Storage is optional. */ }
    setDraft(initialDraft);
    setStep('home');
    setFurthestStep(0);
    setContact(initialContact);
    setShowRestored(false);
    setSaveState('idle');
    setResetArmed(false);
    trackEvent('configurator_plan_reset', {category: 'configurator'});
  };

  const updateContact = (key: keyof ContactInput, value: string) => {
    setSubmitStatus('idle');
    setContact((current) => ({...current, [key]: value}));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || submitStatus === 'success') return;
    submittingRef.current = true;
    setSubmitStatus('submitting');
    trackDelivery('configurator_submit_started', {
      category: 'configurator',
      packagePath: plan.packageName,
      plannedDevices: plan.plannedDevices,
      planningEstimate: plan.estimatedPrice,
    });

    const homeLabel = draft.homeType ? homeTypeLabels[draft.homeType] : 'Unknown home';
    const goals = plan.effectiveGoals.map((goal) => goalLabels[goal]).join(', ') || 'No priorities selected';
    const payload: Record<string, string | number> = {
      subject: `Tara home plan - ${contact.zipCode || 'location pending'}`,
      name: contact.name,
      email: contact.email,
      _replyto: contact.email,
      phone: contact.phone,
      zipCode: contact.zipCode,
      formType: 'Tara configurator v2',
      _gotcha: String(new FormData(event.currentTarget).get('_gotcha') || ''),
      homeownerMessage: contact.message,
      message: `${plan.packageName} request for ${homeLabel}, ${draft.bedrooms} bedrooms, ${draft.levels} levels. Planning estimate: ${plan.price}. Priorities: ${goals}. Planned scope: ${plan.plannedDevices} devices including ${draft.windows} window sensors, ${draft.exteriorDoors} door sensors, ${draft.smartLights} smart lights or zones, ${draft.thermostats} thermostats, ${draft.doorbells} doorbells, ${draft.presenceZones} presence zones, and ${plan.cameraZones} camera zones. Home notes: ${draft.notes || 'None provided.'} Homeowner message: ${contact.message || 'None provided.'}`,
      homeType: homeLabel,
      goals,
      bedrooms: draft.bedrooms,
      rooms: draft.rooms,
      exteriorDoors: draft.exteriorDoors,
      windows: draft.windows,
      smartLights: draft.smartLights,
      thermostats: draft.thermostats,
      doorbells: draft.doorbells,
      presenceZones: draft.presenceZones,
      levels: draft.levels,
      cameraCoverage: draft.cameraCoverage,
      cameraZones: plan.cameraZones,
      listingNotes: draft.notes,
      localServer: 1,
      plannedDevices: plan.plannedDevices,
      packagePath: plan.packageName,
      planningEstimate: plan.price,
      ...(draft.placement.items.length ? {placementPlan: placementSubmission(draft.placement)} : {}),
    };
    try {
      const request = preparePlanRequest(payload, requestRef.current);
      requestRef.current = request;
      setRequestRecord(request);
      setProviderSubmissionId(undefined);
      const result = await deliverPlan(request);
      setProviderSubmissionId(result.providerSubmissionId);
      setSubmitStatus('success');
      try {window.localStorage.removeItem(PLAN_STORAGE_KEY);} catch { /* An accepted inquiry must not appear to have failed. */ }
      trackDelivery('configurator_submit_success', {
        category: 'conversion',
        packagePath: plan.packageName,
        plannedDevices: plan.plannedDevices,
        planningEstimate: plan.estimatedPrice,
      });
    } catch (error) {
      setSubmitStatus('error');
      const reason = error instanceof PlanDeliveryError ? error.reason : 'network';
      setDeliveryFailure(reason);
      trackDelivery('configurator_submit_error', {category: 'configurator', packagePath: plan.packageName, reason});
    } finally {
      submittingRef.current = false;
    }
  };

  const downloadRequest = () => {
    if (!requestRecord) return;
    const url = URL.createObjectURL(new Blob([planRequestCopy(requestRecord, submitStatus === 'success', providerSubmissionId)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${requestRecord.reference}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const requestActions = requestRecord && (
    <div className="tara-cfg-request-record" data-analytics-private>
      <p>Request reference: <strong>{requestRecord.reference}</strong></p>
      <div className="tara-cfg-request-actions">
        <button type="button" className="tara-cfg-button tara-cfg-button--quiet" onClick={downloadRequest}><Download aria-hidden="true" /> Download request</button>
        <a className="tara-cfg-button tara-cfg-button--quiet" href={`mailto:hello@tarahome.ai?subject=${encodeURIComponent(`Home plan ${requestRecord.reference}`)}&body=${encodeURIComponent(`Please check my home-plan request ${requestRecord.reference}, submitted ${requestRecord.submittedAt}.\n\nName: ${requestRecord.payload.name}\nEmail: ${requestRecord.payload.email}\nPlan: ${requestRecord.payload.packagePath}\nPlanning estimate: ${requestRecord.payload.planningEstimate}`)}`}><Mail aria-hidden="true" /> Email Tara</a>
      </div>
    </div>
  );

  const homeReady = Boolean(draft.homeType);
  const goalsReady = draft.planMode === 'guided' || (draft.planMode === 'selected' && draft.goals.length > 0);

  return (
    <div className="tara-configurator" data-tara-theme={darkMode ? 'dark' : 'light'}>
      <a className="tara-cfg-skip" href="#configurator-content">Skip to planner</a>

      <header className="tara-cfg-topbar">
        <div className="tara-cfg-topbar-inner">
          <a href="/" className="tara-cfg-brand" aria-label="Tara home page">Tara</a>
          <div className="tara-cfg-topbar-center">
            {draft.homeType && (
              <span className={`tara-cfg-save-state ${saveState === 'saving' ? 'is-saving' : ''}`} aria-live="polite">
                <Check aria-hidden="true" /> {saveState === 'saving' ? 'Saving plan' : saveState === 'saved' ? 'Plan saved' : 'Not saved on this device'}
              </span>
            )}
          </div>
          <div className="tara-cfg-topbar-actions">
            {draft.homeType && (
              <button type="button" className="tara-cfg-icon-button" onClick={resetPlan} title={resetArmed ? 'Click again to confirm' : 'Start over'} aria-label={resetArmed ? 'Confirm start over' : 'Start over'}>
                <RotateCcw aria-hidden="true" />
                {resetArmed && <span>Confirm</span>}
              </button>
            )}
            <button type="button" className="tara-cfg-icon-button" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Use light theme' : 'Use dark theme'} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'}>
              {darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main id="configurator-content" className="tara-cfg-main">
        <nav className="tara-cfg-progress" aria-label="Home plan progress">
          <div className="tara-cfg-progress-track" aria-hidden="true">
            <span style={{width: `${(stepIndex / (steps.length - 1)) * 100}%`}} />
          </div>
          <ol>
            {steps.map((item, index) => {
              const available = index <= Math.max(stepIndex, furthestStep);
              const complete = index !== stepIndex && (index < stepIndex || index < furthestStep);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={!available}
                    className={`${index === stepIndex ? 'is-current' : ''} ${complete ? 'is-complete' : ''}`}
                    aria-current={index === stepIndex ? 'step' : undefined}
                    onClick={() => index !== stepIndex && available && goToStep(item.id, 'edit')}
                  >
                    <span>{complete ? <Check aria-hidden="true" /> : index + 1}</span>
                    <strong>{item.shortLabel}</strong>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="tara-cfg-layout">
          <section className="tara-cfg-stage" aria-labelledby="tara-configurator-heading">
            {showRestored && (
              <div className="tara-cfg-restored" role="status">
                <span><CheckCircle2 aria-hidden="true" /> Your saved plan is open.</span>
                <button type="button" onClick={() => setShowRestored(false)} aria-label="Dismiss saved plan message">Dismiss</button>
              </div>
            )}

            {step === 'home' && (
              <>
                <StageHeader eyebrow="Step 1 of 5 · About 2 minutes" title="What kind of home are we planning?" body="This gives Tara a useful first estimate. You can correct every device count before sending it." headingRef={headingRef} />
                <div className="tara-cfg-choice-grid tara-cfg-choice-grid--home">
                  {homeOptions.map((option) => (
                    <ChoiceButton key={option.id} {...option} selected={draft.homeType === option.id} onClick={() => updateHomeType(option.id)} />
                  ))}
                </div>
                <div className="tara-cfg-profile-counts">
                  <Counter id="tara-bedrooms" label="Bedrooms" helper="Studios can use 0." value={draft.bedrooms} min={0} max={30} onChange={(value) => updateProfileCount('bedrooms', value)} />
                  <Counter id="tara-levels" label="Levels" helper="Count finished floors in the plan." value={draft.levels} min={1} max={8} onChange={(value) => updateProfileCount('levels', value)} />
                </div>
                {draft.homeType && (
                  <div className="tara-cfg-mobile-preview" aria-live="polite">
                    <div><span>{plan.priceLabel}</span><strong>{plan.price}</strong></div>
                    <small>{plan.plannedDevices} planned devices<br />Final price is confirmed after scope review.</small>
                  </div>
                )}
                {!homeReady && <p className="tara-cfg-required-note">Choose a home type to continue.</p>}
                <StageActions showBack={false} onBack={back} onContinue={next} disabled={!homeReady} />
              </>
            )}

            {step === 'goals' && (
              <>
                <StageHeader eyebrow="Step 2 of 5" title="What should feel better first?" body="Choose the outcomes you care about. Tara uses these to shape the device estimate and the first automations." headingRef={headingRef} />
                <button type="button" className={`tara-cfg-guided ${draft.planMode === 'guided' ? 'is-selected' : ''}`} onClick={chooseGuidedPlan} aria-pressed={draft.planMode === 'guided'}>
                  <span className="tara-cfg-choice-icon" aria-hidden="true"><WandSparkles /></span>
                  <span><strong>Recommend the core system for me</strong><small>Start with lighting, comfort, entry, and presence. Cameras stay optional.</small></span>
                  <span className="tara-cfg-choice-state" aria-hidden="true">{draft.planMode === 'guided' && <Check />}</span>
                </button>
                <div className="tara-cfg-or"><span>or choose priorities</span></div>
                <div className="tara-cfg-choice-grid tara-cfg-choice-grid--goals">
                  {goalOptions.map((option) => (
                    <ChoiceButton key={option.id} {...option} multiple selected={draft.planMode === 'selected' && draft.goals.includes(option.id)} onClick={() => toggleGoal(option.id)} />
                  ))}
                </div>
                {draft.planMode === 'selected' && draft.goals.includes('cameras') && (
                  <fieldset className="tara-cfg-camera-coverage">
                    <legend>How much exterior camera coverage?</legend>
                    <p>These are planning zones, not a promise of one camera per zone.</p>
                    <div className="tara-cfg-camera-options">
                      {cameraOptions.map((option) => (
                        <button key={option.id} type="button" className={draft.cameraCoverage === option.id ? 'is-selected' : ''} onClick={() => updateCameraCoverage(option.id, option.zones)} aria-pressed={draft.cameraCoverage === option.id}>
                          <strong>{option.title}</strong><small>{option.body}</small>
                        </button>
                      ))}
                    </div>
                    {draft.cameraCoverage === 'custom' && (
                      <Counter id="tara-camera-zones" label="Named camera zones" value={draft.cameraZones} min={1} max={40} onChange={(value) => updateScopeCount('cameraZones', value)} />
                    )}
                  </fieldset>
                )}
                {!goalsReady && <p className="tara-cfg-required-note">Choose at least one priority, or let Tara recommend the core system.</p>}
                <StageActions showBack onBack={back} onContinue={next} disabled={!goalsReady} />
              </>
            )}

            {step === 'scope' && (
              <>
                <StageHeader eyebrow="Step 3 of 5 · Tara recommendation" title="Here is a practical first scope." body={`Based on a ${draft.bedrooms}-bedroom ${draft.homeType ? homeTypeLabels[draft.homeType].toLowerCase() : 'home'} with ${draft.levels} ${draft.levels === 1 ? 'level' : 'levels'}. Use it as-is or adjust the counts you know.`} headingRef={headingRef} />
                <div className="tara-cfg-scope-summary" aria-label="Recommended equipment count">
                  {plan.rows.map(([label, value]) => (
                    <div key={label} className={value === 0 ? 'is-zero' : ''}><span>{label}</span><strong>{value}</strong></div>
                  ))}
                  <div className="tara-cfg-scope-total"><span>Planned devices</span><strong>{plan.plannedDevices}</strong></div>
                </div>
                <details className="tara-cfg-exact">
                  <summary><span><LampDesk aria-hidden="true" /> Edit exact device counts</span><ChevronDown aria-hidden="true" /></summary>
                  <div className="tara-cfg-exact-inner">
                    <div className="tara-cfg-exact-head">
                      <p>Change only what you know. The scope call confirms models, protocols, and installation details.</p>
                      <button type="button" onClick={resetScope}><RotateCcw aria-hidden="true" /> Restore recommendation</button>
                    </div>
                    <div className="tara-cfg-counter-list">
                      {scopeItems.map(({key: countKey, ...item}) => (
                        <Counter key={countKey} id={`tara-scope-${countKey}`} {...item} value={draft[countKey]} onChange={(value) => updateScopeCount(countKey, value)} />
                      ))}
                      {draft.cameraCoverage !== 'none' && (
                        <Counter id="tara-scope-cameraZones" label="Camera zones" helper="Driveway, package area, side gate, yard, or another named zone." value={draft.cameraZones} min={1} max={40} onChange={(value) => updateScopeCount('cameraZones', value)} />
                      )}
                    </div>
                  </div>
                </details>
                <section className="tara-cfg-placement-entry" aria-labelledby="tara-placement-entry-title">
                  <div><h2 id="tara-placement-entry-title">Placement plan <small>Optional</small></h2>
                    <p>{draft.placement.items.length ? mapped.rooms + ' rooms, ' + mapped.windows + ' windows, ' + mapped.doors + ' doors, ' + mapped.devices + ' devices placed.' : 'Rooms, doors, windows, sensors, lighting, cameras, speakers, and more.'}</p></div>
                  <button type="button" className="tara-cfg-button tara-cfg-button--quiet" disabled={plannerLoading} onClick={() => void openPlanner()}><Map aria-hidden="true" />{plannerLoading ? 'Opening map' : 'Open placement map'}</button>
                  {plannerError && <p className="tara-cfg-error" role="alert">{plannerError}</p>}
                </section>
                <label className="tara-cfg-notes">
                  <span>Home notes <small>Optional</small></span>
                  <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({...current, notes: event.target.value}))} placeholder="Example: detached garage, side gate, two HVAC zones, or devices you already own." />
                </label>
                <StageActions showBack onBack={back} onContinue={next} continueLabel="Review my plan" />
              </>
            )}

            {step === 'review' && (
              <>
                <StageHeader eyebrow="Step 4 of 5" title="Check the plan before you send it." body="Nothing is ordered here. Tara reviews this starting point with you before choosing exact products or installation details." headingRef={headingRef} />
                <div className="tara-cfg-review-package">
                  <div>
                    <span>Recommended path</span>
                    <h2>{plan.packageName}</h2>
                    <p>{plan.priceLabel}: <strong>{plan.price}</strong>. Final pricing changes with confirmed products and installation scope.</p>
                  </div>
                  <span className="tara-cfg-review-count"><strong>{plan.plannedDevices}</strong> planned devices</span>
                </div>
                <div className="tara-cfg-review-sections">
                  <section>
                    <header><div><span>Home</span><h2>{draft.homeType ? homeTypeLabels[draft.homeType] : 'Home profile'}</h2></div><button type="button" onClick={() => goToStep('home', 'edit')}>Change</button></header>
                    <p>{draft.bedrooms} {draft.bedrooms === 1 ? 'bedroom' : 'bedrooms'} · {draft.levels} {draft.levels === 1 ? 'level' : 'levels'} · about {draft.rooms} planned spaces</p>
                  </section>
                  <section>
                    <header><div><span>Priorities</span><h2>{draft.planMode === 'guided' ? 'Tara core recommendation' : `${plan.effectiveGoals.length} selected`}</h2></div><button type="button" onClick={() => goToStep('goals', 'edit')}>Change</button></header>
                    <ul>{plan.effectiveGoals.map((goal) => <li key={goal}><Check aria-hidden="true" /> {goalLabels[goal]}</li>)}</ul>
                  </section>
                  <section>
                    <header><div><span>Equipment</span><h2>Recommended device count</h2></div><button type="button" onClick={() => goToStep('scope', 'edit')}>Change</button></header>
                    <div className="tara-cfg-review-rows">{plan.rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
                  </section>
                </div>
                <div className="tara-cfg-next-expectation">
                  <span><strong>1</strong> Send this starting plan</span>
                  <span><strong>2</strong> Confirm products and scope</span>
                  <span><strong>3</strong> Receive a configured, room-labeled kit</span>
                </div>
                {draft.placement.items.length > 0 && <section className="tara-cfg-placement-entry"><div><h2>Placement plan</h2><p>{mapped.rooms} rooms, {mapped.windows} windows, {mapped.doors} doors, {mapped.devices} devices placed. Quote: {plan.cameraZones} camera zones and {draft.presenceZones} presence zones. Other placements are requests for scope review, not included prices.</p></div><button type="button" className="tara-cfg-button tara-cfg-button--quiet" disabled={plannerLoading} onClick={() => void openPlanner()}><Map aria-hidden="true" /> Review map</button>{plannerError && <p role="alert">{plannerError}</p>}</section>}
                <StageActions showBack onBack={back} onContinue={next} continueLabel="Continue to contact" />
              </>
            )}

            {step === 'contact' && submitStatus !== 'success' && (
              <>
                <StageHeader eyebrow="Step 5 of 5 · No payment" title="Where should we send the reviewed scope?" body="Tara will use these details to follow up about this home plan. Phone is optional." headingRef={headingRef} />
                <form className="tara-cfg-contact-form" onSubmit={handleSubmit} data-analytics="tara-configurator-v2">
                  <div className="tara-cfg-field-grid">
                    <label><span>Name</span><input name="name" autoComplete="name" value={contact.name} onChange={(event) => updateContact('name', event.target.value)} required /></label>
                    <label><span>Email</span><input name="email" type="email" autoComplete="email" value={contact.email} onChange={(event) => updateContact('email', event.target.value)} required /></label>
                    <label><span>ZIP / postal code</span><input name="zipCode" autoComplete="postal-code" value={contact.zipCode} onChange={(event) => updateContact('zipCode', event.target.value)} required /></label>
                    <label><span>Phone <small>Optional</small></span><input name="phone" type="tel" autoComplete="tel" value={contact.phone} onChange={(event) => updateContact('phone', event.target.value)} /></label>
                  </div>
                  <label className="tara-cfg-message"><span>Anything Tara should know? <small>Optional</small></span><textarea name="message" value={contact.message} onChange={(event) => updateContact('message', event.target.value)} placeholder="Timing, existing devices, install questions, or what you want the home to handle first." /></label>
                  <input className="tara-cfg-honeypot" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <div className="tara-cfg-contact-trust">
                    <Check aria-hidden="true" /><span>No checkout or commitment. Read the <a href="/privacy/">Privacy Policy</a>.</span>
                  </div>
                  {draft.placement.items.length > 0 && <p className="tara-cfg-placement-privacy">Room names, dimensions, and device placements will be sent with this plan. Uploaded floor-plan images stay on this device.</p>}
                  {submitStatus === 'error' && <>
                    <p className="tara-cfg-error" role="alert">{deliveryFailure === 'rate_limit' ? 'The form service is limiting requests. Please wait before trying again, or email Tara.' : 'We could not confirm receipt. Your plan is still here. The request may have reached us; keep the reference below when retrying or emailing Tara.'}</p>
                    {requestActions}
                  </>}
                  <div className="tara-cfg-stage-actions">
                    <button type="button" className="tara-cfg-button tara-cfg-button--quiet" onClick={back}><ArrowLeft aria-hidden="true" /> Back</button>
                    <button type="submit" className="tara-cfg-button tara-cfg-button--primary" disabled={submitStatus === 'submitting'}>
                      {submitStatus === 'submitting' ? 'Sending plan' : 'Send my plan'} <Send aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </>
            )}

            {step === 'contact' && submitStatus === 'success' && (
              <section className="tara-cfg-success" aria-live="polite">
                <span><CheckCircle2 aria-hidden="true" /></span>
                <p>Plan sent</p>
                <h1 id="tara-configurator-heading" ref={headingRef} tabIndex={-1}>Tara has a useful starting point.</h1>
                <div>Your planning request was accepted. We will review the scope before following up. No payment has been taken.</div>
                {requestActions}
                <a href="/" className="tara-cfg-button tara-cfg-button--primary">Return to Tara <ArrowRight aria-hidden="true" /></a>
              </section>
            )}
          </section>

          <aside className="tara-cfg-plan-preview" aria-label="Current plan preview">
            <p>Current plan</p>
            <h2>{draft.homeType ? plan.packageName : 'Start with the home'}</h2>
            {draft.homeType ? (
              <>
                <div className="tara-cfg-preview-price" aria-live="polite"><span>{plan.priceLabel}</span><strong>{plan.price}</strong></div>
                <dl>
                  <div><dt>Home</dt><dd>{homeTypeLabels[draft.homeType]}</dd></div>
                  <div><dt>Profile</dt><dd>{draft.bedrooms} bed · {draft.levels} {draft.levels === 1 ? 'level' : 'levels'}</dd></div>
                  <div><dt>Planned devices</dt><dd>{plan.plannedDevices}</dd></div>
                  <div><dt>Camera zones</dt><dd>{plan.cameraZones || 'None'}</dd></div>
                </dl>
                <div className="tara-cfg-preview-note"><Check aria-hidden="true" /><span>Local server included. This estimate updates with the plan; final products and price are confirmed with you.</span></div>
              </>
            ) : (
              <p className="tara-cfg-preview-empty">Choose the home shape and Tara will estimate a practical first scope.</p>
            )}
          </aside>
        </div>
      </main>
      {plannerOpen && Planner && <Planner value={draft.placement} onChange={placement => setDraft(current => ({...current, placement}))}
        levels={draft.levels} cameraZones={plan.cameraZones} presenceZones={draft.presenceZones} saveState={saveState}
        onApplyCounts={(cameras, presence) => setDraft(current => ({...current, cameraCoverage: cameras ? 'custom' : 'none', cameraZones: cameras, presenceZones: presence,
          goals: cameras && current.planMode === 'selected' && !current.goals.includes('cameras') ? [...current.goals, 'cameras'] : !cameras ? current.goals.filter(goal => goal !== 'cameras') : current.goals}))}
        onClose={closePlanner} />}
    </div>
  );
}
