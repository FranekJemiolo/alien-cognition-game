# Glyphs of Forgetting

A deterministic puzzle game about decoding an alien language. Your memory is encoded in the URL.

## Concept

You are decoding an unknown symbolic language. Each puzzle is an inscription. The only thing that persists between sessions is what you've learned about the language—encoded in the URL.

## Features

- **URL-Encoded State**: Entire game state (seed, beliefs, streaks, score) encoded in the URL hash
- **Deterministic Engine**: Seeded RNG ensures reproducible puzzles from the same seed
- **Belief System**: Player hypotheses about hidden rules that influence puzzle generation
- **Hallucination System**: UI distortion based on cognitive stability
- **Audio Cognition Layer**: Procedural audio that reflects belief state and distortion
- **Replay System**: Deterministic frame-by-frame replay of cognition runs
- **Mobile-First UX**: Responsive design with touch-friendly controls
- **No Backend**: Pure client-side, deployable to GitHub Pages

## Architecture

### Core Systems
- **Engine**: Deterministic RNG, state management, URL encoding/decoding
- **Rules**: Registry of transformation rules (REPEAT_N, IGNORE_SYMBOL, DIRECTION_FLIP, etc.)
- **Cognition**: Belief tracking, hallucination generation, streak management
- **Audio**: Multi-bus WebAudio engine (signal, belief, hallucination buses)
- **Replay**: Frame recording and deterministic playback

### Game Loop
1. Generate puzzle from seed + level + puzzle index
2. Player selects answer from choices
3. Validate and update beliefs based on result
4. Generate hallucinations based on stability
5. Update streak and calculate cognitive coherence score
6. Record frame for replay
7. Advance to next puzzle or level

### URL Format
```
#<seed>.<beliefs>.<level>.<score>.<streaks>
```

Example:
```
#k9x2.13.4.1824.a.5.3.7
```

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. Push to `main` branch
2. GitHub Actions will build and deploy to GitHub Pages
3. Site will be available at `https://franekjemiolo.github.io/alien-cognition-game/`

## Game Mechanics

### Phases
- **Phase 1** (Levels 0-2): REPEAT_N, ALTERNATION
- **Phase 2** (Levels 3-6): SHIFT, REVERSE, DUPLICATE
- **Phase 3** (Levels 7-11): IGNORE_SYMBOL, DIRECTION_FLIP
- **Phase 4** (Levels 12+): Compound rules, conditional rules

### Scoring
Cognitive Coherence Index = (Solution + Stability + Efficiency + Hallucination Survival) × Streak Multiplier

### Belief System
- Correct answers reinforce rule beliefs
- Wrong answers introduce doubt
- Beliefs influence puzzle generation bias
- High confidence = clearer UI and audio

### Hallucinations
- Generated based on stability (low stability = more hallucinations)
- Types: blur, shift, fade, invert, glitch
- Clamped on mobile to prevent unreadable states
- Affects both UI and audio

## Tech Stack

- **Frontend**: Vanilla TypeScript + Vite
- **Styling**: Custom CSS with mobile-first approach
- **Audio**: Web Audio API with procedural generation
- **Deployment**: GitHub Pages via GitHub Actions
- **No Backend**: Pure client-side

## License

MIT
