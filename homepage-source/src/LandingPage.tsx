import {useCallback, useState} from 'react';
import {
  Activity,
  ArrowRight,
  BellRing,
  Bot,
  Clock,
  ChevronDown,
  CircleDollarSign,
  DoorOpen,
  Lightbulb,
  Menu,
  Mic2,
  Moon,
  PanelsTopLeft,
  PlugZap,
  Radar,
  ServerCog,
  Sparkles,
  Smartphone,
  Sun,
  Thermometer,
  X,
  type LucideIcon,
} from 'lucide-react';

const imageRoot = '/assets/images/sections';
const realImageRoot = '/assets/images/real';
const productImageRoot = '/assets/generated/product-gallery';

const productImageSet = (name: string) =>
  `${productImageRoot}/${name}-480.webp 480w, ${productImageRoot}/${name}-800.webp 800w, ${productImageRoot}/${name}-1400.webp 1400w`;

const images = {
  hero: `${realImageRoot}/real-living-room-fireplace-900.webp`,
  arrival: `${imageRoot}/solution-home.jpg`,
  security: `${realImageRoot}/real-home-dusk.jpg`,
  kit: '/assets/generated/camera-kit/tara-realistic-exploded-home-system-1280.webp',
  productBoard: `${productImageRoot}/tara-device-kit-product-board-1280.webp`,
  hubServer: `${productImageRoot}/tara-local-pc-hub-server-800.webp`,
  doorWindowSensors: `${productImageRoot}/tara-door-window-sensors-800.webp`,
  doorbellMounted: `${productImageRoot}/tara-smart-doorbell-mounted-800.webp`,
  thermostatPresence: `${productImageRoot}/tara-thermostat-presence-800.webp`,
  app: '/assets/generated/skill-references/tara-mobile-flow-board-1280.webp',
  yardCamera: '/assets/generated/camera-kit/tara-yard-camera-coverage-640.webp',
  frontDoorCamera: '/assets/generated/camera-kit/tara-front-door-camera-coverage-640.webp',
  sideGateCamera: '/assets/generated/camera-kit/tara-side-gate-camera-coverage-640.webp',
  localCameraReview: '/assets/generated/camera-kit/tara-local-camera-review-640.webp',
  cameraObjectZone: '/assets/generated/camera-capabilities/tara-camera-object-zone-detection-640.webp',
  cameraRetention: '/assets/generated/camera-capabilities/tara-camera-recording-retention-640.webp',
  cameraZoneAlerts: '/assets/generated/camera-capabilities/tara-camera-zone-alerts-640.webp',
  cameraAudioIncident: '/assets/generated/camera-capabilities/tara-camera-audio-incident-640.webp',
  cameraLocalReview: '/assets/generated/camera-capabilities/tara-camera-local-review-640.webp',
  cameraAppReview: '/assets/generated/camera-capabilities/tara-app-camera-review-640.webp',
  localAiApp: '/assets/generated/local-ai/tara-local-ai-habit-app-800.webp',
  cta: `${realImageRoot}/real-home-dusk-800.webp`,
};

const navItems = [
  ['features', 'Features'],
  ['devices', 'Devices'],
  ['how-it-works', 'How it works'],
  ['camera-kit', 'Camera kit'],
  ['pricing', 'Plans'],
  ['faq', 'FAQ'],
  ['about', 'About'],
] as const;

type FeatureRow = {
  title: string;
  body: string;
  Icon: LucideIcon;
};

const featureRows: FeatureRow[] = [
  {
    title: 'Connect any smart device',
    body: 'Local AI helps add robot vacuums, lawn devices, TVs, speakers, plugs, shades, and other smart gear into Tara routines.',
    Icon: PlugZap,
  },
  {
    title: 'Presence detection',
    body: 'Rooms know when someone is actually there, so lights and comfort do not depend on a motion timer.',
    Icon: Radar,
  },
  {
    title: 'Smart doorbell',
    body: 'The front door joins the same app, alerts, routines, and setup checklist.',
    Icon: BellRing,
  },
  {
    title: 'Door sensors',
    body: 'Exterior doors report open, closed, and routine state for arrivals, bedtime, and away mode.',
    Icon: DoorOpen,
  },
  {
    title: 'Window sensors',
    body: 'Windows are counted, labeled by room, and paired before the kit ships.',
    Icon: PanelsTopLeft,
  },
  {
    title: 'Phone app',
    body: 'One app shows rooms, devices, automations, doorbell events, camera zones, and setup.',
    Icon: Smartphone,
  },
  {
    title: 'Smart thermostat',
    body: 'Comfort follows presence, schedule, and away mode without another dial to manage.',
    Icon: Thermometer,
  },
  {
    title: 'Smart lights',
    body: 'Lights arrive grouped by room and scene, while normal switches still work.',
    Icon: Lightbulb,
  },
  {
    title: 'Local AI automations',
    body: 'The server suggests useful routines from repeated patterns before anything changes.',
    Icon: Sparkles,
  },
  {
    title: 'Habit detection',
    body: 'When the same arrival pattern repeats, Tara can ask whether to save it.',
    Icon: Clock,
  },
  {
    title: 'No subscriptions',
    body: 'Tara is a configured hardware kit with no required monthly subscription for the core smart-home routines.',
    Icon: CircleDollarSign,
  },
  {
    title: 'Local PC hub (server)',
    body: 'A compact 16GB RAM, 256GB storage mini PC server keeps routines running locally and is maintained by Tara.',
    Icon: ServerCog,
  },
];

