---
title: "How to Set Up a Fully Local Voice Assistant in Home Assistant (No Cloud, No Alexa)"
description: "Set up a fully local, cloud-free voice assistant in Home Assistant using Voice PE, Wyoming protocol, Piper TTS, and openWakeWord—step-by-step."
date: "2026-03-12"
category: How-To
readTime: "9 min read"
---

## Why Run a Home Assistant Local Voice Assistant With No Cloud?

A fully local voice assistant in Home Assistant — one that uses no cloud, no Alexa, and no Google — is no longer a weekend project reserved for serious Linux tinkerers. With the Home Assistant Voice Preview Edition (Voice PE) now shipping and the Wyoming protocol stack maturing rapidly, you can have every spoken command processed entirely on your LAN in an afternoon. The appeal is straightforward: your audio never leaves your home, there is no subscription to cancel, the assistant keeps working when your internet is down, and response latency drops to under a second on capable hardware.

This guide walks through the complete stack — from choosing your microphone hardware to installing openWakeWord, Whisper or Speech-to-Phrase, and Piper TTS — and shows you how to wire everything together through the Wyoming protocol into Home Assistant's Assist pipeline. No cloud required at any step.

## Understanding the Wyoming Protocol Stack

The Wyoming protocol is the glue that holds the local voice pipeline together. It is a lightweight, peer-to-peer protocol developed by the Rhasspy project (now part of the Open Home Foundation) that standardizes how speech-to-text, text-to-speech, and wake-word engines communicate with Home Assistant's Assist pipeline. Each service exposes a small TCP socket, and Home Assistant discovers them automatically via Zeroconf — the same technology that makes AirPlay and Chromecast device discovery seamless.

### The Four Layers of the Pipeline

Every spoken command travels through four layers before your light turns on:

1. **Wake word detection (openWakeWord)** — listens continuously for a trigger phrase such as "Hey Jarvis" or "OK Nabu." CPU usage is minimal because it only runs a small audio embedding model.
2. **Speech-to-text (Whisper or Speech-to-Phrase)** — once the wake word fires, the audio stream is captured and transcribed into text. This is the most resource-intensive step.
3. **Intent recognition (Home Assistant Assist)** — the transcribed text is parsed against your entities and configured intents. This runs natively inside Home Assistant with zero external calls.
4. **Text-to-speech (Piper)** — the assistant's response is synthesized into natural-sounding speech and played back through the satellite speaker.

Each layer communicates with the next via the Wyoming protocol, which means you can run all four services on the same machine or distribute them across your network — for example, running Whisper on a more powerful NUC while the satellite microphone is a tiny ESP32 device in the kitchen.

### Whisper vs. Speech-to-Phrase

There are currently two supported speech-to-text engines for local use. **Whisper** is OpenAI's open-source general-purpose model — it transcribes arbitrary sentences but needs real compute. On a Raspberry Pi 4 it takes roughly 8 seconds per command; on an Intel NUC with an N100 chip it finishes in under a second. **Speech-to-Phrase**, introduced by the Home Assistant team, takes a fundamentally different approach: instead of open-ended transcription, it only recognizes commands that match the entities and capabilities your Assist pipeline actually supports. The result is dramatically faster and lighter — useful on a Pi 4 — but it will not transcribe a shopping list or answer general questions. For smart home control, Speech-to-Phrase is almost always the right choice.

## Choosing Your Microphone Hardware

The microphone is the most important physical component of the system. Distant speech recognition is hard — background noise, echo, and poor microphone placement are responsible for the vast majority of failed commands. You have three main hardware paths:

### Option 1: Home Assistant Voice Preview Edition (Recommended)

The Voice PE is Home Assistant's first official voice hardware, shipping at $69 USD. It is powered by an ESP32-S3 with 16 MB flash and an XMOS XU316 dedicated audio processor that handles echo cancellation, noise suppression, and beam-forming in hardware before the audio ever reaches the microphone array. Key specs:

- **Dual-microphone array** with hardware-level XMOS DSP processing
- **Physical mute switch** that cuts power to the microphones — not just a software flag
- **Multicolor LED ring** for visual feedback during listening and processing states
- **3.5 mm stereo output** with a dedicated AIC3204 DAC for speaker playback
- **Wi-Fi 2.4 GHz + Bluetooth 5.0**, USB-C powered
- **Open hardware** — KiCad schematics and PCB files are on GitHub

Setup is a USB-C cable and a guided wizard. ESPHome handles the firmware, and the device is discovered by Home Assistant automatically. The XMOS processor dramatically improves far-field recognition compared to raw MEMS microphones on a bare ESP32.

### Option 2: Raspberry Pi with ReSpeaker HAT (DIY Satellite)

