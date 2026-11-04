export default function UserHome({ user }) {
  return (
    <section className="card" aria-labelledby="user-title">
      <h1 id="user-title">Tu código de invitación</h1>
      <p>Compártelo solo con las personas de confianza que quieres que vean tu ubicación durante una alerta.</p>
      <p className="invite-code" aria-label={`Código: ${user.invite_code.split("").join(" ")}`}>{user.invite_code}</p>
      <h2>¿Cómo activo una alerta?</h2>
      <p>Abre la app móvil Ruta Segura con esta misma cuenta y toca tres veces seguidas la pantalla. Sonará una alarma y tu ubicación se enviará cada 5 segundos hasta que pulses «Estoy a salvo».</p>
    </section>
  );
}