const emotionRows = [
  ['Excited', 'A visible capability that feels almost impossible', 'Robots that map the yard, cameras that understand zones, lights that make the room change character instantly.'],
  ['Happy', 'A home that quietly takes care of people', 'Presence, comfort, scenes, speakers, and thermostat routines that make arrival and bedtime feel handled.'],
  ['Good', 'Confidence before someone commits', 'Local hub, no required subscription, normal switches, room labels, door and window state, and one app instead of scattered setup.'],
  ['Bad', 'The feeling Tara has to remove', 'Subscription fatigue, setup dread, privacy doubt, dead devices, guests being confused, and not knowing whether the home is actually closed.'],
];

const productEmotionRows = [
  ['Roomba robot / smart lawn mower', 'Relief', 'The chore disappears, but the owner still understands what happened.'],
  ['Smart TV / speakers', 'Delight', 'Scenes make the home feel personal, not just automated.'],
  ['Doorbell / cameras / locks', 'Awareness', 'The house explains what is open, closed, detected, or quiet.'],
  ['Thermostat / lights / presence', 'Calm', 'Comfort follows people without asking everyone to manage another dial.'],
];

const processSteps = [
  ['Describe the home', 'Choose the home type, bedrooms, levels, and the outcomes that matter most.'],
  ['Review the recommendation', 'Tara estimates a practical device scope. Adjust only the counts you already know.'],
  ['Send for scope review', 'Share your name, email, and ZIP. Phone is optional, and nothing is ordered yet.'],
];

const routineRows = [
  ['Arrive', 'Entry lights turn on, comfort settles, and Tara confirms the front door and windows.'],
  ['Stay', 'Presence keeps rooms comfortable while someone reads, works, or sits still.'],
  ['Leave', 'Away mode lowers comfort, turns off lights, and checks door and window state.'],
  ['Sleep', 'Night routines dim lights, quiet alerts, and keep exterior coverage active.'],
];

const kitItems = [
  'Configured local server',
  'Presence detection sensors',
  'Smart doorbell',
  'Window sensors',
  'Door sensors',
  'Smart lights',
  'Thermostat',
  'Phone app',
  'Room labels',
  'Mounting checklist',
  'Optional exterior cameras',
  'No required subscription',
];

const productGalleryRows = [
  {
    title: 'Local PC hub (server)',
    label: '16GB RAM / 256GB storage',
    body: 'A compact mini PC stays powered near the router or utility shelf and runs routines locally.',
    image: images.hubServer,
    srcSet: productImageSet('tara-local-pc-hub-server'),
    width: 800,
    height: 600,
  },
  {
    title: 'Door and window sensors',
    label: 'Labeled by room before shipping',
    body: 'Slim contact sensors report open, closed, and routine state by room.',
    image: images.doorWindowSensors,
    srcSet: productImageSet('tara-door-window-sensors'),
    width: 800,
    height: 600,
  },
  {
    title: 'Smart doorbell',
    label: 'Front door in the same app',
    body: 'Doorbell alerts, events, zones, and routines live in the same Tara flow.',
    image: images.doorbellMounted,
    srcSet: productImageSet('tara-smart-doorbell-mounted'),
    width: 800,
    height: 600,
  },
  {
    title: 'Thermostat and presence',
    label: 'Comfort follows the room',
    body: 'Thermostat control follows presence, schedule, and away mode.',
    image: images.thermostatPresence,
    srcSet: productImageSet('tara-thermostat-presence'),
    width: 800,
    height: 600,
  },
  {
    title: 'Phone app',
    label: 'Rooms, devices, events, setup',
    body: 'The Tara app shows room status, devices, automations, doorbell events, zones, and setup.',
    image: images.app,
    srcSet: '/assets/generated/skill-references/tara-mobile-flow-board-640.webp 640w, /assets/generated/skill-references/tara-mobile-flow-board-1280.webp 1280w, /assets/generated/skill-references/tara-mobile-flow-board-1920.webp 1920w',
    width: 1280,
    height: 725,
  },
] as const;

const deviceCapabilityRows: FeatureRow[] = [
  {
    title: 'Smart doorbell',
    body: 'Video doorbell feed, visitor events, chime handoff, and front-door routines live in the same app plan.',
    Icon: BellRing,
  },
  {
    title: 'Thermostat',
    body: 'Comfort follows schedule, presence, and away mode, with Tara confirming compatibility before shipping.',
    Icon: Thermometer,
  },
  {
    title: 'Door and window sensors',
    body: 'Open and closed state, room labels, bedtime checks, away checks, and battery health are planned together.',
    Icon: PanelsTopLeft,
  },
  {
    title: 'Presence sensors',
    body: 'Rooms can stay active while someone reads, works, or sits still instead of timing out on motion.',
    Icon: Radar,
  },
  {
    title: 'Smart lights',
    body: 'Room groups, scenes, arrival routines, bedtime routines, and normal switch behavior are kept intact.',
    Icon: Lightbulb,
  },
  {
    title: 'Local server',
    body: 'The 16GB RAM, 256GB storage server runs automations, health checks, and local AI support near the router.',
    Icon: ServerCog,
  },
];

