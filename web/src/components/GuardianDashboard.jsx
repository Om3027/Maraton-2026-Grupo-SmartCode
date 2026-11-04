import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import LiveView from "./LiveView.jsx";

export default function GuardianDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState({ text: "", error: false });

  const loadUsers = useCallback(async () => {
    const data = await api("/links");
    setUsers(data.users);
    setSelectedId((current) => current ?? data.users[0]?.id ?? null);
  }, []);

  useEffect(() => {
    loadUsers().catch((err) => setMessage({ text: err.message, error: true }));
  }, [loadUsers]);

  async function link(event) {
    event.preventDefault();
    try {
      const user = await api("/links", { method: "POST", body: { invite_code: code } });
      setCode("");
      setMessage({ text: `Listo. Ya estás vinculado o vinculada con ${user.full_name}.`, error: false });
      setSelectedId(user.id);
      await loadUsers();
    } catch (err) {
      setMessage({ text: err.message, error: true });
    }
  }

  return (
    <div className="dashboard">
      <aside className="card" aria-labelledby="people-title">
        <h1 id="people-title">Personas que cuidas</h1>
        {users.length === 0 && <p className="muted">Todavía no tienes personas vinculadas. Pídele su código de invitación.</p>}
        <ul className="people">
          {users.map((u) => (
            <li key={u.id}>
              <button
                className={`person ${u.id === selectedId ? "selected" : ""}`}
                aria-pressed={u.id === selectedId}
                onClick={() => setSelectedId(u.id)}
              >
                <span>{u.full_name}</span>
                {u.has_active_alert && <span className="badge badge-danger">Alerta activa</span>}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={link} className="link-form">
          <label htmlFor="invite_code">Vincular con código de invitación</label>
          <div className="row">
            <input
              id="invite_code" value={code} maxLength={8} autoComplete="off" aria-describedby="invite-help"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button className="btn btn-primary" type="submit">Vincular</button>
          </div>
          <small id="invite-help" className="muted">Son 8 letras o números. Ella lo ve en su cuenta.</small>
        </form>
        {message.text && (
          <p className={message.error ? "alert-error" : "alert-ok"} role={message.error ? "alert" : "status"}>{message.text}</p>
        )}
      </aside>
      {selectedId && <LiveView userId={selectedId} />}
    </div>
  );
}
