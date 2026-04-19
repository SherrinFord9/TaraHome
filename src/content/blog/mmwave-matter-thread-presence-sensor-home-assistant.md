---
title: "How to Add Battery-Powered mmWave Presence Sensors to Home Assistant via Matter & Thread (No Cloud)"
description: "Set up Aqara FP300 or Meross MS605 mmWave sensors over Thread in Home Assistant—fully local, zero cloud, step-by-step."
date: "2026-03-08"
category: How-To
readTime: "8 min read"
---

## Why This Is a Big Deal

For years, mmWave presence detection meant one of two trade-offs: either you ran wired sensors (ESPHome, Aqara FP2) that needed a power outlet, or you settled for PIR motion sensors that miss anyone sitting still. The core problem is physics — 60 GHz radar chips draw more power than a coin cell can sustain if the radio runs continuously.

That changed in late 2025. The **Aqara FP300** and **Meross MS605** are among the first production battery-powered mmWave presence sensors that also speak **Matter over Thread**. Thread's mesh networking and ultra-low-power radio profile make the battery math work. The FP300 manages up to two years on two CR2450 coins; the MS605 stretches to three years on a single CR123A. Neither sensor requires a proprietary hub, a cloud account, or a vendor app after initial pairing.

If your goal is a fully local Home Assistant setup that knows when a room is occupied without cameras or mains wiring, this is the path.

## What You Need Before You Start

Matter over Thread requires a Thread border router on your network. Unlike Wi-Fi Matter devices that connect directly to your router, Thread devices form their own low-power mesh and only reach your LAN through a border router that bridges the two networks. Home Assistant has first-class support for this via the **OpenThread Border Router (OTBR)** add-on.

### Compatible Border Router Hardware

- **Home Assistant Connect ZBT-2** — the current recommended USB dongle (Silicon Labs MG24 chip, better sensitivity than its predecessor). Plug it in, go to Settings > Devices & Services, select the discovered ZBT-2 card, choose "Thread," and Home Assistant automatically flashes RCP firmware and installs the OTBR add-on.
- **Home Assistant Connect ZBT-1 / SkyConnect** — the previous generation. Still works. Select Configure > "Use as a Thread border router" to trigger the same automatic setup. Note: ZBT-1 can only run one protocol at a time, so switching to Thread means giving up Zigbee on that dongle.
- **Home Assistant Yellow** — has a built-in Silicon Labs module. Enable Thread through Settings > Hardware.
- **Third-party Thread border routers** (Apple HomePod mini, Google Nest Hub 2nd Gen, Nest Wi-Fi Pro) also work, but for a fully local, no-cloud setup you want the OTBR running inside Home Assistant itself.

### Software Requirements

- Home Assistant OS or Supervised (add-ons required)
- Home Assistant 2023.3 or later (OTBR auto-configuration)
- Matter integration enabled (Settings > Devices & Services > Add Integration > Matter)
- Home Assistant Companion app on Android 8.1+ or iOS 16+ with Bluetooth enabled — needed only during the commissioning step

## Sensor Specs at a Glance

Both sensors combine radar with a passive infrared (PIR) layer. PIR is cheap and filters non-heat sources (drafts, pets below a certain size), while the mmWave radar catches micro-movements — slow breathing, tiny shifts while someone is reading. Together they nearly eliminate false absences.

### Aqara Presence Multi-Sensor FP300

- **Radar:** 60 GHz mmWave
- **Additional sensors:** PIR, ambient light, temperature, humidity (five-in-one)
- **Coverage:** 120 degree field of view, up to 6 m (20 ft)
- **Protocol:** Matter over Thread (default firmware) or Zigbee (switchable via Aqara app)
- **Battery:** 2x CR2450, up to 2 years
- **Price:** ~$50 (Amazon, as of late 2025)
- **Mount:** Fully rotatable magnetic base — corner mounting maximizes coverage

Important note: the FP300 ships with Thread/Matter firmware. You can optionally cross-flash to Zigbee mode through the Aqara app if you want deeper configuration options (sensitivity zones, detection thresholds) that are currently more limited in the Matter firmware. For this guide we use Thread/Matter as shipped.

### Meross Smart Presence Sensor MS605

- **Radar:** 24 GHz mmWave
- **Additional sensors:** PIR, ambient light (four-in-one)
- **Coverage:** AI-assisted zone detection, up to 3 customizable zones
- **Protocol:** Matter over Thread exclusively
- **Battery:** 1x CR123A, up to 3 years
- **Waterproofing:** IP67 — suitable for covered outdoor areas or bathrooms
- **Operating temperature:** -20 degrees C to +60 degrees C
- **Mount:** 90 degree fold + 360 degree rotate

The MS605's three detection zones appear as separate sensors inside Home Assistant, enabling fine-grained automations — for example, triggering different lighting scenes depending on which zone in a large room is occupied.

## Step-by-Step: Pairing a Thread Sensor in Home Assistant

The commissioning flow is the same regardless of whether you use the FP300 or MS605. Matter's design goal is exactly this: one pairing process, any compliant controller.

