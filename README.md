# Ruta Segura — Maraton 2026 (Grupo SmartCode)

Panic-alert system for women in nocturnal public space (SDG 5, 11, 16). Three quick taps on the SOS button play a loud alarm and share live location every 5 s with linked relatives, who follow it on a web portal (with a "signal lost" badge after 30 s without data).

**Live:** https://smartcode-maraton-app-c7f9asg3badvf8fr.spaincentral-01.azurewebsites.net

| Folder | Stack |
|---|---|
| `api/` | Python 3.12, Flask (MVC: models, views, controllers, services), SQLAlchemy, PostgreSQL on Azure / SQLite locally |
| `web/` | React + Vite guardian portal, Leaflet + OpenStreetMap + Nominatim (Google Maps if `VITE_GOOGLE_MAPS_API_KEY` is set) |
| `mobile/` | Expo (SDK 58) app with the SOS trigger |
| `docs/` | Architecture, AI usage, pitch and usability test (Spanish) |

## Run locally
```bash
# API (http://127.0.0.1:5000)
cd api
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # .venv/bin/pip on macOS/Linux
.venv/Scripts/python -m pytest -q
.venv/Scripts/python -m flask --app app.main run

# Web portal (http://localhost:5173, proxies /api to the local API)
cd web && npm ci && npm run dev

# Mobile (Expo Go; uses the Azure API unless EXPO_PUBLIC_API_URL is set)
cd mobile && npm ci && npx expo start
```

## Deploy
Every merge to `main` runs `.github/workflows/main_smartcode-maraton-app.yml`: builds `web/`, copies it into `api/app/static`, runs pytest and deploys `api/` to Azure App Service (`gunicorn app.main:app`). Android APK: `cd mobile && eas build -p android --profile preview`.
