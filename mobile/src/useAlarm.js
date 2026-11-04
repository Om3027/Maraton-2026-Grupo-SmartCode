import { useEffect, useRef } from "react";
import { Vibration } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { VolumeManager } from "react-native-volume-manager";

const ALARM = require("../assets/alarm.wav");
const VIBRATION_PATTERN = [0, 800, 400];
const LOAD_TIMEOUT_MS = 3000;
// TEMP: debug logs for the "no sound" bug; remove once confirmed on the phone.
const log = (...args) => console.log("[alarm]", ...args);

// expo-av was removed from the Expo SDK; these are the expo-audio equivalents of
// playsInSilentModeIOS, shouldDuckAndroid=false, playThroughEarpieceAndroid=false
// and staysActiveInBackground.
const AUDIO_MODE = {
  playsInSilentMode: true,
  interruptionMode: "doNotMix",
  shouldRouteThroughEarpiece: false,
  shouldPlayInBackground: true,
};

async function forceMaxSystemVolume() {
  // Needs the native module (dev build / APK). In Expo Go it throws and we rely on the player volume.
  for (const type of ["music", "alarm"]) {
    try {
      await VolumeManager.setVolume(1.0, { type, showUI: false });
      log(`system volume '${type}' set to 1.0`);
    } catch (error) {
      log(`system volume '${type}' not available (expected in Expo Go):`, error.message);
    }
  }
}

function waitUntilLoaded(player) {
  if (player.isLoaded) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => { sub.remove(); resolve(false); }, LOAD_TIMEOUT_MS);
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded) { clearTimeout(timer); sub.remove(); resolve(true); }
    });
  });
}

export function useAlarm() {
  const player = useAudioPlayer(ALARM);
  const ringing = useRef(false);

  useEffect(() => {
    log("asset module id:", ALARM, "loaded at mount:", player.isLoaded);
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      // Android pauses players when another app or the system takes audio focus: resume while ringing.
      if (ringing.current && status.isLoaded && !status.playing) {
        log("player stopped while ringing, resuming", { volume: player.volume });
        player.play();
      }
    });
    return () => sub.remove();
  }, [player]);

  async function start() {
    ringing.current = true;
    Vibration.vibrate(VIBRATION_PATTERN, true); // works everywhere, even with media volume at 0
    try {
      await setAudioModeAsync(AUDIO_MODE);
      log("audio mode set", AUDIO_MODE);
    } catch (error) {
      log("setAudioModeAsync failed:", error.message);
      await setAudioModeAsync({ ...AUDIO_MODE, shouldPlayInBackground: false })
        .then(() => log("audio mode set without background playback"))
        .catch((e) => log("setAudioModeAsync retry failed:", e.message));
    }
    await forceMaxSystemVolume();
    const loaded = await waitUntilLoaded(player);
    log("asset loaded:", loaded, "duration:", player.duration);
    if (!ringing.current) return;
    player.loop = true;
    player.volume = 1.0;
    await player.seekTo(0);
    player.play();
    log("play() called", { playing: player.playing, volume: player.volume, loop: player.loop });
  }

  function stop() {
    ringing.current = false;
    Vibration.cancel();
    player.pause();
    log("stopped");
  }

  return { start, stop };
}
