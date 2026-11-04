# Guía de la maratón: lo que se exige y cómo se evalúa

Todo en español. Este archivo explica las reglas de la competencia y lo que exige el ciclo **Profundización**. La infraestructura de Azure ya creada está en `CLAUDE.md` (léelo también). El problema a resolver y la idea de la solución los define la persona en su mensaje; no los inventes ni los cambies.

## Contexto
Maratón de programación con impacto social (LCUP/CCPL), Universidad de Cundinamarca, miércoles 4 de noviembre de 2026. Equipo de 3 estudiantes, ciclo **Profundización** (semestres 4 a 6). Se sortea un problema translocal alineado con un ODS. El software debe resolver ese problema.

## Cronograma
- 8:00 a 8:30: apertura y sorteo.
- **8:30 a 11:00: desarrollo del software y entrega de código fuente y documentación (2 h 30 min).**
- 11:00 a 13:00: sustentación de 10 minutos ante el jurado (más 5 minutos de preguntas), con grabación.
- Entrega tardía, plagio o uso de IA no declarado = **descalificación**.

## Requisitos técnicos obligatorios de Profundización
1. Aplicación web (o móvil) con **integración de al menos una API externa o de datos abiertos**.
2. **Arquitectura MVC o similar** (capas separadas), con documento de arquitectura y decisiones técnicas.
3. **Base de datos PostgreSQL** (ya creada en Azure).
4. **Autenticación y autorización** (JWT).
5. **Despliegue en la nube** (Azure, capa gratuita; ya configurado y con despliegue automático al hacer merge a `main`).
6. Solución con enfoque en **escalabilidad y sostenibilidad** para el ODS del problema sorteado.

## Nivel de exigencia (lo que más puntos da)
- **UX:** diseño centrado en la usuaria o el usuario, pruebas de usabilidad, **accesibilidad WCAG 2.1 AA** (contraste, foco visible, etiquetas, navegación por teclado, textos alternativos).
- **Seguridad:** autenticación robusta, **cifrado de datos sensibles**, protección contra **OWASP Top 10**, validación de todas las entradas, autorización por dueño, contraseñas con hash.
- **Usabilidad:** onboarding, ayuda contextual, eficiencia en las tareas clave, mensajes de error comprensibles.

## Rúbrica de evaluación
| Criterio | Peso |
|---|---|
| Cumplimiento de requerimientos (resuelve el problema sorteado y cumple las especificaciones del ciclo) | 30% |
| UX (intuitivo, atractivo, flujo lógico, accesibilidad) | 20% |
| Seguridad (autenticación, cifrado, validación, buenas prácticas) | 20% |
| Usabilidad (facilidad, curva de aprendizaje, eficiencia) | 15% |
| Uso ético de la IA (documentación, pertinencia, evaluación crítica; marco ético de la IA en Colombia, 2021) | 15% |

## Entregables (a las 11:00)
1. **Código fuente completo y ejecutable** en este repositorio, desplegado y funcionando en la URL pública de `CLAUDE.md`.
2. **`docs/ARQUITECTURA.md`** (máximo 5 páginas): problema y ODS, arquitectura en capas con diagrama, decisiones técnicas y por qué, modelo de datos, API externa usada, seguridad, despliegue y CI/CD en Azure, limitaciones y trabajo futuro.
3. **`docs/USO_IA.md`**: herramientas de IA usadas (Claude Code y el modelo), prompts relevantes, qué se aceptó, modificó o rechazó, evaluación crítica (errores o alucinaciones corregidos, sesgos, privacidad, dependencia) y cómo se aplicó el marco ético de la IA en Colombia (2021): transparencia, privacidad, no discriminación, responsabilidad humana. Declarar también que el `CLAUDE.md` y la infraestructura de Azure se prepararon antes del evento, y que el código de la solución se desarrolló durante la maratón.
4. **Guion de la sustentación de 10 minutos**: problema y ODS, demostración funcional paso a paso, decisiones técnicas, seguridad y accesibilidad, uso de IA, impacto y limitaciones.

## Cómo trabajar dentro del tiempo
- Empieza por un esqueleto mínimo y **despliega a `main` en los primeros 30 minutos** para confirmar que Azure responde; después agrega funcionalidades por etapas.
- Cada funcionalidad: rama, `pytest` en verde, Pull Request y merge a `main`. Comprueba el despliegue (pestaña Actions y la URL pública) antes de seguir.
- Prioriza lo que puntúa: que lo central funcione de punta a punta, seguridad básica bien hecha, accesibilidad y documentos. Nada de funcionalidades de relleno.
- A partir de las 10:45 no hagas cambios grandes; usa los últimos minutos para pruebas, documentos y despliegue final.
- Registra el uso de IA en `docs/USO_IA.md` mientras trabajas, no al final.

