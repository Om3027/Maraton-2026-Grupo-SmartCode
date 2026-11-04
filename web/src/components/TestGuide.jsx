import { useState } from "react";
import { APK_URL, REPO_URL } from "../config.js";

const EXPO_COMMANDS = [
  { label: "Clonar el repositorio", command: `git clone ${REPO_URL}` },
  { label: "Entrar a la carpeta de la app", command: "cd Maraton-2026-Grupo-SmartCode/mobile" },
  { label: "Instalar dependencias", command: "npm install" },
  { label: "Iniciar Expo", command: "npx expo start" },
];

function CopyCommand({ label, command }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("Copiado");
    } catch {
      setStatus("No se pudo copiar: selecciónalo y cópialo a mano");
    }
  }

  return (
    <div className="command">
      <code>{command}</code>
      <button type="button" className="btn btn-secondary" onClick={copy} aria-label={`Copiar comando: ${label}`}>
        Copiar
      </button>
      <span className="command-status" role="status">{status}</span>
    </div>
  );
}

function ApkButton() {
  if (!APK_URL) {
    return (
      <button type="button" className="btn btn-primary" disabled>
        Descargar APK (Próximamente)
      </button>
    );
  }
  return <a className="btn btn-primary" href={APK_URL}>Descargar APK</a>;
}

export default function TestGuide({ onBack }) {
  return (
    <article className="guide" aria-labelledby="guide-title">
      <h1 id="guide-title">¿Cómo probar Ruta Segura?</h1>
      <p className="guide-intro">
        Ruta Segura es una alarma de pánico para mujeres que transitan de noche por el espacio público.
        Con tres toques en el celular suena una alarma fuerte y su familia ve su ubicación en vivo en este portal.
      </p>

      <p className="guide-note" role="note">
        <strong>Importante:</strong> la alerta solo se activa desde la app móvil. Este portal web es para el familiar que acompaña.
      </p>

      <section className="card" aria-labelledby="option-a">
        <h2 id="option-a">Opción A: instalar el APK en Android <span className="badge badge-ok">Recomendada</span></h2>
        <ol className="steps">
          <li>Toca el botón para descargar el archivo APK. <ApkButton /></li>
          <li>Si Android lo pide, permite <strong>«instalar apps de fuentes desconocidas»</strong> para tu navegador.</li>
          <li>Abre la app Ruta Segura, crea una cuenta y elige <strong>Usuaria</strong> o <strong>Familiar</strong>.</li>
        </ol>
        <p className="muted">Solo para teléfonos Android.</p>
      </section>

      <section className="card" aria-labelledby="option-b">
        <h2 id="option-b">Opción B: usar Expo Go desde un computador</h2>
        <ol className="steps">
          <li>Instala <strong>Expo Go</strong> en tu teléfono desde la tienda de aplicaciones.</li>
          <li>
            En el computador (con Git y Node.js instalados), copia y ejecuta estos comandos en orden:
            {EXPO_COMMANDS.map((item) => <CopyCommand key={item.command} {...item} />)}
          </li>
          <li>Escanea con Expo Go el código QR que aparece en la terminal.</li>
          <li>
            El teléfono y el computador deben estar en la misma red Wi-Fi. Si no lo están, usa:
            <CopyCommand label="Iniciar Expo con túnel" command="npx expo start --tunnel" />
          </li>
        </ol>
        <p className="guide-warning">
          <strong>Limitación:</strong> Expo Go no puede subir el volumen del sistema, así que la alarma puede sonar bajo.
          El APK sí lo sube al máximo. En ambos casos el teléfono vibra.
        </p>
      </section>

      <section className="card" aria-labelledby="full-flow">
        <h2 id="full-flow">Cómo probar el flujo completo</h2>
        <ol className="flow">
          <li><span aria-hidden="true">📱</span> <strong>Usuaria:</strong> en la app, toca 3 veces seguidas el botón SOS. Suena la alarma y empieza a enviar su ubicación.</li>
          <li><span aria-hidden="true">🔗</span> <strong>Familiar:</strong> inicia sesión en este portal, escribe el código de invitación que ve la usuaria en su app y mira el mapa en vivo.</li>
          <li><span aria-hidden="true">⚠️</span> <strong>Sin señal:</strong> si el teléfono deja de enviar datos por 30 segundos (por ejemplo, en modo avión), el portal muestra «Señal perdida».</li>
          <li><span aria-hidden="true">✅</span> <strong>Fin:</strong> la usuaria toca «Estoy a salvo» y la alerta termina.</li>
        </ol>
      </section>

      <a className="btn btn-primary" href="/" onClick={onBack}>Ir a iniciar sesión</a>
    </article>
  );
}
