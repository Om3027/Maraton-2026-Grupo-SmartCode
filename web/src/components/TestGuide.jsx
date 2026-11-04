import { useState } from "react";
import { APK_URL, REPO_URL } from "../config.js";

const EXPO_COMMANDS = [
  { label: "Clonar el repositorio", command: `git clone ${REPO_URL}` },
  { label: "Entrar a la carpeta de la app", command: "cd Maraton-2026-Grupo-SmartCode/mobile" },
  { label: "Instalar dependencias", command: "npm install" },
  { label: "Iniciar Expo", command: "npx expo start" },
];

const ROLES = [
  {
    id: "role-user",
    title: "Persona 1: Usuaria",
    where: "En el celular, con la app instalada (APK o Expo Go).",
    steps: [
      <>Abre la app y pulsa <strong>«Crear cuenta»</strong>.</>,
      <>Elige <strong>«Usuaria»</strong> y escribe tu nombre, correo y contraseña.</>,
      <>Al terminar verás tu <strong>código de invitación</strong> en la pantalla principal. Compártelo con la persona 2.</>,
      <>Para activar la alarma, toca el botón <strong>SOS 3 veces</strong>. Suena la alarma, el teléfono vibra y la pantalla se pone roja.</>,
      <><strong>«Silenciar alarma»</strong> apaga el sonido, pero la ubicación se sigue enviando. <strong>«Estoy a salvo»</strong> termina la alerta.</>,
    ],
  },
  {
    id: "role-guardian",
    title: "Persona 2: Familiar",
    where: "En este portal web o en la app.",
    steps: [
      <>Abre el portal (esta misma página) y pulsa <strong>«¿No tienes cuenta? Créala aquí»</strong>, o crea la cuenta desde la app.</>,
      <>Elige <strong>«Familiar»</strong> y escribe tu nombre, correo y contraseña.</>,
      <>Escribe el código de invitación que te dio la usuaria y pulsa <strong>«Vincular»</strong>.</>,
      <>Cuando la usuaria active la alerta, en menos de 5 segundos verás <strong>«Alerta activa: en vivo»</strong>, el mapa, la dirección y la hora de la última actualización.</>,
      <>Si el teléfono pierde la señal por más de 30 segundos, verás <strong>«Señal perdida»</strong> con la última ubicación conocida.</>,
    ],
  },
];

const EXPECTATIONS = [
  "La alarma suena y el teléfono vibra.",
  "El familiar ve la ubicación en vivo, actualizada cada 5 segundos.",
  "Sin datos por más de 30 segundos aparece «Señal perdida».",
  "«Estoy a salvo» termina la alerta y el portal muestra «Sin alerta activa».",
];

function RoleCard({ id, title, where, steps }) {
  return (
    <section className="card role-card" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      <p className="muted">{where}</p>
      <ol className="numbered" role="list">
        {steps.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
    </section>
  );
}

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
  return (
    <>
      <a className="btn btn-primary" href={APK_URL} target="_blank" rel="noopener">Descargar APK</a>
      <small className="muted">El enlace estará disponible durante 13 días</small>
    </>
  );
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
        <strong>La alerta solo se activa desde la app móvil. El portal web es para el familiar.</strong>
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

      <section aria-labelledby="two-accounts">
        <h2 id="two-accounts">Cómo probar con dos cuentas</h2>
        <p>Necesitas dos personas (o dos cuentas): una usuaria con la app en el celular y un familiar que la acompaña.</p>
        <div className="roles">
          {ROLES.map((role) => <RoleCard key={role.id} {...role} />)}
        </div>
      </section>

      <section className="card" aria-labelledby="expect">
        <h2 id="expect">Qué esperar</h2>
        <ul className="checklist" role="list">
          {EXPECTATIONS.map((item) => <li key={item}><span aria-hidden="true">✓</span> {item}</li>)}
        </ul>
      </section>

      <a className="btn btn-primary" href="/" onClick={onBack}>Ir a iniciar sesión</a>
    </article>
  );
}