## NOTA IMPORTANTE
La arquitectura de Azure vigente y el stack final (monorepo con Flask, React y Expo) están en `CLAUDE.md`, que manda sobre lo que aparece abajo. Lo de abajo (FastAPI, `app/main.py` en la raíz) fue el diseño inicial y queda solo como contexto.

## Arquitectura de Azure (ya creada; no la recrees ni la cambies)
Esta infraestructura es REAL y está funcionando. Tú solo escribes el código de la aplicación.

### Mapa de recursos (suscripción Azure for Students, región Spain Central)
- Grupo de recursos: `rg-maraton` (contiene todo lo siguiente).
- Base de datos: Azure Database for PostgreSQL servidor flexible `smartcode-maraton-db`
  - Host: `smartcode-maraton-db.postgres.database.azure.com`, puerto 5432, PostgreSQL 16.
  - Usuario administrador: `maratonadmin`. La contraseña NO está en este repositorio.
  - Base de datos de la maratón: `maraton` (vacía; la app crea sus tablas). La base `postgres` es de práctica; no usarla.
  - Firewall: solo permite servicios de Azure. Desde un PC local NO hay acceso directo a esta base, por eso en local se usa SQLite.
- App Service (Linux, Python 3.12): `smartcode-maraton-app`, plan `ASP-rgmaraton-a4c0` (F1 gratis: 1 GB de RAM, 60 min de CPU al día, 165 MB de datos salientes al día; se duerme tras unos 20 minutos sin visitas y la primera carga tarda).
- URL pública: https://smartcode-maraton-app-c7f9asg3badvf8fr.spaincentral-01.azurewebsites.net
- Comando de inicio configurado: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
  (el nombre `app.main:app` y el puerto 8000 no se pueden cambiar).
- Variables de entorno ya cargadas en la app de Azure:
  - `DATABASE_URL` (conexión completa a `maraton`, con SSL), `SECRET_KEY` (llave para firmar JWT),
  - `SCM_DO_BUILD_DURING_DEPLOYMENT=1` (Azure instala `requirements.txt` al desplegar).
- Despliegue continuo: Centro de implementación de Azure conectado a este repositorio, rama `main`, con GitHub Actions
  (archivo `.github/workflows/main_smartcode-maraton-app.yml`, creado por Azure; no editarlo ni borrarlo).
  Cada push o merge a `main` compila y despliega en 2 a 3 minutos.
- Tú (Claude Code) no tienes acceso al portal de Azure ni a la base de datos. Si algo exige cambiar Azure (variables, plan, firewall), díselo a la persona con los pasos exactos.

### Stack que encaja con esa infraestructura
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2 + psycopg 3. Entrada: `app/main.py` con `app = FastAPI()`.
- Frontend: HTML/CSS/JS en `app/static/`, servido por la misma app en `/`. Sin Node ni build aparte.
- Login: JWT (`SECRET_KEY`), contraseñas con bcrypt. Pruebas: pytest en `tests/`.
- `requirements.txt` en la raíz, con fastapi, uvicorn, sqlalchemy, "psycopg[binary]", pyjwt, bcrypt, python-multipart (más lo que uses).

### Variables de entorno en el código
- Leer `DATABASE_URL` y `SECRET_KEY` solo con `os.environ`. Nunca escribir sus valores en el código.
- `DATABASE_URL` llega como `postgresql://...`: cambiar el prefijo a `postgresql+psycopg://` antes de `create_engine` (lo mismo con `postgres://`). Usar `pool_pre_ping=True`. No quitar `sslmode=require`.
- Si no existe `DATABASE_URL` (PC local), usar SQLite (`sqlite:///./local.db`) y una `SECRET_KEY` de desarrollo.
- Crear las tablas al arrancar con `Base.metadata.create_all(engine)`.

### Reglas para que NO falle en Azure
- Estructura obligatoria: `app/main.py`, `app/static/`, `requirements.txt` en la raíz.
- Linux distingue mayúsculas en nombres de archivos.
- Archivos estáticos con `Path(__file__).parent`. El frontend llama a la API con rutas relativas (`/api/...`), nunca `http://localhost`.
- No usar `--reload` ni arrancar uvicorn desde el código.
- Disco efímero: no guardar datos ni archivos subidos en el disco ni en SQLite dentro de Azure; todo dato va a PostgreSQL.
- Plan gratuito: evitar librerías pesadas (pandas, numpy, torch...) salvo que sea imprescindible.
- Solo paquetes con ruedas para Python 3.12 (`psycopg[binary]`, no `psycopg2`).
- Logs por consola (stdout). `GET /health` debe responder `{"status":"ok"}` rápido y sin tocar la base.
- Nunca subir contraseñas, llaves ni archivos `.env`.

### Si un despliegue sale en rojo
1. Pestaña Actions de GitHub: ver el paso que falló.
2. Azure: app, Centro de implementación, Registros; y Supervisión, Secuencia de registro.
3. Causas típicas: falta `requirements.txt`, `app.main:app` cambiado, o un paquete que no instala en Python 3.12.
