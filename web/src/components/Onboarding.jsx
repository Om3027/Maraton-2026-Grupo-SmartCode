import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    icon: "📱",
    title: "1. Ella activa la alerta",
    text: "Si se siente en peligro, toca tres veces seguidas la pantalla de la app Ruta Segura. Suena una alarma fuerte y su ubicación empieza a enviarse cada 5 segundos.",
  },
  {
    icon: "🔗",
    title: "2. Tú te vinculas con un código",
    text: "Ella te comparte su código de invitación de 8 caracteres. Crea tu cuenta de familiar, escribe el código y quedarás conectado o conectada a sus alertas.",
  },
  {
    icon: "🗺️",
    title: "3. Ves su ubicación en vivo",
    text: "Durante una alerta verás el mapa actualizarse solo. Si su teléfono deja de enviar datos, verás la última ubicación conocida, la hora y el aviso «Señal perdida».",
  },
];

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const headingRef = useRef(null);
  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  useEffect(() => headingRef.current?.focus(), [step]);

  return (
    <section className="card onboarding" aria-labelledby="onboarding-title">
      <p className="muted">Paso {step + 1} de {STEPS.length}</p>
      <div className="onboarding-icon" aria-hidden="true">{current.icon}</div>
      <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{current.title}</h1>
      <p>{current.text}</p>
      <div className="dots" aria-hidden="true">
        {STEPS.map((_, i) => <span key={i} className={i === step ? "dot active" : "dot"} />)}
      </div>
      <div className="row">
        {step > 0 && <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>Atrás</button>}
        <button className="btn btn-primary" onClick={() => (last ? onFinish() : setStep(step + 1))}>
          {last ? "Empezar" : "Siguiente"}
        </button>
        {!last && <button className="btn btn-link" onClick={onFinish}>Saltar</button>}
      </div>
    </section>
  );
}