If you want a room-specific satellite that runs on your LAN but is physically separate from your HA server, a Raspberry Pi Zero 2 W or Pi 4 paired with a Seeed ReSpeaker 2-mic HAT is a well-documented combination. You install the **wyoming-satellite** software (or the newer Linux Voice Assistant add-on for HA OS), point it at your HA instance, and it registers as a satellite device. The ReSpeaker provides dedicated microphone hardware and a small speaker driver; a Pi Zero 2 W can handle wake word detection locally while offloading STT to the main HA server. For better far-field pickup, the Seeed ReSpeaker Lite (ESP32 + XMOS XU316) brings professional DSP to a development board form factor at a fraction of the cost of Voice PE.

### Option 3: M5Stack ATOM Echo (Budget)

At around $13, the ATOM Echo is an ESP32-based smart speaker with a built-in MEMS microphone. It lacks dedicated DSP, so far-field recognition is mediocre — but for a desk or nightstand where you are consistently within a metre or so of the device, it works reliably. The HA community maintains an ESPHome firmware for it that integrates with the Wyoming pipeline out of the box. It is a good way to prove out the stack before investing in better hardware.

## Step-by-Step Setup: Wyoming Protocol, Piper, and openWakeWord

The following steps assume you are running Home Assistant OS or Home Assistant Supervised (the add-on store is required). If you are on a container or Core install, run the services as Docker containers and point Home Assistant at their IP and port numbers manually.

### Step 1: Install the Speech-to-Text Add-on

Go to **Settings > Add-ons > Add-on Store** and search for either **Whisper** or **Speech-to-Phrase**. Install your chosen add-on, then open its configuration tab. For Whisper, select the model size — "tiny" or "base" on a Pi 4, "small" or "medium" on an x86 host. Start the add-on and wait for it to finish downloading the model weights. The add-on listens on port **10300** by default.

### Step 2: Install the Piper Text-to-Speech Add-on

In the same add-on store, install **Piper**. Choose a voice in the configuration — Piper ships with over 35 languages and multiple voices per language. A good starting point for English is the *en_US-lessac-medium* voice, which sounds natural without requiring excessive CPU. Start the add-on; it listens on port **10200**.

### Step 3: Install the openWakeWord Add-on

Install the **openWakeWord** add-on from the add-on store. The default configuration includes several built-in wake word models. Open the add-on options and select your preferred wake word — "Hey Jarvis" has high real-world accuracy and low false-positive rates. Start the add-on; it listens on port **10400**.

### Step 4: Configure the Wyoming Integration

Navigate to **Settings > Devices & Services**. If your add-ons are running on the same machine as Home Assistant, they will appear under **Discovered** automatically via Zeroconf. Click **Add** for each Wyoming service — Piper, Whisper (or Speech-to-Phrase), and openWakeWord. If you are connecting to services running on a separate machine, click **Add Integration**, search for **Wyoming Protocol**, and enter the host IP and port manually for each service.

### Step 5: Create Your Voice Assistant Pipeline

Go to **Settings > Voice Assistants** and click **Add Assistant**. Give it a name, then configure each stage:

- **Conversation agent:** Home Assistant (local intent recognition)
- **Speech-to-text:** select Whisper or Speech-to-Phrase from the dropdown
- **Text-to-speech:** select Piper and choose your voice
- **Wake word:** select openWakeWord and choose your wake word model

Save the pipeline. Every component in this pipeline runs on your LAN. No audio leaves your home network.

### Step 6: Pair Your Satellite Device

For the Voice PE, power it on near your Home Assistant instance. It broadcasts via Zeroconf and should appear in **Settings > Devices & Services** within a minute. Add it and assign it to your newly created pipeline. For ESPHome-based satellites (ATOM Echo, custom builds), flash the firmware via the ESPHome add-on, then assign the pipeline in the device settings. For wyoming-satellite on a Raspberry Pi, run the service and it will register automatically via Zeroconf.

## Common Setup Problems and How to Fix Them

Even with a well-supported stack, a few problems come up repeatedly in the Home Assistant community. Here is what to check when things do not work as expected.

### Wake Word Not Triggering

The most common cause is microphone gain set too low or a microphone placed too far from the speaker. Check the openWakeWord add-on log for confidence scores — if the score never exceeds 0.5 for a clear utterance, the microphone signal is too quiet. Increase the capture gain in the ESPHome firmware or Wyoming satellite configuration. Also make sure your mute switch is not engaged — the Voice PE mute switch is hardware-level and completely cuts the microphone signal regardless of software state.

### Whisper Transcription Taking Too Long

On a Raspberry Pi 4, Whisper base takes 8-12 seconds per command. Switch to Speech-to-Phrase if you are on ARM hardware — it processes in under a second on a Pi 4. If you need open-ended Whisper on a Pi 4, downgrade to the "tiny" model, which trades accuracy for speed. On x86 hardware, make sure the add-on has access to sufficient RAM — budget at least 4 GB for the base model.

