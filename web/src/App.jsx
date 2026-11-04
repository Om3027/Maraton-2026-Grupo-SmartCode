import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";
import AuthForm from "./components/AuthForm.jsx";
import GuardianDashboard from "./components/GuardianDashboard.jsx";
import Onboarding from "./components/Onboarding.jsx";
import TestGuide from "./components/TestGuide.jsx";
import UserHome from "./components/UserHome.jsx";

const ONBOARDING_KEY = "rs_onboarding_done";
const GUIDE_PATH = "/guia";

function onboardingDone() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [showOnboarding, setShowOnboarding] = useState(!onboardingDone());
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  function navigate(event) {
    event.preventDefault();
    const to = event.currentTarget.getAttribute("href");
    window.history.pushState(null, "", to);
    setPath(to);
    document.getElementById("main")?.focus();
  }

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function handleSession(session) {
    setToken(session.token);
    setUser(session.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function finishOnboarding() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* private mode: onboarding will show again next visit */
    }
    setShowOnboarding(false);
  }

  let content;
  if (path === GUIDE_PATH) content = <TestGuide onBack={navigate} />;
  else if (loading) content = <p role="status">Cargando…</p>;
  else if (showOnboarding) content = <Onboarding onFinish={finishOnboarding} />;
  else if (!user) content = <AuthForm onSession={handleSession} onGuide={navigate} />;
  else if (user.role === "guardian") content = <GuardianDashboard />;
  else content = <UserHome user={user} />;

  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <span className="brand" aria-hidden="true">🛡️</span>
          <span className="brand-name">Ruta Segura</span>
          <a className="btn btn-link" href={GUIDE_PATH} onClick={navigate}>¿Cómo probar la app?</a>
          {user && (
            <div className="topbar-user">
              <span className="muted">Hola, {user.full_name}</span>
              <button className="btn btn-secondary" onClick={logout}>Cerrar sesión</button>
            </div>
          )}
          {!user && !showOnboarding && (
            <button className="btn btn-link" onClick={() => setShowOnboarding(true)}>¿Cómo funciona?</button>
          )}
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        {content}
      </main>
    </>
  );
}