const backgroundOpsRows: FeatureRow[] = [
  {
    title: 'AI health checks',
    body: 'Local agents watch device availability, battery signals, routine failures, and server state so issues get noticed.',
    Icon: Activity,
  },
  {
    title: 'Connection monitoring',
    body: 'Tara keeps track of sensors, lights, doorbell, thermostat, cameras, and the hub so the app can surface what needs attention.',
    Icon: ServerCog,
  },
  {
    title: 'Voice-created automations',
    body: 'Ask Tara for a routine in plain language. It drafts the automation for review before turning anything on.',
    Icon: Mic2,
  },
  {
    title: 'Smart local AI',
    body: 'Suggestions run around the local server and home context, not a pile of disconnected cloud apps.',
    Icon: Bot,
  },
  {
    title: 'Environment aware',
    body: 'Presence, time of day, door state, comfort, and device status help Tara decide when a suggestion makes sense.',
    Icon: Radar,
  },
  {
    title: 'Quiet maintenance',
    body: 'The system is designed to keep routines healthy in the background instead of making the homeowner debug every device.',
    Icon: Sparkles,
  },
] as const;

const packages = [
  {
    name: 'Starter smart home kit',
    price: '$2,999',
    prefix: '1-bedroom',
    badge: '1-bedroom starter',
    featured: false,
    rows: [
      ['Starting point', 'Lights, presence, doorbell, door and window sensors, thermostat, and app.'],
      ['Scope changes with', 'Rooms, windows, doors, lights, thermostats, and installation scope.'],
      ['Included', 'Configured local server'],
      ['Included', 'Presence sensors'],
      ['Included', 'Smart doorbell'],
      ['Included', 'Door sensors'],
      ['Included', 'Window sensors'],
      ['Included', 'Thermostat'],
      ['Included', 'Phone app'],
    ],
  },
  {
    name: 'Camera kit',
    price: '$9,999',
    prefix: 'From',
    badge: 'Most complete',
    featured: true,
    rows: [
      ['Starting point', 'Starter kit plus exterior cameras for driveway, side gate, backyard, and package zones.'],
      ['Scope changes with', 'Camera count, retention plan, detection zones, and installation scope.'],
      ['Included', 'Starter included'],
      ['Included', 'Exterior cameras'],
      ['Included', 'Doorbell video'],
      ['Included', 'Named camera zones'],
      ['Included', 'Local-first review'],
      ['Included', 'No required monthly fee'],
    ],
  },
];

const pricingComparisonRows = [
  {
    label: 'Upfront spend',
    diy: 'Parts look cheaper at first',
    pro: '$10k-$25k+ projects',
    tara: 'Starts at one-bedroom scope',
  },
  {
    label: 'Scope fit',
    diy: 'You count and choose every part',
    pro: 'Installer designs the job',
    tara: 'Call confirms the final count',
  },
  {
    label: 'Configuration',
    diy: '20-40 hours if you are careful',
    pro: 'Programming billed into project',
    tara: 'Prepared before shipping',
  },
  {
    label: 'Protocol choices',
    diy: 'Matter, Thread, MQTT, hubs',
    pro: 'Handled inside installer stack',
    tara: 'Chosen for reliability',
  },
  {
    label: 'Ownership',
    diy: 'Apps, plans, firmware, privacy',
    pro: 'Service relationship',
    tara: 'Local server plus health checks',
  },
] as const;

const pricingValueCards = [
  {
    title: 'Home-size pricing',
    body: 'A small condo and a large house should not ship the same count. Tara turns the home count into a kit plan instead of making you become the integrator.',
  },
  {
    title: 'Protocol decisions handled',
    body: 'Matter, Thread, Bluetooth, Wi-Fi, Zigbee, MQTT, bridges, and device reliability are reviewed for the actual home.',
  },
  {
    title: 'Self-install without research',
    body: 'You still mount devices. Tara handles labels, pairing, room plan, automations, and app handoff before the box arrives.',
  },
  {
    title: 'Built for future agents',
    body: 'The local server becomes the base for home agents that track device health, learn habits, and ask before changes.',
  },
];

const referralRows = [
  ['Share Tara', 'Send a referral link after your kit is working.'],
  ['Get $500 smart-home credit', 'Use it toward extra sensors, lights, cameras, speakers, robot vacuums, lawn devices, or other gear.'],
];

const cameraRows = [
  {
    title: 'Yard camera coverage',
    body: 'Backyard, patio, and fence-line zones planned into the camera kit.',
    image: images.yardCamera,
  },
  {
    title: 'Front door and packages',
    body: 'Doorbell and entry cameras cover visitors, packages, and the walkway.',
    image: images.frontDoorCamera,
  },
  {
    title: 'Side gate and paths',
    body: 'Side-yard, gate, and driveway approaches named before shipping.',
    image: images.sideGateCamera,
  },
  {
    title: 'Runs locally',
    body: 'Camera routines run around the local server, not a required monthly plan.',
    image: images.localCameraReview,
  },
];