### Wyoming Integration Not Discovering Services

Zeroconf discovery requires the Home Assistant host and the satellite/add-on to be on the same subnet with multicast traffic allowed. If you have VLANs, either place all voice devices on the same VLAN or configure your router to forward mDNS packets between VLANs. Alternatively, skip discovery entirely by adding the Wyoming integration manually with the explicit IP and port of each service.

### Piper TTS Voice Sounds Robotic

Piper has multiple quality tiers per language — "low", "medium", and "high". The high-quality voices use larger neural network models and produce noticeably more natural output. If you are hearing robotic artifacts, switch to the medium or high model in the Piper add-on configuration. On a Pi 4, medium models still synthesize fast enough to feel responsive.

## Privacy Architecture: What Stays Local

The combination of Voice PE hardware and the Wyoming protocol stack delivers a genuinely private voice assistant. Here is the full data flow with zero cloud involvement:

- **Audio capture:** The XMOS chip on Voice PE processes raw microphone audio in hardware — noise cancellation and echo removal happen on the device before any data leaves the speaker unit.
- **Wake word detection:** openWakeWord runs on the HA server (or on the satellite itself for edge models). The raw audio stream is never stored; only the confidence score is checked against a threshold.
- **Speech-to-text:** Whisper or Speech-to-Phrase receives only the audio clip after the wake word fires — a few seconds at most. The model runs locally, the transcription result is text, and neither the audio nor the text is forwarded externally.
- **Intent and action:** Home Assistant's Assist pipeline matches the text to your entities and fires the appropriate automation or action. This is pure local Python code — no API calls, no cloud lookup.
- **Response speech:** Piper synthesizes the response on your server and streams it back to the satellite speaker. No TTS cloud service is involved.

Compare this to Alexa or Google Home, where every utterance — including the seconds before and after the command — is streamed to cloud servers, retained according to each company's privacy policy, and potentially used to improve voice models. With TARA's approach to local intelligence, your voice data is yours. It never leaves the LAN, it is not retained, and it does not depend on any company's servers staying operational.

The Voice PE's physical mute switch takes this one step further. Unlike a software mute that can be overridden by a firmware update or a bug, cutting power to the microphone hardware is absolute. When the switch is engaged, the device cannot listen — full stop.

## Frequently Asked Questions

### Do I need a Nabu Casa subscription for a local voice assistant in Home Assistant?

No. A Nabu Casa subscription is completely optional. The entire stack — openWakeWord for wake word detection, Whisper or Speech-to-Phrase for speech-to-text, and Piper for text-to-speech — runs locally on your Home Assistant hardware. Every spoken command stays on your LAN, and no audio is ever sent to Nabu Casa servers unless you choose to enable that option.

### Can I run the Wyoming add-ons on a Raspberry Pi 4?

Yes, but performance depends on which speech-to-text engine you choose. Speech-to-Phrase is extremely fast on a Raspberry Pi 4 because it only recognizes a limited set of smart-home commands rather than open-ended dictation. Whisper can also run on a Pi 4, but transcription takes roughly 8 seconds per command. If speed matters, use Speech-to-Phrase on a Pi 4, or run Whisper on an x86 host such as an Intel NUC or HA Yellow.

### What is the difference between Whisper and Speech-to-Phrase?

Whisper is OpenAI's open-source general-purpose speech recognition model — it can transcribe arbitrary sentences but requires significant CPU or GPU resources. Speech-to-Phrase is a Home Assistant-designed alternative that only transcribes commands it already knows your assistant supports, making it dramatically faster and lighter on hardware. For smart home control (turn on lights, set temperature, lock doors), Speech-to-Phrase is usually the better choice.

### What hardware do I need for the microphone satellite?

The Home Assistant Voice Preview Edition (Voice PE) is the easiest option — it is an ESP32-S3 device with an XMOS audio processor, dual-microphone array, physical mute switch, and LED ring, all for $69. If you prefer DIY, a Raspberry Pi Zero 2 W or Pi 4 paired with a ReSpeaker 2-mic HAT or Seeed ReSpeaker Lite board works well using the Wyoming satellite software. An M5Stack ATOM Echo is the lowest-cost option at around $13.

### Which wake words are available for local use in Home Assistant?

Home Assistant ships with several built-in wake words powered by openWakeWord, including "Hey Jarvis", "OK Nabu", and "Hey Mycroft". You can also train a custom wake word using the openWakeWord model trainer, which uses Piper TTS to generate synthetic training audio — no real voice recordings required. Custom wake word models are loaded directly onto your Home Assistant instance with no cloud upload.
