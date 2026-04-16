import { Audio, type AVPlaybackStatus } from 'expo-av';

let sound: Audio.Sound | null = null;

export async function configureAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
}

export async function loadAndPlaySong(
  uri: string,
  onStatusUpdate: (status: AVPlaybackStatus) => void
): Promise<Audio.Sound> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }

  const { sound: newSound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
    onStatusUpdate
  );

  sound = newSound;
  return sound;
}

export async function play(): Promise<void> {
  if (sound) {
    await sound.playAsync();
  }
}

export async function pause(): Promise<void> {
  if (sound) {
    await sound.pauseAsync();
  }
}

export async function seekTo(positionMs: number): Promise<void> {
  if (sound) {
    await sound.setPositionAsync(positionMs);
  }
}

export async function unload(): Promise<void> {
  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }
}
