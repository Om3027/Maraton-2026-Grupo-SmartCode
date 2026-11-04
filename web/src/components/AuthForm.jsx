import { useState } from "react";
import { api } from "../api.js";

const EMPTY = { email: "", password: "", full_name: "", phone: "", role: "guardian" };

export default function AuthForm({ onSession, onGuide }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      onSession(await api(`/auth/${mode}`, { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth" aria-labelledby="auth-title">
      <h1 id="auth-title">{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <form onSubmit={submit} noValidate>
        {isRegister && (
          <>
            <fieldset className="field">
              <legend>Tipo de cuenta</legend>
              <label className="radio">
                <input type="radio" name="role" value="guardian" checked={form.role === "guardian"} onChange={update} />
                Familiar (veo la ubicación durante una alerta)
              </label>
              <label className="radio">
                <input type="radio" name="role" value="user" checked={form.role === "user"} onChange={update} />
                Usuaria (activo alertas desde la app móvil)
              </label>
            </fieldset>
            <div className="field">
              <label htmlFor="full_name">Nombre completo</label>
              <input id="full_name" name="full_name" autoComplete="name" required value={form.full_name} onChange={update} />
            </div>
            <div className="field">
              <label htmlFor="phone">Teléfono (opcional)</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" aria-describedby="phone-help" value={form.phone} onChange={update} />
              <small id="phone-help" className="muted">Lo guardamos cifrado. Solo tú puedes verlo.</small>
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password" name="password" type="password" required
            autoComplete={isRegister ? "new-password" : "current-password"}
            aria-describedby={isRegister ? "password-help" : undefined}
            value={form.password} onChange={update}
          />
          {isRegister && <small id="password-help" className="muted">Mínimo 8 caracteres, con al menos una letra y un número.</small>}
        </div>
        {error && <p className="alert-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Un momento…" : isRegister ? "Crear cuenta" : "Entrar"}
        </button>
      </form>
      <button className="btn btn-link" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}>
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Créala aquí"}
      </button>
      <a className="btn btn-link" href="/guia" onClick={onGuide}>¿Cómo probar la app?</a>
    </section>
  );
}
