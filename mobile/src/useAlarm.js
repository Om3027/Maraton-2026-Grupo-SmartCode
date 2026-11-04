import { useEffect, useRef } from "react";
import { NativeModules, Vibration } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

const ALARM = require("../assets/alarm.wav");
const VIBRATION_PATTERN = [0, 800, 400];
const LOAD_TIMEOUT_MS = 3000;

// expo-av was removed from the Expo SDK; these are the expo-audio equivalents of
// playsInSilentModeIOS, shouldDuckAndroid=false, playThroughEarpieceAndroid=false
// and staysActiveInBackground.
const AUDIO_MODE = {
  playsInSilentMode: true,
  interruptionMode: "doNotMix",
  shouldRouteThroughEarpiece: false,
  shouldPlayInBackground: true,
};

function loadVolumeManager() {
  // Native-only module: importing it at the top crashes Expo Go, so require it lazily after checking it is linked.
  if (!NativeModules.VolumeManager) return null;
  try {
    return require("react-native-volume-manager").VolumeManager;
  } catch (error) {
    console.warn("Volume manager failed to load", error);
    return null;
  }
}

async function forceMaxSystemVolume() {
  const volumeManager = loadVolumeManager();
  if (!volumeManager) return; // Expo Go: player volume 1.0 plus vibration only
  for (const type of ["music", "alarm"]) {
    await volumeManager.setVolume(1.0, { type, showUI: false })
      .catch((error) => console.warn(`Could not set ${type} volume`, error));
  }
}

async function applyAudioMode() {
  try {
    await setAudioModeAsync(AUDIO_MODE);
  } catch {
    // Expo Go may reject background playback; foreground playback is enough while the app is open.
    await setAudioModeAsync({ ...AUDIO_MODE, shouldPlayInBackground: false })
      .catch((error) => console.warn("Could not set audio mode", error));
  }
}

function waitUntilLoaded(player) {
  if (player.isLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(() => { sub.remove(); resolve(); }, LOAD_TIMEOUT_MS);
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) { clearTimeout(timer); sub.remove(); resolve(); }
    });
  });
}

export function useAlarm() {
  const player = useAudioPlayer(ALARM);
  const ringing = useRef(false);

  useEffect(() => {
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      // Android pauses players when another app or the system takes audio focus: resume while ringing.
      if (ringing.current && status.isLoaded && !status.playing) player.play();
    });
    return () => sub.remove();
  }, [player]);

  async function start() {
    ringing.current = true;
    Vibration.vibrate(VIBRATION_PATTERN, true); // works everywhere, even with media volume at 0
    await applyAudioMode();
    await forceMaxSystemVolume();
    await waitUntilLoaded(player);
    if (!ringing.current) return;
    player.loop = true;
    player.volume = 1.0;
    await player.seekTo(0);
    player.play();
  }

  function stop() {
    ringing.current = false;
    Vibration.cancel();
    player.pause();
  }

  return { start, stop };
}
