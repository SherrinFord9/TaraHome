#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const updated = '2026-07-17';
const updates = [
  {
    slug: 'home-assistant-bluetooth-proxy-guide',
    oldTitle: 'Home Assistant Bluetooth Proxy: When You Need One and How to Add It',
    title: 'Home Assistant Bluetooth Proxy Setup (ESPHome)',
    oldDescription: 'Use an ESP32 Bluetooth proxy when your Home Assistant box is far from BLE devices, virtualized, or struggling with USB Bluetooth. Learn setup, placement, and limits.',
    description: 'Set up an ESPHome Bluetooth proxy for Home Assistant, place it for reliable BLE coverage, and learn when a proxy helps or adds no value.',
  },
  {
    slug: 'best-doorbell-camera-home-assistant-2026',
    oldTitle: 'Best Doorbell Cameras for Home Assistant in 2026',
    title: 'Best Home Assistant Doorbell Cameras for 2026',
    oldDescription: 'Choose a Home Assistant doorbell camera in 2026: Reolink for local-first installs, UniFi if you already run Protect, Aqara for Apple/HomeKit Secure Video, and Ring only if you accept cloud dependency.',
    description: 'Compare Reolink, UniFi, Aqara, and Ring doorbells for Home Assistant, including local video, official integrations, cloud limits, and who each suits.',
  },
  {
    slug: 'home-assistant-main-lan-vs-iot-vlan',
    oldTitle: 'Should Home Assistant Live on Your Main Network or IoT VLAN?',
    title: 'Should Home Assistant Be on an IoT VLAN?',
    oldDescription: 'Should Home Assistant live on your main LAN or IoT VLAN? Learn the discovery tradeoffs, mDNS and SSDP limits, and the network layouts that actually work.',
    description: 'Choose whether Home Assistant belongs on your main LAN or IoT VLAN, with practical mDNS, SSDP, firewall, discovery, and security tradeoffs.',
  },
  {
    slug: 'home-assistant-energy-dashboard-sensor-not-showing',
    oldTitle: "Why Your Sensor Won't Show Up in Home Assistant Energy Dashboard",
    title: 'Home Assistant Energy Dashboard Sensor Missing? Fix It',
    oldDescription: 'Fix Home Assistant Energy Dashboard sensors that will not appear by checking energy vs power, entity attributes, statistics, and whether you need an Integration or Utility Meter helper.',
    description: 'Fix a sensor missing from Home Assistant Energy Dashboard by checking power versus energy, device class, state class, units, and long-term statistics.',
  },
  {
    slug: 'best-water-leak-sensors-home-assistant-2026',
    oldTitle: 'Best Water Leak Sensors for Home Assistant in 2026',
    title: 'Best Home Assistant Water Leak Sensors for 2026',
    oldDescription: 'Compare Home Assistant water leak sensors by official support, local control, cloud dependency, Matter, HomeKit, Zigbee, Z-Wave, Wi-Fi, and YoLink caveats.',
    description: 'Compare Zooz, Third Reality, Aqara, Eve, Shelly, and YoLink leak sensors for Home Assistant by local control, protocol, range, and cloud dependence.',
  },
  {
    slug: 'home-assistant-wall-tablet-dashboard-stays-awake',
    oldTitle: 'How to Set Up a Home Assistant Wall Tablet Dashboard That Stays Awake',
    title: 'Home Assistant Wall Tablet Setup That Stays Awake',
    oldDescription: 'Build a reliable Home Assistant wall tablet dashboard: choose Companion app kiosk mode or Fully Kiosk, keep the screen awake safely, use a dedicated user, and avoid slow dashboard layouts.',
    description: 'Set up a Home Assistant wall tablet that stays awake using Companion app or Fully Kiosk, a dedicated user, safe charging, and a lightweight dashboard.',
  },
  {
    slug: 'home-assistant-thread-border-router-required',
    oldTitle: 'Why Home Assistant Says "Your Device Requires a Thread Border Router"',
    title: 'Home Assistant: Thread Border Router Required Fix',
    oldDescription: 'Fix the Home Assistant Matter error by checking Thread credentials, preferred network behavior, ZBT-1/ZBT-2 setup, IPv6, and mobile app onboarding.',
    description: 'Fix the Home Assistant Thread border router error by checking credentials, preferred networks, IPv6, phone access, and ZBT-1 or ZBT-2 setup.',
  },
  {
    slug: 'home-assistant-devices-unavailable-after-restart',
    oldTitle: 'Why Your Home Assistant Devices Are Unavailable After a Restart',
    title: 'Home Assistant Devices Unavailable After Restart? Fixes',
    oldDescription: 'Fix Home Assistant devices and entities showing unavailable by checking reachability, IP changes, mDNS, logs, MQTT discovery, ESPHome, Zigbee, Z-Wave, Matter, and cloud caveats before deleting devices.',
    description: 'Fix Home Assistant devices unavailable after restart by checking network reachability, IP changes, logs, MQTT, ESPHome, Zigbee, Z-Wave, and Matter.',
  },
  {
    slug: 'home-assistant-person-not-updating',
    oldTitle: 'Why Your Home Assistant Person Entity Is Stuck at Home or Away',
    title: 'Home Assistant Person Stuck Home or Away? Fix It',
    oldDescription: 'Fix Home Assistant presence on iPhone or Android when the person or device_tracker stays home or away by checking remote access, permissions, zone tracking, stale trackers, and battery limits.',
    description: 'Fix a Home Assistant person stuck home or away by checking phone permissions, remote access, zones, stale trackers, background updates, and battery limits.',
  },
  {
    slug: 'how-to-back-up-home-assistant',
    oldTitle: 'How to Back Up Home Assistant So You Can Actually Restore It',
    title: 'How to Back Up and Restore Home Assistant Safely',
    oldDescription: 'Use automatic backups, off-device copies, the backup emergency kit, and a test-restore routine so Home Assistant survives bad updates, dead SSDs, and full hardware moves.',
    description: 'Set up automatic Home Assistant backups, keep encrypted off-device copies, save the emergency kit, and test a restore before an update or hardware failure.',
  },
  {
    slug: 'home-assistant-automation-not-firing',
    oldTitle: 'Why Your Home Assistant Automation Is Not Firing',
    title: 'Home Assistant Automation Not Firing? 7 Checks',
    oldDescription: 'Fix a Home Assistant automation that does not fire by checking traces, trigger events, conditions, action errors, run modes, logs, templates, and time-zone issues in the right order.',
    description: 'Fix a Home Assistant automation that is not firing by checking traces, triggers, conditions, action errors, run modes, templates, logs, and time zones.',
  },
];

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.name === '.git' || entry.name === 'assets') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else if (entry.name.endsWith('.html') || entry.name === 'llms.txt') files.push(target);
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const update of updates) {
    content = content
      .split(`${update.oldTitle} | Tara Guides`).join(update.title)
      .split(update.oldTitle).join(update.title)
      .split(update.oldDescription).join(update.description);
  }

  const articleUpdate = updates.find((update) => file.endsWith(`/blog/${update.slug}/index.html`));
  if (articleUpdate) content = content.replace(/"dateModified": "\d{4}-\d{2}-\d{2}"/, `"dateModified": "${updated}"`);

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed += 1;
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
for (const update of updates) {
  const escaped = update.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(<loc>https://tarahome\\.ai/blog/${escaped}/<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  sitemap = sitemap.replace(pattern, `$1${updated}$2`);
}
fs.writeFileSync(sitemapPath, sitemap);

console.log(`Updated ${updates.length} search opportunities across ${changed} HTML/text files.`);
