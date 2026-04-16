# Phase 1 Spec: Foundation & Project Setup

**Objective**: Establish the base structure, environment, and shared foundations for both iOS and Android.

---

## 1. Folder Structure

Create these directories in the project root:
- `services/` — business logic (placeholder, logic added in later phases)
- `utils/` — pure helpers (colors, typography, spacing, formatters)
- `types/` — shared TypeScript interfaces
- `screens/` — full screen components (placeholder screens)
- `stores/` — Zustand store definitions
- `hooks/` — custom React hooks

---

## 2. Design System Foundation

### `utils/colors.ts`
Dark theme only color tokens:
- `background`, `surface`, `card`
- `text`, `textSecondary`, `textMuted`
- `primary`, `primaryMuted`
- `border`, `separator`
- `error`, `success`

### `utils/typography.ts`
- Font size scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
- Font weight scale
- Line height values

### `utils/spacing.ts`
- Spacing scale (0-8 based on 4px unit: 4, 8, 12, 16, 24, 32, 48, 64)

### Rule
No screen should hardcode a colour, size, or spacing value. All components consume tokens from these files.

---

## 3. Navigation Shell

### Tab Structure
- Bottom tab navigator with two tabs: **Songs** and **Library**
- No header shown, tabs render the content directly

### Routes
- `app/(tabs)/_layout.tsx` — Tab navigator configuration
- `app/(tabs)/songs.tsx` — Songs tab screen (placeholder)
- `app/(tabs)/library.tsx` — Library tab screen (placeholder)
- `app/modal.tsx` — Now Playing modal (placeholder)
- `app/_layout.tsx` — Root layout with Stack navigator wrapping tabs + modal

### Mini Player
- Rendered in `app/_layout.tsx` below the tab navigator
- Visible on all non-modal screens
- Shows nothing when queue is empty (stores not yet functional)
- Wrapped in `SafeAreaView`

---

## 4. Zustand Stores

### `stores/usePlayerStore.ts`
```ts
interface PlayerState {
  // Placeholder shape - logic added in Phase 3
  currentSong: null;
  isPlaying: false;
  queue: [];
  queueIndex: 0;
}
```

### `stores/useLibraryStore.ts`
```ts
interface LibraryState {
  // Placeholder shape - logic added in Phase 4
  likedSongIds: [];
  albums: [];
}
```

Both stores are created but not yet wired to any UI. They will be connected in later phases.

---

## 5. Native Platform Configuration

All configuration lives in `app.json`. After any changes, run `npx expo prebuild`.

### Android
```json
{
  "expo-media-library": {
    "permissions": ["READ_EXTERNAL_STORAGE", "READ_MEDIA_AUDIO"]
  }
}
```

### iOS (infoPlist)
```json
{
  "NSPhotoLibraryUsageDescription": "This app needs access to your photo library to find music files.",
  "NSAppleMusicUsageDescription": "This app needs access to Apple Music to play your songs.",
  "UIBackgroundModes": ["audio"]
}
```

### expo-av Plugin (both platforms)
```json
{
  "expo-av": {
    "microphonePermission": false
  }
}
```

---

## 6. Dependency Additions

Install Zustand:
```bash
npm install zustand
```

---

## Verification Checklist

- [ ] All new directories created
- [ ] `utils/colors.ts` exports dark theme tokens, no hardcoded hex in components
- [ ] `utils/typography.ts` and `utils/spacing.ts` exist with scales
- [ ] Tab navigator shows Songs and Library tabs
- [ ] Modal route opens from anywhere
- [ ] Mini Player placeholder in root layout
- [ ] Both Zustand stores created with placeholder state
- [ ] `app.json` updated with all plugin configs
- [ ] `npx expo prebuild` runs successfully
- [ ] App builds for iOS and Android