const cameraCapabilityRows = [
  {
    title: 'Object and zone detection',
    body: 'People, vehicles, animals, and package-zone alerts can be planned where the camera model and placement support them.',
    image: images.cameraObjectZone,
  },
  {
    title: 'Recording retention plan',
    body: 'Continuous, motion, or event recording and retention days are set during the camera-kit call.',
    image: images.cameraRetention,
  },
  {
    title: 'Different alerts by zone',
    body: 'Driveway, side gate, front walk, backyard, and package zones can trigger different review events.',
    image: images.cameraZoneAlerts,
  },
  {
    title: 'Audio and incident options',
    body: 'Supported audio events can be configured where the camera or microphone supports them; water needs can be planned with leak sensors.',
    image: images.cameraAudioIncident,
  },
  {
    title: 'Local review',
    body: 'Camera review is designed around the local server, not a required monthly cloud plan for the core kit.',
    image: images.cameraLocalReview,
  },
] as const;

const cameraCarouselRows = [
  ...cameraRows,
  ...cameraCapabilityRows,
  {
    title: 'Tara app camera review',
    body: 'Zones, events, retention, and local server status live in one phone view.',
    image: images.cameraAppReview,
    variant: 'app',
  },
] as const;

const faqRows = [
  ['Is Tara a DIY smart home kit?', 'It is self-install, but not DIY research. You mount the devices; Tara prepares the labels, pairing, local server, app handoff, and room checklist.'],
  ['Is the price the same for every home?', 'No. The listed packages are starting points. A small condo and a large house get different device counts, and Tara confirms the final scope on the call.'],
  ['What do I enter when ordering?', 'Enter windows, exterior doors, rooms, lights, thermostats, doorbells, and optional camera zones. Tara can draft the list before you confirm.'],
  ['Why not buy separate smart-home parts?', 'You can. Tara is for homeowners who want device selection, protocols, labels, automations, local server setup, and health checks handled as one plan.'],
  ['Do you use Matter, Thread, or Bluetooth?', 'Tara decides after the call. We choose the right mix of Matter, Thread, Bluetooth, Wi-Fi, Zigbee, or Z-Wave based on the home, device reliability, and install plan.'],
  ['What is the local PC hub server?', 'A compact 16GB RAM, 256GB storage mini PC server that stays powered near the router, office shelf, or utility closet. Tara configures and maintains it.'],
  ['What happens if the hub loses power?', 'Normal switches still work. Tara routines pause while the server is offline, then resync when power returns.'],
  ['How are hub updates handled?', 'Tara schedules and tests updates so they run quietly. Larger changes can include a support handoff.'],
  ['Does the kit require a subscription?', 'No required monthly subscription for core routines, sensors, thermostat control, and app handoff.'],
  ['What features does the smart doorbell have?', 'The doorbell is planned for front-door video, visitor events, chime handoff, routines, and app review. Exact features are confirmed with the selected hardware before shipping.'],
  ['What can the thermostat do?', 'Thermostat setup is planned around schedule, presence, away mode, and app control. Tara confirms compatibility with the home before selecting hardware.'],
  ['What can the cameras detect?', 'The camera kit is planned around local object detection, named zones, review events, and supported audio options. Person, vehicle, animal, and package-zone alerts depend on camera placement and model support.'],
  ['How long do cameras record?', 'Recording mode and retention are set during the camera-kit call. Tara confirms continuous, motion, or event recording and the number of retention days before anything ships.'],
  ['Can it alert for fire or water?', 'Supported audio events can be configured when the camera or microphone supports them. If water is a priority, Tara plans dedicated leak sensors instead of relying only on camera audio.'],
  ['How do I add robot vacuums, lawn devices, TVs, or speakers?', 'Tara local AI helps identify compatible integrations and drafts the setup. If it cannot finish, it packages the device details into a support request so Tara can help configure it.'],
  ['What is in the camera kit?', 'The camera kit includes the starter kit plus exterior cameras for entries, driveway, packages, side yard, or backyard zones.'],
  ['Can normal switches still work?', 'Yes. Everyday controls remain familiar while routines and app control work in the background.'],
  ['Is this only for new construction?', 'No. Tara is built for existing homes, listings, pilots, and move-in-ready upgrades.'],
];

export function LandingPageReimagined({
  darkMode,
  setDarkMode,
  variant = 'daylight',
  ready,
  year,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  variant?: string;
  ready: boolean;
  year: number;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }, []);

  return (
    <div data-tara-theme={darkMode ? 'dark' : 'light'} data-tara-variant={variant} data-tara-ready={ready} className="tara-rx min-h-screen overflow-x-clip">
      <a href="#top" className="tara-skip-link">Skip to content</a>
      <Nav
        ready={ready}
        darkMode={darkMode}
        mobileMenuOpen={mobileMenuOpen}
        onMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onTheme={() => setDarkMode(!darkMode)}
        onScroll={scrollTo}
      />

      <main id="top">
        <Hero onScroll={scrollTo} variant={variant} />
        {variant === 'neuro' && <EmotionSection />}
        <FeatureSection />
        <ProductGallerySection />
        <BackgroundOpsSection />
        <HowItWorksSection />
        <LayerSection />
        <KitSection />
        <CameraKitSection />
        <DecisionSection />
        <CtaSection />
        <FaqSection />
        <AboutSection />
      </main>

      <Footer year={year} />
    </div>
  );
}

