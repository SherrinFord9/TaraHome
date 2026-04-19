---
title: "How to Pair IKEA Matter-over-Thread Devices in Home Assistant Without Cloud, Dirigera, or Apple"
description: "Pair any of IKEA's 21 new Matter-over-Thread devices directly in Home Assistant—no Dirigera hub, no Apple, no Google, fully local. Step-by-step guide."
date: "2026-03-20"
category: How-To
readTime: "8 min read"
---

## IKEA Matter Thread Home Assistant: The Problem Everyone Is Running Into

Pairing IKEA Matter-over-Thread devices directly in Home Assistant without cloud, Dirigera, or Apple hardware is entirely possible — but it is not the path IKEA's documentation points you toward. When IKEA launched 21 new Matter-compatible smart home devices at CES 2026, the HA community forums immediately filled with threads titled "Unable to pair IKEA Matter devices" and "Something went wrong." Nearly every failure traced back to one of three root causes: users routing everything through the Dirigera hub (which introduced multi-admin instability), users lacking a Thread border router in HA, or a single misconfigured IPv6 setting silently blocking all Thread traffic.

This guide walks the clean path: stand up an OpenThread border router inside Home Assistant, configure IPv6 correctly, share Thread credentials to your Android or iOS phone via the Companion app, then commission your IKEA devices directly — no Dirigera, no Apple TV, no Google Nest, no cloud account of any kind. Everything runs locally on your LAN, and it stays working when your internet goes down.

## IKEA's 2026 Matter Lineup: What You Are Pairing

IKEA's January 2026 release brought 21 products under the Matter standard, split between Matter-over-Thread (low-power, battery-operated devices) and Matter-over-Wi-Fi (plugs, bulbs). Understanding which is which saves time during setup, because the two require different pairing paths.

### Matter-over-Thread Devices (require a Thread border router)

- **MYGGBETT** — door and window contact sensor; two-part white design, battery-powered, triggers automations on open/close events
- **MYGGSPRAY** — PIR + ambient-light motion sensor; battery-powered, Thread-connected
- **BILRESA remote kits** — sets of three button controllers (dual-button and scroll-wheel variants) in green, red, and beige; battery-powered
- **ALPSTUGA** — mains-powered air quality sensor with a large display showing CO2, PM2.5, temperature, humidity, and clock; Thread-connected despite being AC-powered
- **KLIPPBOK** — water leak sensor designed for placement under sinks, dishwashers, and washing machines; battery-powered, Thread-connected

### Matter-over-Wi-Fi Devices (simpler pairing, no Thread border router needed)

Plugs, dimmable bulbs, and ceiling fixtures in the same 2026 range use Matter over Wi-Fi. These commission directly through the HA Companion app on the same network — the process is the same as any other Matter-over-Wi-Fi device and does not require the Thread setup steps described below. The Thread logo on the packaging is your tell: if it is there, follow this guide.

## Step 1: Set Up the OpenThread Border Router in Home Assistant

A Thread border router is the bridge between your Wi-Fi/Ethernet LAN and the Thread mesh network that battery-powered IKEA devices live on. Without one, Home Assistant has no way to reach Thread devices at all. The commissioning process will fail with "device requires a border router" before you even scan a QR code.

### Hardware Options for Your Thread Border Router

You need a radio that speaks IEEE 802.15.4 — the physical layer Thread runs on. Your options, roughly in order of ease:

1. **Home Assistant Connect ZBT-1 (formerly SkyConnect)** — USB dongle with a Silicon Labs EFR32MG21 chip that handles both Zigbee and Thread. If you are running HA OS 11 or later, the OpenThread Border Router add-on auto-detects it. This is the lowest-friction path if you are starting from scratch.
2. **GL-iNet GL-S20** — a small network-attached border router that integrates cleanly with HA via the OpenThread Border Router add-on. Good if you want the radio separate from the HA host.
3. **SMLIGHT SLZB-06M** — a PoE-powered Zigbee/Thread coordinator that can act as an OTBR. Useful if you want the radio mounted near your devices rather than plugged into your HA machine.
4. **Raspberry Pi with a 15.4 radio HAT** — DIY path using Espressif or Nordic Semiconductor radio boards as an RCP (Radio Co-Processor) with the OTBR add-on.

