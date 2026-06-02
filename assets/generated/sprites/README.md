# Tara Animated Background Sprites

Generated for the Tara website redesign using the `agent-sprite-forge` workflow pattern:

1. Tara-specific raw 2x3 sprite sheets were created on a flat `#FF00FF` chroma-key background.
2. The cloned `0x0funky/agent-sprite-forge` `generate2dsprite.py process` script produced transparent PNG frames, transparent sheets, animated GIFs, and pipeline metadata.
3. The React site consumes the GIF loops through `AnimatedBackgroundSprites.tsx`, where Motion scroll transforms move the assets as the page scrolls.

Assets:

- `tara-core-orbit`
- `tara-presence-pulse`
- `tara-device-network`
- `tara-shades-sunrise`
- `tara-security-scan`
- `tara-energy-ribbons`