function Nav({
  ready,
  darkMode,
  mobileMenuOpen,
  onMenu,
  onTheme,
  onScroll,
}: {
  ready: boolean;
  darkMode: boolean;
  mobileMenuOpen: boolean;
  onMenu: () => void;
  onTheme: () => void;
  onScroll: (id: string) => void;
}) {
  return (
    <nav className="tara-rx-nav fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a href="#top" onClick={() => onScroll('top')} className="tara-rx-brand tara-rx-focus">
          <span>Tara</span>
        </a>

        <div className="tara-rx-nav-links hidden lg:flex">
          {navItems.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => onScroll(id)} className="tara-rx-focus">
              <span>{label}</span>
            </a>
          ))}
          <a href="/blog/" className="tara-rx-focus"><span>Library</span></a>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" disabled={!ready} onClick={onTheme} aria-label={darkMode ? 'Use light theme' : 'Use dark theme'} className="tara-rx-icon-button tara-rx-focus">
            {darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
          <a href="/configurator/" className="tara-rx-pill-button tara-rx-focus hidden sm:inline-flex">
            <span className="tara-rx-nav-label">Plan my home</span>
            <ArrowRight aria-hidden="true" />
          </a>
          <button type="button" disabled={!ready} onClick={onMenu} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} aria-controls="tara-mobile-menu" className="tara-rx-icon-button tara-rx-menu-button tara-rx-focus lg:hidden">
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="tara-mobile-menu" className="tara-rx-mobile-menu mx-auto mt-3 max-w-7xl lg:hidden">
          {navItems.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => onScroll(id)} className="tara-rx-focus">
              <span>{label}</span>
            </a>
          ))}
          <a href="/blog/" className="tara-rx-focus"><span>Library</span></a>
          <a href="/configurator/" className="tara-rx-mobile-cta tara-rx-focus">
            Plan my home
          </a>
        </div>
      )}
    </nav>
  );
}

function Hero({onScroll, variant}: {onScroll: (id: string) => void; variant: string}) {
  const isNeuro = variant === 'neuro';

  return (
    <section className="tara-rx-hero relative isolate min-h-[100dvh] overflow-hidden px-5 pt-32 sm:px-6">
      <img
        src={images.hero}
        srcSet={`${realImageRoot}/real-living-room-fireplace-900.webp 900w, ${realImageRoot}/real-living-room-fireplace-1600.webp 1600w`}
        sizes="100vw"
        width="1600"
        height="1067"
        fetchPriority="high"
        decoding="async"
        alt="Bright finished home at sunrise"
        className="tara-rx-hero-image"
      />
      <div className="tara-rx-hero-wash" />
      <div className="tara-rx-hero-grid relative mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl grid-cols-1 content-end gap-10 pb-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(18rem,0.42fr)] lg:items-end lg:pb-16">
        <div>
          <p className="tara-rx-kicker">{isNeuro ? 'Emotion-led home automation' : 'Tara Home'}</p>
          <h1 className="tara-rx-display">{isNeuro ? 'Make the smart home feel safe before it feels smart.' : 'Tara Home smart home kits, configured before they ship.'}</h1>
          <p className="tara-rx-lede">
            {isNeuro
              ? 'The products people remember create a feeling first: relief, control, delight, and trust. Tara uses that logic to make every device feel like one calm home instead of another install headache.'
              : 'If you are tired of setting up hubs, protocols, apps, and automations, Tara Home sends the whole-home kit and lets AI agents help with setup, health checks, and maintenance.'}
          </p>
          <div className="tara-rx-cta-row">
            <a href="/configurator/" className="tara-rx-primary-button tara-rx-focus">
              {isNeuro ? 'Build the feeling' : 'Plan my smart home'}
              <ArrowRight aria-hidden="true" />
            </a>
            <a href="#features" onClick={(event) => {event.preventDefault(); onScroll('features');}} className="tara-rx-quiet-button tara-rx-focus" data-analytics="hero_see_how_it_works" data-analytics-section="features">
              See how it works
            </a>
          </div>
        </div>

        <aside className="tara-rx-hero-note">
          <span>{isNeuro ? 'Emotion map' : 'Kit includes'}</span>
          <p>{isNeuro ? 'Excited by capability. Happy in the routine. Good because it is local and clear. Bad feelings removed before setup.' : 'Presence detection, smart doorbell, sensors, thermostat, lights, phone app, and optional exterior cameras. Final count follows the home.'}</p>
        </aside>
      </div>
    </section>
  );
}

