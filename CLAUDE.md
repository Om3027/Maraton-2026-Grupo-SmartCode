# Proyecto Maratón - Grupo SmartCode

Responde siempre en español en el chat. Este archivo describe la infraestructura REAL que ya está creada en Azure y las reglas del proyecto. No recrees ni cambies la infraestructura: tú escribes el código de la aplicación.

## Mapa de Azure (suscripción Azure for Students, región Spain Central)
- Grupo de recursos: `rg-maraton` (contiene todo lo siguiente).
- Base de datos: Azure Database for PostgreSQL servidor flexible `smartcode-maraton-db`
  - Host: `smartcode-maraton-db.postgres.database.azure.com`, puerto 5432, PostgreSQL 16.
  - Usuario administrador: `maratonadmin`. La contraseña NO está en este repositorio.
  - Base de datos de la maratón: `maraton` (vacía; la app crea sus tablas). La base `postgres` es de práctica; no usarla.
  - Firewall: solo permite servicios de Azure. Desde un PC local NO hay acceso directo a esta base, por eso en local se usa SQLite.
- App Service (Linux, Python 3.12): `smartcode-maraton-app`, plan `ASP-rgmaraton-a4c0` (F1 gratis: 1 GB de RAM, 60 min de CPU al día, 165 MB de datos salientes al día; se duerme tras unos 20 minutos sin visitas).
- URL pública: https://smartcode-maraton-app-c7f9asg3badvf8fr.spaincentral-01.azurewebsites.net
- Comando de inicio: hoy es `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000` (pensado para FastAPI). Como la API será Flask, la persona lo cambiará en el portal a:
  `gunicorn --bind=0.0.0.0:8000 --workers 1 --threads 4 app.main:app`
  Por eso `api/app/main.py` debe exponer la variable `app` (instancia de Flask) y `gunicorn` debe estar en `requirements.txt`.
- Variables de entorno ya cargadas en Azure:
  - `DATABASE_URL` (conexión completa a `maraton`, con SSL), `SECRET_KEY` (llave para JWT y cifrado),
  - `SCM_DO_BUILD_DURING_DEPLOYMENT=1` (Azure instala `requirements.txt` al desplegar).
- Despliegue continuo: Centro de implementación de Azure conectado a este repositorio, rama `main`, con GitHub Actions
  (archivo `.github/workflows/main_smartcode-maraton-app.yml`, creado por Azure). Cada push o merge a `main` compila y despliega en 2 a 3 minutos.
  Como el repositorio es un monorepo con React, SE PERMITE editar ese archivo para: compilar `web/` con Node 20 (`npm ci && npm run build`), copiar `web/dist` a `api/app/static` y desplegar solo el contenido de `api/`. Conserva el paso de despliegue y el secreto de publicación que ya usa.
- Tú (Claude Code) no tienes acceso al portal de Azure ni a la base de datos. Si algo exige cambiar Azure (variables, plan, firewall, comando de inicio), díselo a la persona con los pasos exactos.

## Estructura y stack (monorepo)
- `api/`: Python 3.12 + Flask + SQLAlchemy + psycopg 3. Arquitectura MVC (models, controllers como blueprints, views/serializers, services). Entrada `api/app/main.py` con `app`. `requirements.txt` dentro de `api/`.
- `web/`: React + Vite. En producción se sirve desde la misma App Service (carpeta estática de la API) y consume `/api/...` con rutas relativas.
- `mobile/`: Expo (React Native), luego APK con EAS al final.
- Pruebas de la API con pytest en `api/tests/`.

## Variables de entorno en el código
- Leer `DATABASE_URL` y `SECRET_KEY` solo con `os.environ`. Nunca escribir sus valores en el código.
- `DATABASE_URL` llega como `postgresql://...`: cambiar el prefijo a `postgresql+psycopg://` antes de `create_engine` (lo mismo con `postgres://`). Usar `pool_pre_ping=True`. No quitar `sslmode=require`.
- Si no existe `DATABASE_URL` (PC local), usar SQLite (`sqlite:///./local.db`) y una `SECRET_KEY` de desarrollo.
- Crear las tablas al arrancar (`db.create_all()` o equivalente). No crear tablas a mano.
- La llave de Google Maps va en `VITE_GOOGLE_MAPS_API_KEY` (secreto de GitHub Actions, leída al compilar `web/`). Nunca en el código.

## Reglas para que NO falle en Azure
- Linux distingue mayúsculas en nombres de archivos.
- Archivos estáticos con rutas basadas en `Path(__file__).parent`. El frontend llama a la API con rutas relativas, nunca `http://localhost`.
- No usar el servidor de desarrollo de Flask ni `debug=True` en producción; Azure usa gunicorn.
- Disco efímero: no guardar datos ni archivos en el disco de la app. Todo dato va a PostgreSQL.
- Plan gratuito: evitar librerías pesadas. La ubicación en vivo se hace con sondeo (polling) cada 5 s, no con WebSockets, y con consultas livianas para no agotar la CPU diaria.
- Solo paquetes de Python con ruedas para 3.12 (`psycopg[binary]`, no `psycopg2`).
- Logs por consola (stdout). `GET /api/health` debe responder `{"status":"ok"}` rápido y sin tocar la base.
- Nunca subir contraseñas, llaves ni archivos `.env`.

## Idioma y calidad del código (obligatorio)
- Código, comentarios, nombres de variables, funciones, tablas y campos de la API, README y mensajes de commit: en inglés.
- Textos que ve la persona usuaria (interfaces web y móvil, mensajes de error mostrados): en español.
- Sin relleno: nada de código inventado "por si acaso", comentarios obvios, funciones o archivos sin uso, ni dependencias sin usar.
- Antes de escribir, lee lo que existe y reutilízalo; no dupliques lógica. Funciones cortas, una responsabilidad cada una.
- Buenas prácticas: validar todas las entradas, códigos HTTP correctos (400, 401, 403, 404), no tragarse excepciones, sin `print` de depuración.
- MVC estricto: los controladores no consultan la base directamente; la lógica de negocio vive en servicios.
- Después de cada funcionalidad: correr `pytest` y revisar lo escrito (¿sobra algo? ¿se puede simplificar?) antes del commit.

## Flujo de trabajo
- Commits convencionales y pequeños (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`).
- Trabajar en ramas y unir a `main` con Pull Request solo cuando el paso funcione y `pytest` pase; `main` despliega solo, no dejarlo roto.
- Registrar en `docs/USO_IA.md` los prompts relevantes y qué se aceptó, modificó o rechazó.

## Si un despliegue sale en rojo
1. Pestaña Actions de GitHub: ver el paso que falló.
2. Azure: app, Centro de implementación, Registros; y Supervisión, Secuencia de registro.
3. Causas típicas: falta `requirements.txt` dentro de `api/`, `app.main:app` cambiado, comando de inicio sin cambiar a gunicorn, o un paquete que no instala en Python 3.12.
