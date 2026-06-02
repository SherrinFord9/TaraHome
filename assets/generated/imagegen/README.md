# TaraHome Imagegen Assets

Generated with Codex built-in `image_gen`, then copied into this project.

## 4K Backgrounds

- `backgrounds/tara-ai-morning-home-4k.webp`
- `backgrounds/tara-ai-arrival-path-4k.webp`
- `backgrounds/tara-ai-security-night-4k.webp`
- `backgrounds/tara-ai-energy-daylight-4k.webp`

Each also has a `-4k.png` export at `3840x2160` and a `-source.png` copy of the original generated image.

## Animated Sprites

Raw magenta sheets were generated with built-in `image_gen`, then processed with the cloned `agent-sprite-forge` `generate2dsprite.py process` workflow.

Homepage active sprites:

- `sprites/tara-imagegen-control-bloom/animation.gif`
- `sprites/tara-imagegen-sunrise-bloom/animation.gif`
- `sprites/tara-imagegen-security-field/animation.gif`
- `sprites/tara-imagegen-energy-aura/animation.gif`

Each sprite folder includes:

- `animation.gif`
- `sheet-transparent.png`
- six extracted frame PNGs
- `pipeline-meta.json`
- `prompt-used.txt`
- processed raw sheet outputs

The running React layer is `app/components/AnimatedBackgroundSprites.tsx`.