function EmotionSection() {
  return (
    <section id="emotion" className="tara-rx-section tara-rx-emotion px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">Brain-response lens</p>
            <h2 className="tara-rx-title">Design for the feeling that makes people keep the product.</h2>
          </div>
          <p className="tara-rx-body">
            TRIBE v2 predicts fMRI-like responses to sights, sounds, and language. For Tara, the useful takeaway is not “emotion detection”; it is a discipline for testing whether the story creates excitement, calm, confidence, or avoidable anxiety.
          </p>
        </div>

        <div className="tara-rx-emotion-grid">
          {emotionRows.map(([label, title, body]) => (
            <article key={label}>
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <aside className="tara-rx-product-emotion">
          <p className="tara-rx-kicker">Products people already understand</p>
          <div>
            {productEmotionRows.map(([product, feeling, body]) => (
              <article key={product}>
                <span>{feeling}</span>
                <h3>{product}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="tara-rx-section tara-rx-features px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-feature-board">
          <div className="tara-rx-feature-lead">
            <p className="tara-rx-kicker">Smart home kit features</p>
            <h2 className="tara-rx-title">A complete smart home kit, configured around the house.</h2>
            <p className="tara-rx-body">
              Tara plans devices by room, door, window, light, comfort zone, and optional camera zone.
            </p>
          </div>

          <div className="tara-rx-feature-grid">
            {featureRows.map(({title, body, Icon}) => (
              <article key={title}>
                <div className="tara-rx-feature-title">
                  <span className="tara-rx-feature-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                </div>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductGallerySection() {
  return (
    <section id="devices" className="tara-rx-section tara-rx-products px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">Devices you can see</p>
            <h2 className="tara-rx-title">The kit is physical hardware, not just app promises.</h2>
          </div>
          <p className="tara-rx-body">
            See the server, sensors, doorbell, thermostat, and app before the kit ships.
          </p>
        </div>

        <div className="tara-rx-product-board">
          <img
            src={images.productBoard}
            srcSet="/assets/generated/product-gallery/tara-device-kit-product-board-640.webp 640w, /assets/generated/product-gallery/tara-device-kit-product-board-1280.webp 1280w"
            sizes="(max-width: 700px) 100vw, 1280px"
            width="1280"
            height="720"
            loading="lazy"
            decoding="async"
            alt="Tara smart home kit with local PC hub server, door and window sensors, doorbell, thermostat, and phone app"
          />
        </div>

        <div className="tara-rx-product-gallery">
          {productGalleryRows.map((item) => (
            <article key={item.title}>
              <div className="tara-rx-product-media">
                <img src={item.image} srcSet={item.srcSet} sizes="(max-width: 700px) 100vw, 620px" width={item.width} height={item.height} loading="lazy" decoding="async" alt={item.title} />
              </div>
              <div>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="tara-rx-device-capability">
          <div>
            <p className="tara-rx-kicker">Device capability</p>
            <h3>More detail on what the hardware can do.</h3>
          </div>
          <div className="tara-rx-device-capability-grid">
            {deviceCapabilityRows.map(({title, body, Icon}) => (
              <article key={title}>
                <span className="tara-rx-feature-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BackgroundOpsSection() {
  return (
    <section className="tara-rx-section tara-rx-background-ops px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">What runs in the background</p>
            <h2 className="tara-rx-title">AI agents keep the home healthy after the devices are mounted.</h2>
          </div>
          <p className="tara-rx-body">
            Tara is not only the hardware you see. The local server keeps checking device state, connection health, routines, and home context so the system stays understandable.
          </p>
        </div>

        <div className="tara-rx-background-grid">
          {backgroundOpsRows.map(({title, body, Icon}) => (
            <article key={title}>
              <span className="tara-rx-feature-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="tara-rx-section tara-rx-process px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-sticky-section">
          <div className="tara-rx-sticky-lead">
            <p className="tara-rx-kicker">How it works</p>
            <h2 className="tara-rx-title">Describe the home. Review the scope. Talk to Tara.</h2>
            <p className="tara-rx-body">
              Answer a few focused questions, review Tara's recommended counts, then send the plan before any devices are selected, priced, or shipped.
            </p>
          </div>

          <div className="tara-rx-sticky-content">
            <aside className="tara-rx-ai-count">
              <div>
                <p className="tara-rx-kicker">Smart kit planner</p>
                <h3>Start with a draft.</h3>
              </div>
              <p>
                Answer a few questions. Tara recommends a starting scope.
              </p>
              <a href="/configurator/" className="tara-rx-primary-button tara-rx-focus">
                Start home plan
                <ArrowRight aria-hidden="true" />
              </a>
            </aside>

            <div className="tara-rx-process-grid">
              {processSteps.map(([title, body], index) => (
                <article key={title}>
                  <span className="tara-rx-process-index">{String(index + 1).padStart(2, '0')}</span>
                  {index < processSteps.length - 1 && (
                    <span className="tara-rx-process-arrow" aria-hidden="true">
                      <ArrowRight />
                    </span>
                  )}
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>

            <aside className="tara-rx-home-formula">
              <p className="tara-rx-kicker">Plan inputs</p>
              <div>
                {['Home type', 'Bedrooms', 'Levels', 'Priorities', 'Windows', 'Exterior doors', 'Rooms', 'Smart lights', 'Thermostats', 'Doorbells', 'Presence zones', 'Optional camera zones'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function LayerSection() {
  return (
    <section id="layer" className="tara-rx-section tara-rx-layer px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-ai-system">
          <div className="tara-rx-ai-copy">
            <p className="tara-rx-kicker">Presence, comfort, local AI</p>
            <h2 className="tara-rx-title">Tara learns patterns, then asks before automating.</h2>
            <p className="tara-rx-body">
              Tara watches repeated local patterns and asks before turning them into routines.
            </p>
          </div>

          <figure className="tara-rx-ai-visual">
            <img
              src={images.localAiApp}
              srcSet="/assets/generated/local-ai/tara-local-ai-habit-app-480.webp 480w, /assets/generated/local-ai/tara-local-ai-habit-app-800.webp 800w"
              sizes="(max-width: 700px) 90vw, 500px"
              width="800"
              height="1200"
              loading="lazy"
              decoding="async"
              alt="Tara app asking before saving an evening arrival routine"
            />
          </figure>

          <div className="tara-rx-routine-stack">
            {routineRows.map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function KitSection() {
  return (
    <section id="kit" className="tara-rx-section tara-rx-kit px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">What ships</p>
            <h2 className="tara-rx-title">A labeled self-install kit, not a research project.</h2>
          </div>
          <p className="tara-rx-body">
            You still mount the devices. Tara handles selection, labels, pairing, app handoff, and the room-by-room checklist before the box arrives.
          </p>
        </div>

        <div className="tara-rx-kit-stage">
          <img
            src={images.kit}
            srcSet="/assets/generated/camera-kit/tara-realistic-exploded-home-system-640.webp 640w, /assets/generated/camera-kit/tara-realistic-exploded-home-system-1280.webp 1280w"
            sizes="(max-width: 700px) 100vw, 1280px"
            width="1280"
            height="720"
            loading="lazy"
            decoding="async"
            alt="Realistic cutaway view of a Tara smart home kit with server, sensors, doorbell, thermostat, lights, and exterior cameras"
          />
          <div>
            {kitItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CameraKitSection() {
  const cameraRowsTop = cameraCarouselRows.filter((_, index) => index % 2 === 0);
  const cameraRowsBottom = cameraCarouselRows.filter((_, index) => index % 2 === 1);

  return (
    <section id="camera-kit" className="tara-rx-section tara-rx-camera px-5 sm:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(18rem,0.3fr)_minmax(0,0.7fr)] lg:items-center">
        <div>
          <p className="tara-rx-kicker">Camera kit</p>
          <h2 className="tara-rx-title">Exterior cameras planned around useful events.</h2>
          <p className="tara-rx-body">
            The camera kit includes the starter kit, then adds yard, front door, side-gate, driveway, and package zones to the same local plan.
          </p>
        </div>

        <div className="tara-rx-camera-carousel" aria-label="Camera kit capabilities">
          <div className="tara-rx-camera-lanes">
            {[cameraRowsTop, cameraRowsBottom].map((row, rowIndex) => (
              <div key={rowIndex === 0 ? 'top-camera-row' : 'bottom-camera-row'} className={`tara-rx-camera-track ${rowIndex === 1 ? 'tara-rx-camera-track--reverse' : ''}`}>
                {[...row, ...row].map((item, index) => (
                  <article
                    key={`${item.title}-${rowIndex}-${index}`}
                    data-camera-card={'variant' in item && item.variant === 'app' ? 'app' : undefined}
                    aria-hidden={index >= row.length ? true : undefined}
                  >
                    <figure>
                      <img src={item.image} width="640" height={'variant' in item && item.variant === 'app' ? 1137 : 360} loading="lazy" decoding="async" alt="" />
                    </figure>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}

function DecisionSection() {
  return (
    <section id="pricing" className="tara-rx-section tara-rx-decision px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">Plans</p>
            <h2 className="tara-rx-title">Starting packages, scoped after the call.</h2>
          </div>
          <p className="tara-rx-body">
            A small condo and a large house should not ship the same kit. Tara starts with the home count, then turns it into a whole-home kit plan that is easier to live with than a pile of parts.
          </p>
        </div>

        <div className="tara-rx-decision-grid">
              <div className="tara-rx-price-grid">
                {packages.map((pkg) => (
                  <article key={pkg.name} className={pkg.featured ? 'tara-rx-price-card-featured' : undefined}>
                    <div>
                      <div>
                        <span className="tara-rx-price-badge">{pkg.badge}</span>
                        <h3>{pkg.name}</h3>
                      </div>
                      <strong aria-label={`${pkg.prefix} ${pkg.price} starting package`}>
                        <small>Starting package</small>
                        <span><em>{pkg.prefix}</em>{pkg.price}</span>
                      </strong>
                    </div>
                    <div className="tara-rx-package-table" role="table" aria-label={`${pkg.name} package scope`}>
                      {pkg.rows.map(([label, value], index) => (
                        <div key={`${label}-${value}-${index}`} role="row">
                          <span role="rowheader">{label}</span>
                          <p role="cell">{value}</p>
                        </div>
                      ))}
                    </div>
                    <a href="/configurator/" className="tara-rx-quiet-button tara-rx-focus">
                      Plan this package
                      <ArrowRight aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>

              <aside className="tara-rx-price-proof" aria-label="Pricing context">
                <div>
                  <p className="tara-rx-kicker">Cost context</p>
                  <h3>Compare the real options.</h3>
                </div>
                <div className="tara-rx-price-table" role="table" aria-label="Smart home setup comparison">
                  <div className="tara-rx-price-table-row tara-rx-price-table-head" role="row">
                    <span role="columnheader">Cost driver</span>
                    <strong role="columnheader">DIY from parts</strong>
                    <strong role="columnheader">Professional install</strong>
                    <strong role="columnheader">Tara</strong>
                  </div>
                  {pricingComparisonRows.map(({label, diy, pro, tara}) => (
                    <div className="tara-rx-price-table-row" role="row" key={label}>
                      <span role="rowheader">{label}</span>
                      <p role="cell" data-label="DIY from parts">{diy}</p>
                      <p role="cell" data-label="Professional install">{pro}</p>
                      <p role="cell" data-label="Tara">{tara}</p>
                    </div>
                  ))}
                </div>
                <div className="tara-rx-price-value-grid">
                  {pricingValueCards.map(({title, body}) => (
                    <article key={title}>
                      <h4>{title}</h4>
                      <p>{body}</p>
                    </article>
                  ))}
                </div>
                <p className="tara-rx-price-proof-note">
                  Planning anchors from public installation guides, smart-home protocol docs, and camera subscription pricing. Final device mix and retention plan are confirmed on the call.
                </p>
              </aside>

              <aside className="tara-rx-agent-path">
                <p className="tara-rx-kicker">Referral credit</p>
                <div className="tara-rx-referral">
                  <p>Customer referral</p>
                  <strong>Get $500</strong>
                  <span>as smart-home credit once the referral converts.</span>
                </div>
                <h3>Use the credit to make another part of the home smarter.</h3>
                <div className="tara-rx-partner-list">
                  {referralRows.map(([title, body]) => (
                    <div key={title}>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="tara-rx-section tara-rx-about px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-about-grid">
          <p className="tara-rx-kicker">About Tara</p>
          <p>
            <strong>Built in Spokane, Washington.</strong> Tara began as a self-hosted Home Assistant companion for local habit detection. Tara Home now brings that local-first approach into configured, room-labeled smart home kits. <a href="/spokane-smart-home/">See Spokane smart home planning</a> or <a href="/tara-assistant/">explore the Tara Assistant project</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="tara-rx-section tara-rx-faq px-5 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="tara-rx-wide-head">
          <div>
            <p className="tara-rx-kicker">Smart home kit FAQ</p>
            <h2 className="tara-rx-title">Answers before you order.</h2>
          </div>
          <p className="tara-rx-body">
            Short answers for kit setup, protocols, server behavior, cameras, and subscriptions.
          </p>
        </div>

        <div className="tara-rx-faq-grid">
          {faqRows.map(([question, answer]) => (
            <details key={question} className="tara-rx-faq-item">
              <summary>
                <span>{question}</span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section id="cta" className="tara-rx-cta relative isolate overflow-hidden px-5 py-24 sm:px-6 md:py-32">
      <img
        src={images.cta}
        srcSet={`${realImageRoot}/real-home-dusk-800.webp 800w, ${realImageRoot}/real-home-dusk-1600.webp 1600w`}
        sizes="100vw"
        width="1600"
        height="2404"
        loading="lazy"
        decoding="async"
        alt="Finished home ready for Tara"
      />
      <div className="tara-rx-cta-wash" />
      <div className="tara-rx-cta-copy relative mx-auto max-w-5xl text-center">
        <p className="tara-rx-kicker">Tara Home</p>
        <h2 className="tara-rx-display">Order the kit around your home.</h2>
        <p className="tara-rx-lede mx-auto">
          Tired of setting this all up? Tara sends the whole-home kit, then AI agents help with setup, automations, health checks, and maintenance so you can enjoy your family and your life.
        </p>
        <div className="tara-rx-cta-row justify-center">
          <a href="/configurator/" className="tara-rx-primary-button tara-rx-focus">
            Start home plan
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <p className="tara-rx-cta-note">
          Questions before configuring? Email <a href="mailto:hello@tarahome.ai">hello@tarahome.ai</a>.
        </p>
      </div>
    </section>
  );
}

function Footer({year}: {year: number}) {

  return (
    <footer className="tara-rx-footer px-5 py-12 sm:px-6">
      <div className="tara-rx-footer-inner mx-auto max-w-7xl">
        <div className="tara-rx-footer-top">
          <a href="/" className="tara-rx-brand tara-rx-focus">
            <span>Tara</span>
          </a>
          <div className="tara-rx-footer-links" aria-label="Footer links">
            <a href="/blog/" className="tara-rx-focus">Library</a>
            <a href="/smart-home-kit/" className="tara-rx-focus">Smart home kits</a>
            <a href="/no-subscription-smart-home/" className="tara-rx-focus">No subscription</a>
            <a href="/spokane-smart-home/" className="tara-rx-focus">Spokane</a>
            <a href="/tara-assistant/" className="tara-rx-focus">Tara Assistant</a>
            <a href="#pricing" className="tara-rx-focus">Pricing</a>
            <a href="#features" className="tara-rx-focus">Features</a>
            <a href="/configurator/" className="tara-rx-focus">Home plan</a>
            <a href="/privacy/" className="tara-rx-focus">Privacy Policy</a>
            <a href="/terms/" className="tara-rx-focus">Terms of Service</a>
            <a href="mailto:hello@tarahome.ai" className="tara-rx-focus">Contact</a>
          </div>
        </div>
        <div className="tara-rx-footer-bottom">
          <p className="tara-rx-footer-meta">
            <span>Configured smart-home kits from Spokane, Washington.</span>
            <span>© {year} Tara Home. All rights reserved.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
