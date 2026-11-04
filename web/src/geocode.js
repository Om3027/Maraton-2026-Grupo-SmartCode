import { useEffect, useRef, useState } from "react";

const MIN_INTERVAL_MS = 15000;
const MIN_MOVE_DEG = 0.0002; // ~20 m: Nominatim's usage policy asks for low request rates

export function useReverseGeocode(point) {
  const [address, setAddress] = useState("");
  const lastQuery = useRef({ at: 0, lat: null, lng: null });

  useEffect(() => {
    if (!point) return;
    const prev = lastQuery.current;
    const moved = prev.lat === null
      || Math.abs(point.lat - prev.lat) > MIN_MOVE_DEG
      || Math.abs(point.lng - prev.lng) > MIN_MOVE_DEG;
    if (!moved || Date.now() - prev.at < MIN_INTERVAL_MS) return;
    lastQuery.current = { at: Date.now(), lat: point.lat, lng: point.lng };

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${point.lat}&lon=${point.lng}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.display_name && setAddress(data.display_name))
      .catch(() => {});
  }, [point?.lat, point?.lng]);

  return address;
}
