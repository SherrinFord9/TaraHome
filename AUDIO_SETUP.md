# 🎵 Audio Setup Guide for TARA AI

## Adding the Boot-Up Sound

To enable the AI "awakening" sound effect when the page loads, follow these steps:

### 1. Create Audio Directory
```bash
mkdir -p assets/audio
```

### 2. Add Your Audio File

Place your audio file in `assets/audio/`. Recommended name: `tara-boot.mp3`

**Audio Specifications:**
- **Duration**: 2-3 seconds
- **Format**: MP3 or OGG (provide both for browser compatibility)
- **Volume**: Keep it subtle and ambient
- **Style**: Think J.A.R.V.I.S. / sci-fi system boot-up sound

### 3. Recommended Sound Effects

You can find free AI/tech sounds at:
- [Freesound.org](https://freesound.org) - Search: "AI boot", "system startup", "tech hum"
- [Zapsplat.com](https://zapsplat.com) - Free sound effects
- [Pixabay](https://pixabay.com/sound-effects/) - Royalty-free sounds

**Search terms to try:**
- "AI awakening"
- "computer boot up"
- "sci-fi activation"
- "tech startup sound"
- "futuristic hum"

### 4. Update HTML

Once you have your audio file, uncomment the source tags in `index.html`:

```html
<audio id="boot-sound" preload="auto">
    <source src="./assets/audio/tara-boot.mp3" type="audio/mpeg">
    <source src="./assets/audio/tara-boot.ogg" type="audio/ogg">
</audio>
```

### 5. Test

- Open the page in your browser
- The sound should play automatically after the cinematic intro
- Volume is set to 30% by default (adjustable in `index.js`)

### Browser Autoplay Note

Some browsers block autoplay with sound. The code includes a fallback that will play on first user interaction if autoplay is blocked.

---

## Optional: Custom Sounds

If you want to create custom sounds, try:
- **Audacity** (free audio editor)
- **Logic Pro / GarageBand** (Mac)
- **FL Studio** (Windows)

Mix ambient tones, synth pads, and subtle glitches for that "AI coming online" feel!

