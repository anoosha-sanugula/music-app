# Music App 🎵

A cross-platform music player app built with Expo, supporting both iOS and Android.

## Features

- Browse and play music from device library
- Permission handling with AppState re-check
- Dark theme UI
- Mini player with playback controls
- Liked songs and albums (Phase 4)

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81)
- **Routing**: expo-router (file-based routing)
- **State**: Zustand
- **Audio**: expo-av
- **Media Library**: expo-media-library
- **Persistence**: expo-file-system

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab screens
│   │   ├── index.tsx      # Songs tab
│   │   └── library.tsx    # Library tab
│   ├── modal.tsx          # Now Playing modal
│   └── _layout.tsx        # Root layout
├── components/             # Reusable UI components
├── hooks/                 # Custom React hooks
├── services/              # Business logic
│   ├── permissionService.ts
│   └── musicService.ts
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── utils/                 # Design system (colors, typography, spacing)
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npx expo start
   ```

3. Run on iOS:
   ```bash
   npx expo run:ios
   ```

4. Run on Android:
   ```bash
   npx expo run:android
   ```

## Phases

- **Phase 1**: Foundation & Project Setup ✅
- **Phase 2**: Device Access & Music Discovery ✅
- **Phase 3**: Core Playback Experience (in progress)
- **Phase 4**: Personalization & Advanced Features

## Commands

```bash
npm run lint        # Run ESLint
npm run reset-project  # Reset to blank template
```
