import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useReverseGeocode } from "../geocode.js";
import MapView from "./MapView.jsx";

const POLL_MS = 5000;

function formatTime(iso) {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "medium" });
}

function secondsAgo(iso) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}

function StatusBadge({ status }) {
  if (!status.alert || status.alert.status === "closed") {
    return <span className="badge badge-ok">Sin alerta activa</span>;
  }
  if (status.signal_lost) return <span className="badge badge-warning">⚠ Señal perdida</span>;
  return <span className="badge badge-danger">● Alerta activa: en vivo</span>;
}

export default function LiveView({ userId }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const last = status?.last_location;
  const address = useReverseGeocode(last);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    async function poll() {
      clearTimeout(timer);
      try {
        const data = await api(`/users/${userId}/live?_=${Date.now()}`);
        if (!cancelled) { setStatus(data); setError(""); setUpdatedAt(new Date()); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS); // keep polling even after a failed request
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") poll();
    }
    setStatus(null);
    poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  if (!status) return <section className="card" aria-busy="true"><p role="status">{error || "Cargando ubicación…"}</p></section>;

  const active = status.alert?.status === "active";
  return (
    <section className={`card live ${active ? "live-active" : ""}`} aria-labelledby="live-title">
      <div className="live-header">
        <h2 id="live-title">{status.user.full_name}</h2>
        <div aria-live="polite"><StatusBadge status={status} /></div>
      </div>
      <p className="muted updated">
        Última actualización: {updatedAt?.toLocaleTimeString("es-CO")} · se actualiza sola cada 5 segundos
      </p>
      {error && <p className="alert-error" role="alert">{error} Seguimos intentando cada 5 segundos.</p>}

      {last ? (
        <>
          <MapView trail={status.trail} />
          <dl className="facts">
            <div>
              <dt>{status.signal_lost ? "Última ubicación conocida" : "Ubicación actual"}</dt>
              <dd>{address || `${last.lat.toFixed(5)}, ${last.lng.toFixed(5)}`}</dd>
            </div>
            <div>
              <dt>Hora del último dato</dt>
              <dd>{formatTime(last.recorded_at)} (hace {secondsAgo(last.recorded_at)} s)</dd>
            </div>
            {status.alert && (
              <div>
                <dt>Alerta iniciada</dt>
                <dd>{formatTime(status.alert.started_at)}</dd>
              </div>
            )}
          </dl>
          <a className="btn btn-secondary" target="_blank" rel="noopener noreferrer"
             href={`https://www.openstreetmap.org/?mlat=${last.lat}&mlon=${last.lng}#map=18/${last.lat}/${last.lng}`}>
            Abrir en un mapa externo
          </a>
        </>
      ) : (
        <p>{active ? "La alerta está activa, pero aún no llega ninguna ubicación." : "No hay ubicaciones registradas. Aquí verás el mapa cuando ella active una alerta."}</p>
      )}

      <details className="help">
        <summary>¿Qué significan estos estados?</summary>
        <ul>
          <li><strong>Alerta activa: en vivo</strong>: su teléfono está enviando la ubicación. El mapa se actualiza cada 5 segundos.</li>
          <li><strong>Señal perdida</strong>: no llegan datos hace más de 30 segundos (sin batería, sin datos móviles o teléfono apagado). Te mostramos el último lugar conocido y la hora. Si no logras comunicarte con ella, llama a la Línea 123.</li>
          <li><strong>Sin alerta activa</strong>: ella no ha pedido ayuda o ya indicó que está a salvo.</li>
        </ul>
      </details>
    </section>
  );
}