### Installing the OpenThread Border Router Add-on

Once your hardware is connected, go to **Settings > Add-ons > Add-on Store** and search for **OpenThread Border Router**. Install it, open the **Configuration** tab, and select your radio device from the device dropdown (it will appear as something like `/dev/ttyUSB0` or a network address for GL-S20). Start the add-on.

Home Assistant will automatically detect the running OTBR add-on and create a new **Open Thread Border Router** integration under **Settings > Devices & Services**. You should see a Thread network appear in the Thread integration panel with a generated network name and credentials. If you do not see this within a minute of the add-on starting, restart Home Assistant OS entirely.

### Installing the Matter Server Add-on

If it is not already installed, go to **Settings > Add-ons > Add-on Store** and install **Matter Server**. In its configuration, check **Use the latest beta version** — the stable release of Matter Server lags behind matter.js fixes that address several IKEA-specific reconnection bugs first patched in version 8.2.2. Start the add-on, then add the **Matter** integration at **Settings > Devices & Services > Add Integration > Matter** if it has not appeared automatically.

## Step 2: Fix IPv6 — The Hidden Blocker

This step is responsible for the majority of IKEA Matter Thread pairing failures. Thread uses IPv6 exclusively; there is no IPv4 fallback. When a Thread border router joins your LAN, it broadcasts Router Advertisements (RAs) announcing the Thread network prefix (something like `fd01:xxxx::/64`). Home Assistant needs to accept these RAs to know how to route packets to Thread devices.

If your Home Assistant has a **static IPv6 address configured**, it ignores RAs entirely. Thread packets destined for a sensor then get forwarded toward your router's default gateway, where they are dropped. The symptom from HA's perspective is a clean-looking commissioning flow that ends with a generic "Something went wrong" error at the final connectivity check step.

### How to Check and Fix IPv6

1. Go to **Settings > System > Network**
2. Under your active network interface, locate the **IPv6** section
3. If the method is set to **Static**, change it to **Automatic** (SLAAC)
4. Click **Save** and reboot Home Assistant

After rebooting, HA will accept RAs from the OTBR add-on and populate a Thread route in its routing table. You do not need a globally routable IPv6 address — a link-local or ULA address assigned via SLAAC is sufficient for Thread to work. If your router's DHCPv6 assigns a specific prefix you need to retain, check the HA community documentation on configuring a DHCPv6 reservation alongside automatic RA acceptance.

### Verifying Thread Connectivity

With the OTBR add-on running and IPv6 on Automatic, go to **Settings > Devices & Services > Thread**. You should see your Thread network listed with a status of **Preferred** or **Active**. If it shows as **Pending** for more than two minutes after a reboot, check that multicast traffic is not blocked between the HA host and your router — Thread border routers use multicast for RA propagation, and some managed switches block it by default.

## Step 3: Commission Your IKEA Device — No Apple, No Google Required

With a working Thread border router and correct IPv6, you are ready to pair. The commissioning process uses Bluetooth for the initial handshake, then hands off to Thread for ongoing communication. Your phone acts as the commissioning agent — it carries the Thread network credentials from HA to the device during pairing. You do not need an iPhone, an Apple TV, a HomePod, or any Google hardware.

### Share Thread Credentials to Your Phone

Install the **Home Assistant Companion app** on your Android (8.1+) or iOS (16+) phone and log in to your HA instance. Then:

1. Open the HA Companion app on your phone
2. Go to **Settings > Companion App > Troubleshooting > Thread credentials** (Android) or check under the app's Thread section (iOS)
3. Tap **Sync Thread credentials from Home Assistant**
4. Confirm that the Thread network from your OTBR add-on appears in the list

Your phone's system Thread store now knows your network's credentials. When you commission a Thread device, the phone silently injects these credentials during the Bluetooth handshake, so the device can join your Thread network without any additional steps.

### Put the Device into Pairing Mode

