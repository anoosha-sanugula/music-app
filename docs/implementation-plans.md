---

# Music App – Revised Implementation Plan (4 Phases)

## Architecture Overview

* UI Layer → Screens & Components
* Service Layer → Business logic (player, library, permissions)
* Data Layer → Local storage, filesystem, metadata
* Native Layer → iOS & Android platform configuration

---

## Global Decisions (Apply Across All Phases)

These are non-negotiable decisions that all phases and all specs must follow.

### Platform Support

* The app targets **both iOS and Android**
* All services and permissions use Expo-managed libraries only — no bare workflow, no custom native modules
* Use `Platform.OS` to branch platform-specific behaviour where unavoidable
* The app runs on **Expo Dev Client** (not Expo Go — `expo-media-library` and background audio require a dev build)

### Core Libraries

* **Media library & permissions:** `expo-media-library` — used on both platforms for permission requests, audio asset discovery, and metadata
* **Playback:** `expo-av` (`Audio.Sound`) — used on both platforms for all audio playback
* **Filesystem (persistence only):** `expo-file-system` — used only for reading and writing the library store JSON file
* **No `react-native-fs`**, **no `music-metadata`**, **no `react-native-track-player`**, **no `react-native-get-music-files`** — these are either Node.js-only or require bare workflow

### Known Limitations (Accepted for This Project)

* **No lock screen controls** — `expo-av` does not support lock screen Now Playing controls or Android notification player. Background audio (music continues when screen locks) is supported; controls are not.
* **No arbitrary filesystem scanning** — iOS sandboxing and Android media store consistency mean all audio discovery goes through `expo-media-library`, not raw filesystem paths
* **Metadata is limited to what `expo-media-library` provides** — title, artist, album, duration, artwork. Extended tags (composer, genre, bitrate) are not available without a native metadata library

### State Management

* Use **Zustand** for global state
* Two stores:
  * `usePlayerStore` — current track, playback status, queue, repeat/shuffle mode, `Audio.Sound` instance
  * `useLibraryStore` — liked song IDs, user-created albums
* No prop drilling — all screens read directly from stores
* Stores are initialized on app startup

### Navigation Structure

* **Bottom tab navigator** with two tabs: `Songs` and `Library`
* `Songs` tab → Song List Screen (stack navigator)
* `Library` tab → Library Screen (stack navigator)
* **Now Playing Screen** opens as a **modal** from anywhere in the app
* **Mini Player** is rendered in the root layout, visible on all non-modal screens

### Theming & Design System

* Dark theme only
* All colour tokens defined in `utils/colors.ts` — no hardcoded hex values anywhere
* Typography scale defined in `utils/typography.ts`
* Spacing scale defined in `utils/spacing.ts`
* All new components consume tokens, never raw values

### Error Handling Philosophy

* Every async operation (asset fetch, permission request, playback, store load) must handle errors explicitly — no silent failures
* Errors are categorised: `permission_denied`, `asset_unavailable`, `playback_failed`, `store_corrupt`, `unknown`
* UI always shows a meaningful message for each error category
* Errors are logged to console in development

### Persistence Layer

* Persistence file lives at: `FileSystem.documentDirectory + 'library-store.json'`
* Uses `expo-file-system` (`readAsStringAsync` / `writeAsStringAsync`)
* Schema:
  ```json
  {
    "likedSongIds": ["string"],
    "albums": [
      {
        "id": "string",
        "name": "string",
        "songIds": ["string"],
        "createdAt": "ISO string"
      }
    ],
    "version": 1
  }
  ```
* Loaded once on app startup inside `useLibraryStore`
* Written on every mutation (like toggle, album CRUD)
* If the file is missing → initialise with empty defaults (not an error)
* If the file is corrupt → log the error, reset to empty defaults, do not crash

---

# Phase 1: Foundation & Project Setup

### Objective

Establish the base structure, environment, and shared foundations that all future phases build on — for both iOS and Android.

### Implementation Strategy

1. **Project Initialization**

   * Scaffold with `npx create-expo-app@latest`
   * Configure folder structure
   * Setup `@/*` path alias in `tsconfig.json` and `babel.config.js`

2. **Core Architecture Setup**

   * Define base folders:
     * `services/` — business logic
     * `utils/` — pure helpers (colors, typography, spacing, formatters)
     * `types/` — shared TypeScript interfaces
     * `components/` — reusable UI components
     * `screens/` — full screen components
     * `stores/` — Zustand store definitions
     * `hooks/` — custom React hooks

3. **Design System Foundation**

   * Create `utils/colors.ts` with full dark theme colour tokens
   * Create `utils/typography.ts` with font size and weight scale
   * Create `utils/spacing.ts` with spacing scale
   * No screen should hardcode a colour, size, or spacing value

