import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { loadGoogleMaps } from "../googleMaps.js";

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const ZOOM = 17;

export default function MapView({ trail }) {
  return (
    <div className="map" role="img" aria-label="Mapa con la ubicación más reciente y el recorrido durante la alerta">
      {GOOGLE_KEY ? <GoogleMap trail={trail} /> : <LeafletMap trail={trail} />}
    </div>
  );
}

function LeafletMap({ trail }) {
  const el = useRef(null);
  const layers = useRef(null);

  useEffect(() => {
    const map = L.map(el.current, { zoomControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; colaboradores de OpenStreetMap",
    }).addTo(map);
    layers.current = {
      map,
      path: L.polyline([], { color: "#6a1b9a", weight: 4 }).addTo(map),
      marker: L.circleMarker([0, 0], { radius: 10, color: "#ffffff", weight: 3, fillColor: "#b3261e", fillOpacity: 1 }).addTo(map),
    };
    return () => map.remove();
  }, []);

  useEffect(() => {
    const { map, path, marker } = layers.current;
    const coords = trail.map((p) => [p.lat, p.lng]);
    const last = coords[coords.length - 1];
    path.setLatLngs(coords);
    marker.setLatLng(last);
    map.setView(last, map.getZoom() || ZOOM);
  }, [trail]);

  return <div ref={el} className="map-canvas" />;
}

function GoogleMap({ trail }) {
  const el = useRef(null);
  const layers = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(GOOGLE_KEY).then((maps) => {
      if (cancelled) return;
      const map = new maps.Map(el.current, { zoom: ZOOM, center: trail[trail.length - 1], streetViewControl: false });
      layers.current = {
        map,
        path: new maps.Polyline({ map, strokeColor: "#6a1b9a", strokeWeight: 4 }),
        marker: new maps.Marker({ map }),
      };
      draw(trail);
    });
    return () => { cancelled = true; };
  }, []);

  function draw(points) {
    if (!layers.current) return;
    const last = points[points.length - 1];
    layers.current.path.setPath(points);
    layers.current.marker.setPosition(last);
    layers.current.map.panTo(last);
  }

  useEffect(() => draw(trail), [trail]);

  return <div ref={el} className="map-canvas" />;
}
