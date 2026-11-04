import { useEffect } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

const ALARM = require("../assets/alarm.wav");

export function useAlarm() {
  const player = useAudioPlayer(ALARM);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  function start() {
    player.loop = true;
    player.volume = 1.0; // player volume; system volume needs a native module (see docs)
    player.seekTo(0);
    player.play();
  }

  function stop() {
    player.pause();
  }

  return { start, stop };
}