4. **Navigation Shell**

   * Setup Expo Router file-based routing
   * Configure bottom tab navigator (`Songs`, `Library`)
   * Configure modal route for Now Playing
   * Create placeholder screens for all routes

5. **Store Scaffolding**

   * Create `usePlayerStore` with initial shape (empty — no logic yet)
   * Create `useLibraryStore` with initial shape (empty — no logic yet)
   * Both stores wired into the app but not yet functional

6. **Native Platform Configuration**

   * Both platforms are configured via `app.json` only — no manual edits to `AndroidManifest.xml` or `Info.plist`

   **Android (`app.json`):**
   * Add `expo-media-library` plugin with `READ_EXTERNAL_STORAGE` and `READ_MEDIA_AUDIO` permissions
   * Set `android.useNextNotificationsApi: true`

   **iOS (`app.json`):**
   * Add `NSPhotoLibraryUsageDescription` and `NSAppleMusicUsageDescription` via `infoPlist`
   * Add `UIBackgroundModes: ["audio"]` via `infoPlist` for background playback

   **Both:**
   * Add `expo-av` plugin with `microphonePermission: false`
   * All plugin configuration lives in `app.json` — regenerate native folders with `npx expo prebuild` when changed

---

# Phase 2: Device Access & Music Discovery

### Objective

Request media permissions and build the music dataset using `expo-media-library` consistently on both platforms.

### Implementation Strategy

1. **Permission Service**

   * Use `MediaLibrary.requestPermissionsAsync()` from `expo-media-library` — works identically on iOS and Android
   * Map all permission states: `granted`, `denied`, `blocked`, `undetermined`
   * `blocked` (user has permanently denied) → call `Linking.openSettings()` to send user to system settings
   * Re-check permission state when app returns to foreground using `AppState` listener
   * Permission state stored in `usePlayerStore`

2. **Permission Denied UI**

   * When permission is `denied` or `blocked`, show a dedicated full-screen empty state
   * Empty state includes: icon, explanation text, and a CTA button ("Open Settings" or "Grant Access")
   * This is not an error — it is a standard UI state

3. **Music Discovery Service**

   * Use `MediaLibrary.getAssetsAsync({ mediaType: MediaLibrary.MediaType.audio })` — works on both platforms
   * Paginate using `after` cursor until `hasNextPage` is false — do not assume all assets fit in one call
   * For each asset, call `MediaLibrary.getAssetInfoAsync(asset)` to retrieve `localUri` (`file://` path) — this is required because `expo-av` cannot play the raw asset URI directly; it needs `localUri`
   * Filter out non-music assets by duration: skip assets under 30 seconds (voice memos, ringtones, notification sounds)
   * Normalise all metadata fields:
     * Missing `title` → fall back to filename (strip path and extension)
     * Missing `artist` → fall back to `"Unknown Artist"`
     * Missing `album` → fall back to `"Unknown Album"`
   * Deduplicate by `localUri`
   * Return typed `Song[]` array

4. **Data Modeling**

   * Define `Song` type in `types/Song.ts`:
     ```ts
     type Song = {
       id: string;        // asset.id from expo-media-library
       title: string;
       artist: string;
       album: string;
       duration: number;  // milliseconds
       uri: string;       // localUri (file://) — safe for expo-av playback
       artwork?: string;  // asset URI for artwork, optional
     }
     ```
   * `uri` is always a `file://` path by the time it reaches the store — the `ph://` → `localUri` conversion happens inside the discovery service, never downstream
   * All downstream code imports from `types/Song.ts` — no local type redefinitions

---

# Phase 3: Core Playback Experience

### Objective

Deliver the complete music playing experience on both platforms: browse, play, control, search.

### Implementation Strategy

1. **Song List Screen**

   * Display songs using `FlatList` with `keyExtractor` on `song.id`
   * Handle all states: `loading`, `empty` (no songs found), `permission_denied`, `error`
   * Each state renders a distinct, meaningful UI — no generic spinners with no context
   * Pull-to-refresh re-triggers the full asset fetch and normalisation