1. **Confirm your border router is active.** Go to Settings > Devices & Services. You should see both an "OpenThread Border Router" card and a "Thread" card. If they are missing, revisit the hardware setup above.
2. **Put the sensor in pairing mode.** For the FP300: pull the battery tab (or hold the reset button for 5 seconds on a used unit) until the LED flashes slowly. For the MS605: press and hold the button on the bottom for 5 seconds until the indicator blinks.
3. **Open the Home Assistant Companion app** on your phone. Enable Bluetooth. Stay within a few metres of the sensor — Bluetooth is used only during the initial handshake; Thread takes over afterward.
4. **Navigate to Settings > Matter > Add Device.** Select "No, it's new."
5. **Scan the QR code.** The QR code is printed on the sensor itself and on the included manual. Alternatively, select "Setup without QR code" and enter the 11-digit numeric code manually.
6. **Select "Add to Home Assistant."** The commissioning process takes 30-90 seconds. Home Assistant negotiates Thread credentials through your border router, and the sensor joins the Thread mesh.
7. **Done.** Navigate to Settings > Devices & Services > Matter > Devices to confirm the sensor appears. Open the device page to see all exposed entities: occupancy, illuminance, temperature (FP300), humidity (FP300), and battery level.

From this point forward, all communication is local. The sensor talks to your Thread border router over the 802.15.4 radio; the border router bridges to your LAN; Home Assistant polls and receives pushes entirely on your network. No cloud relay, no Aqara account, no Meross account.

## Troubleshooting Common Issues

Thread and Matter are mature but still have rough edges. Here is what actually goes wrong and how to fix it.

### "Device requires a border router" during commissioning

This means Home Assistant's OTBR is not advertising Thread credentials to your phone. Check that the OpenThread Border Router add-on is running (Settings > Add-ons). If you are using an Apple or Google border router alongside HA's OTBR, they may have conflicting Thread networks. The fix is to ensure all border routers share the same Thread network credentials — HA can export its credentials, or you can import credentials from another ecosystem under Settings > System > Thread.

### Commissioning hangs at "Checking network connectivity"

Bring the sensor physically closer to the border router for initial pairing — Thread range can be reduced in dense walls. Also verify IPv6 multicast is not blocked on your router or managed switch. Thread uses IPv6 link-local and mesh-local addresses; if your router's multicast "optimization" (sometimes called multicast flooding control) is enabled, disable it or whitelist the Thread multicast groups.

### Sensor shows as unavailable after successful pairing

Battery-powered Thread sensors use Sleepy End Devices (SED) mode: the radio sleeps most of the time to extend battery life. Home Assistant should handle this gracefully, but if the entity shows unavailable, restart the Matter integration under Settings > Devices & Services > Matter > three-dot menu > Reload. If the problem persists, check that no other Thread nodes (especially Apple border routers) have a stale copy of the device's credentials.

### FP300 shows limited entities compared to Zigbee mode

This is expected. As of early 2026, the FP300's Matter firmware exposes occupancy, illuminance, temperature, humidity, and battery — a solid set, but fewer tuning knobs than the Zigbee firmware (which exposes zone sensitivity, approach/leave distance thresholds, and micro-motion sensitivity). Aqara has indicated firmware updates will expand Matter-exposed attributes over time. If granular control matters to you today, cross-flash to Zigbee via the Aqara app and use Zigbee2MQTT or ZHA instead.

### False absences — room marked empty while someone is present

Mount height and angle matter. Both sensors work best at 1.5-2.5 m height angled slightly downward. Avoid mounting directly overhead. For the FP300, the rotatable base lets you sweep 360 degrees to find the dead-zone-free angle. For the MS605, use the zone configuration in the Meross app to tune detection boundaries before you remove the app from your workflow — zone settings persist on the device itself.

## Frequently Asked Questions

### Do I need a cloud account to use the Aqara FP300 with Home Assistant?

No. Once paired via Matter, the FP300 communicates entirely over your local Thread mesh network. No Aqara account, no cloud relay, and no internet connection is required for automations to run.

### What is a Thread border router and do I need one?

A Thread border router bridges your Thread mesh network to your regular Wi-Fi/Ethernet LAN. Battery-powered Matter-over-Thread sensors require one to communicate with Home Assistant. The Home Assistant Connect ZBT-2 dongle or a Home Assistant Yellow both work as border routers out of the box.

### Can the Aqara FP300 use both Thread and Zigbee?

Not simultaneously. The FP300 ships with Matter-over-Thread firmware. You can cross-flash it to Zigbee mode using the Aqara app, but you must choose one protocol — Thread/Matter or Zigbee — and stick with it.

### How long do the batteries last in these mmWave sensors?

The Aqara FP300 lasts up to two years on two CR2450 coin cells. The Meross MS605 lasts up to three years on a single CR123A battery. Thread's Sleepy End Device (SED) mode keeps the radio off most of the time, which is what makes these battery lives possible for a 60 GHz radar chip.

### Why does my Thread sensor show as unavailable in Home Assistant?

Battery-powered Thread sensors use Sleepy End Device mode, so they are not always reachable. If the entity shows unavailable after successful pairing, try reloading the Matter integration under Settings > Devices & Services > Matter > Reload. Also check for conflicting Thread networks if you have multiple border routers on the same network.
