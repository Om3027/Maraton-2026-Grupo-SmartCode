import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { api } from "./api";

const SEND_EVERY_MS = 5000;

/**
 * While alertId is set, watches the GPS and posts the latest position every 5 s,
 * even if she has not moved, so guardians can tell "stopped" from "signal lost".
 */
export function useLocationSender(alertId) {
  const latest = useRef(null);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!alertId) return undefined;
    let subscription;
    let cancelled = false;

    async function begin() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Sin permiso de ubicación. Actívalo en los ajustes del teléfono para que tu familia pueda verte.");
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: SEND_EVERY_MS, distanceInterval: 0 },
        (position) => {
          const isFirstFix = !latest.current;
          latest.current = position.coords;
          if (isFirstFix) send();
        },
      );
      if (cancelled) subscription.remove();
    }

    async function send() {
      const coords = latest.current;
      if (!coords) return;
      try {
        await api(`/alerts/${alertId}/locations`, {
          method: "POST",
          body: { lat: coords.latitude, lng: coords.longitude },
        });
        setLastSentAt(new Date());
        setError("");
      } catch (err) {
        setError(err.message);
      }
    }

    begin().catch(() => setError("No pudimos acceder al GPS. Revisa que la ubicación esté encendida."));
    const timer = setInterval(send, SEND_EVERY_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription?.remove();
    };
  }, [alertId]);

  return { lastSentAt, error };
}