2. **Playback Engine**

   * Use `expo-av` `Audio.Sound` for all playback
   * Configure audio mode once on startup:
     ```ts
     Audio.setAudioModeAsync({
       staysActiveInBackground: true,   // background audio continues when screen locks
       playsInSilentModeIOS: true,      // plays even when iOS silent switch is on
       shouldDuckAndroid: true,         // lower volume when another app needs audio focus
     })
     ```
   * The `Audio.Sound` instance lives in `usePlayerStore` — created on first play, reused for track changes via `sound.loadAsync(newSource)`
   * All playback state in `usePlayerStore`: `currentSong`, `isPlaying`, `position`, `duration`, `queue`, `queueIndex`
   * **Queue initialisation rule:** tapping a song loads the entire current filtered/sorted list into the queue, starting at the tapped index
   * Implement: play, pause, next, previous, seek via `sound.setPositionAsync(ms)`
   * Subscribe to playback status via `sound.setOnPlaybackStatusUpdate` — use this to sync `position`, `duration`, `isPlaying`, and to auto-advance on track finish
   * Unload the sound (`sound.unloadAsync()`) before loading a new track to free memory

   **Audio interruptions:**
   * `shouldDuckAndroid: true` handles Android audio focus automatically — `expo-av` ducks volume when another app requests focus and restores it after
   * iOS interruptions (calls, Siri) are handled automatically by `expo-av` when `playsInSilentModeIOS` and `staysActiveInBackground` are set — the sound pauses on interruption and the `onPlaybackStatusUpdate` callback fires with `isPlaying: false`

   **Background audio:**
   * Enabled via `staysActiveInBackground: true` in `Audio.setAudioModeAsync`
   * Requires `UIBackgroundModes: ["audio"]` in `app.json` (configured in Phase 1) on iOS
   * Music continues playing when the screen locks on both platforms
   * There are no lock screen controls — this is an accepted limitation

3. **Now Playing Screen**

   * Opens as a modal
   * Displays: artwork (or placeholder), title, artist, seek bar, position/duration labels, playback controls
   * All controls bound to `usePlayerStore` actions
   * Seek bar updates every second via `onPlaybackStatusUpdate`

4. **Mini Player**

   * Rendered in root layout — visible on all tab screens, hidden when Now Playing modal is open
   * Displays: song title, artist, play/pause button
   * Tapping anywhere on it opens the Now Playing modal
   * Synced to `usePlayerStore` — shows nothing when queue is empty
   * Wrapped in `SafeAreaView` — accounts for iOS home indicator and Android navigation bar on both platforms

5. **Search & Sort**

   * Search filters by title and artist (case-insensitive)
   * Sort options: A–Z, Z–A, by artist, by duration
   * Both are UI-only — they filter/sort the in-memory song array, not the store
   * Active search + sort state lives in local component state, not the global store

---

# Phase 4: Personalization & Advanced Features

### Objective

Enhance user experience with persistence, likes, albums, and advanced playback controls — consistent across both platforms.

### Implementation Strategy

1. **Library Store (Persistence)**

   * Implement full load/save logic in `useLibraryStore` using `expo-file-system` and the schema defined in Global Decisions
   * `FileSystem.documentDirectory` resolves correctly on both iOS and Android — no platform branching needed
   * Load on app startup — block Library tab render until loaded (show loading state, not empty state)
   * Save on every mutation using `FileSystem.writeAsStringAsync`
   * Handle missing file (first launch) and corrupt file as defined in Global Decisions

2. **Likes System**

   * Like toggle available on: song list rows, Now Playing screen, song options menu
   * Liked state derived from `useLibraryStore.likedSongIds`
   * Liked Songs screen under the Library tab — uses the same `SongListItem` component as the main list
   * Persists across restarts on both platforms

3. **Albums Feature**

   * Create album: name input → generates UUID → saved to store
   * Rename album: inline edit or modal
   * Delete album: confirmation dialog → removes album and all song references
   * Album detail screen: lists songs in album, supports removing individual songs
   * Add to album: accessible from song options menu

4. **System Albums**

   * Auto-generated from song metadata — not user-created
   * Grouped by: `song.album`, `song.artist`
   * Missing metadata is already normalised in Phase 2 — fallback values guaranteed, never `undefined`
   * Displayed in Library tab alongside user albums, visually distinguished

5. **Advanced Queue & Playback Modes**

   * **Repeat modes:** `off` → `repeat-all` → `repeat-one` (cycles on button tap)
   * **Shuffle:** when enabled, shuffles the remaining queue on next track advance; disabling restores original order
   * **Queue actions from song options menu:** Play Now, Play Next (inserts after current), Add to Queue (appends)
   * All queue state and mutations live in `usePlayerStore`

6. **Performance & Stability**

   * Virtualise all long lists — no `ScrollView` for song lists; always `FlatList`
   * Asset fetching is paginated — never load all assets in a single call
   * `getAssetInfoAsync` calls are batched, not sequential — avoid fetching `localUri` one-by-one in a loop
   * Race condition guard on rapid next/previous taps — debounce track change by 300ms
   * Always call `sound.unloadAsync()` before loading a new track
   * All error categories from Global Decisions handled and surfaced in UI
   * Test on a physical device for both platforms — simulator/emulator does not accurately represent media library behaviour

---
