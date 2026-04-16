# Music App

A cross-platform music player app built with Expo, supporting both iOS and Android.

## Features

- Browse and play music from device library
- Permission handling with AppState re-check
- Dark theme UI
- Mini player with playback controls
- Liked songs and albums (Phase 4)
- Queue management with play now, play next, add to queue
- Repeat modes (off, all, one)
- Shuffle mode
- User-created albums with add/remove songs
- System albums auto-grouped by artist/album
- Share Sheet / Open With support for audio files

## Tech Stack

- **Framework**: Expo SDK 54 (React Native 0.81)
- **Routing**: expo-router (file-based routing)
- **State**: Zustand
- **Audio**: expo-av
- **Media Library**: expo-media-library
- **Persistence**: expo-file-system

## Setup

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

## Dev Build

For native features (media library, share sheet), you need a development build:

```bash
npx expo prebuild
npx expo run:ios    # or npx expo run:android
```

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab screens
│   │   ├── index.tsx      # Songs tab
│   │   └── library.tsx    # Library tab
│   ├── album/[id].tsx     # Album detail screen
│   ├── modal.tsx          # Now Playing modal
│   └── _layout.tsx        # Root layout
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── services/               # Business logic
│   ├── permissionService.ts
│   ├── musicService.ts
│   ├── audioService.ts
│   ├── queueService.ts
│   └── libraryPersistence.ts
├── stores/                 # Zustand stores
├── types/                  # TypeScript types
└── utils/                  # Design system (colors, typography, spacing)
```

## Phases

- **Phase 1**: Foundation & Project Setup
- **Phase 2**: Device Access & Music Discovery
- **Phase 3**: Core Playback Experience
- **Phase 4**: Personalization & Advanced Features

## Known Limitations

- **Album art**: Not displayed; shows placeholder only
- **Search**: Basic title/artist matching only
- **Audio focus**: Not implemented (iOS/Android audio ducking may not work perfectly)
- **Background playback**: Limited on iOS; may stop if app is killed
- **Share Sheet**: Supported audio formats depend on device capabilities
- **Large libraries**: Performance may degrade with 10,000+ songs
- **Metadata editing**: Cannot edit song metadata from within the app
- **Equalizer**: Not implemented

## Commands

```bash
npx expo start       # Start dev server
npx expo lint        # Run ESLint
npm run reset-project  # Reset to blank template
```