IKEA Matter devices enter pairing mode for **15 minutes** from first power-on. After that window closes, the device stops advertising and must be factory-reset to pair again. The reset procedure varies by device:

- **MYGGBETT, KLIPPBOK** — remove and reinsert the battery; press the reset button inside the battery compartment for 10 seconds if the 15-minute window has already expired
- **BILRESA remotes** — press and hold the pairing button until the LED flashes three times
- **ALPSTUGA** — use the reset pin hole on the back; hold for 10 seconds until the display blinks

Once the device is in pairing mode, locate its Matter pairing code. It is printed on a sticker on the device and also encoded as a QR code. The pairing code starts with the characters `MT:` when displayed in text form.

### Commission via the Home Assistant App

1. Open the HA Companion app on your phone
2. Go to **Settings > Devices & Services** (from within the app)
3. Tap the **+ Add Device** button and select **Add Matter device**
4. Scan the QR code on the IKEA device, or enter the `MT:` pairing code manually
5. Keep your phone within **1-2 metres** of both the device and your Thread border router during the Bluetooth handshake phase — this phase typically takes 30-90 seconds
6. Once the device joins the Thread network, HA will auto-discover it and create entities

You can also commission directly from the Matter Server web UI if you prefer a desktop flow: open the Matter Server add-on panel, click **Commission new Thread device**, paste the Thread dataset (obtainable from the OTBR add-on's diagnostic panel), and enter the pairing code.

## Troubleshooting: Fixing Common IKEA Matter Pairing Failures

Even with the border router running and IPv6 on Automatic, a handful of issues come up repeatedly. Here is what to check when commissioning still fails or devices drop off after pairing.

### "Something went wrong" at the final step

After trying the IPv6 fix above, the next most common cause is Matter Server running an older stable release. Update to the beta channel (version 8.2.2 or later) as described in Step 1 — this release includes fixes for several IKEA-specific bugs where the controller fails to validate device attestation certificates. Also ensure your HA host's time is accurate (NTP synced); Matter commissioning cryptography requires system clocks within a few minutes of each other.

### Device pairs but disappears after a few minutes

This is the multi-admin instability problem. If you have also paired the same device to a Dirigera hub, Apple Home, or Google Home, you are running multiple controllers for a single device. The IKEA devices have limited fabric slots, and competing controllers can cause subscription timeouts that make entities go unavailable. The stable solution is single-controller architecture: pair the device *only* to Home Assistant. If you want IKEA's app for initial setup or firmware updates, use the Dirigera as a temporary commissioning tool, then move the device to HA as its sole controller.

### Commissioning fails with "Thread border router required"

This message means HA can see the device over Bluetooth but cannot route Thread traffic to it. Double-check the OTBR add-on is running (its log should show "Thread network formed" or "Attached"), verify the Thread integration in HA shows an active network, and confirm Thread credentials were synced to your phone before starting commissioning. If you have VLANs, ensure the HA host and the OTBR radio are on the same VLAN, or configure your router to bridge mDNS between VLANs.

### BILRESA remotes commission but show no actions in HA

Button events from Matter devices are delivered as **Matter events**, not as entity state changes. In Home Assistant, go to **Developer Tools > Events** and listen for `matter_event` — press a button on the remote and confirm the event fires. Create automations using the trigger type **Device > Matter > [your remote] > Button pressed** rather than looking for a sensor entity. This is a common source of confusion because earlier protocols (Zigbee, Z-Wave) exposed buttons as binary sensors; Matter exposes them as events.

### ALPSTUGA air quality readings appear in HA but update slowly

The ALPSTUGA reports sensor data on a timed interval defined by the device firmware. By default this is approximately 5 minutes. This is not a pairing or connectivity issue — it is the device's design. You cannot configure a faster poll rate for Thread-based Matter sensors; the device controls its own reporting schedule. If you need faster updates, consider Zigbee alternatives where HA can set shorter reporting intervals.

## Why Local-Only Is the Right Architecture for IKEA Matter Devices

The appeal of IKEA's 2026 range is price: MYGGBETT contact sensors retail for under $10, BILRESA remote kits are priced competitively against Zigbee alternatives, and ALPSTUGA undercuts comparable air quality monitors significantly. But that value proposition evaporates if you route everything through IKEA's cloud or chain together multiple controllers in a multi-admin mess.

The architecture described in this guide — OTBR in HA, single controller, no Dirigera — gives you:

- **Zero cloud dependency**: all communication is local IPv6 over Thread, never touching IKEA's servers or any third-party cloud
- **Internet-independent operation**: automations fire even when your ISP is having a bad day
- **Sub-100ms response times**: Thread mesh routing and local Matter processing are fast; there is no cloud round-trip to add latency
- **Full HA automation power**: IKEA devices become first-class HA entities, usable in any automation, script, or dashboard alongside every other protocol HA supports
- **No subscription or app required**: you never need to open the IKEA Home app after commissioning

This aligns precisely with TARA's philosophy: local processing, no cameras, no cloud, no single point of failure owned by a company that might change its terms of service. Thread is an excellent protocol for battery-powered sensors specifically because the mesh extends range and redundancy without requiring mains power at every node — every powered Thread device (like the ALPSTUGA) becomes a router that strengthens the mesh for all the battery-powered sensors around it.

If you are building a presence-aware home — using mmWave radar for occupancy, Thread sensors for door and window state, and local automations to respond — the IKEA 2026 range at these price points is genuinely compelling hardware. The setup complexity described here is a one-time cost; once the OTBR is running and IPv6 is set to Automatic, every subsequent IKEA device pairs in under two minutes.

## Frequently Asked Questions

### Do I need the IKEA Dirigera hub to use IKEA Matter-over-Thread devices in Home Assistant?

No. The Dirigera hub is completely optional. You can pair IKEA Matter-over-Thread devices directly to Home Assistant using the built-in OpenThread Border Router add-on and the Matter Server add-on. The key requirements are a Thread border router (such as the HA Connect ZBT-1 or a Raspberry Pi with a compatible radio), the Home Assistant Companion app on Android or iOS to share Thread credentials, and the device's Matter pairing code.

### Why does IKEA Matter Thread pairing fail in Home Assistant with "Something went wrong"?

The most common cause is a static IPv6 configuration on Home Assistant. When HA uses a static IPv6 address, it ignores Router Advertisements (RAs) sent by the Thread border router, so it cannot route traffic to Thread devices. Go to Settings > System > Network, change the IPv6 setting from Static to Automatic, and restart Home Assistant. This single change resolves the majority of pairing failures reported in the community forums.

### Do I need an iPhone or Apple TV to commission Matter-over-Thread devices?

No. Apple hardware is not required. The Home Assistant Companion app for Android (8.1+) or iOS (16+) can share Thread network credentials from your Home Assistant border router to your phone during commissioning. Once Thread credentials are on your phone, you can commission any Matter-over-Thread device via Bluetooth using the HA Companion app — no Apple TV, no HomePod, no iPhone required.

### Which IKEA devices from the 2026 lineup support Matter over Thread?

IKEA launched 21 Matter-compatible devices at CES 2026. The Thread-based (battery-powered or low-power) devices include the MYGGBETT contact sensor, BILRESA button remotes, MYGGSPRAY motion sensor, KLIPPBOK water leak sensor, and the ALPSTUGA air quality sensor. Wi-Fi-connected devices in the same range (plugs, bulbs) use Matter over Wi-Fi rather than Thread. Check the product packaging for the Thread logo to confirm before purchasing.

### What hardware do I need to run an OpenThread border router in Home Assistant?

The easiest option is the Home Assistant Connect ZBT-1 (formerly SkyConnect), a USB dongle that supports both Zigbee and Thread via a Silicon Labs EFR32MG21 chip — it ships with Home Assistant OS 11+ and auto-configures the OpenThread Border Router add-on. Alternatively, the GL-iNet GL-S20, SMLIGHT SLZB-06M (via PoE), or a Raspberry Pi with an IEEE 802.15.4 radio hat all work. The Dirigera hub (firmware 2.805.6+) also acts as a Thread border router if you want IKEA's ecosystem alongside HA, but it is not required.
