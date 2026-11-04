# Uso de Inteligencia Artificial (declaración, artículo 8)

## Declaración
- **Herramienta:** Claude Code (extensión de VS Code), modelo **Claude Opus 5.5** (`claude-opus-5-5`) de Anthropic.
- **Preparado antes del evento:** el archivo `CLAUDE.md` (reglas del proyecto e infraestructura) y la infraestructura de Azure (App Service, PostgreSQL, GitHub Actions). También `docs/GUIA_MARATON.md`, que resume las reglas de la competencia.
- **Desarrollado durante la maratón (4 de noviembre de 2026):** todo el código de la aplicación (`api/`, `web/`, `mobile/`) y la documentación de `docs/`.
- La IA generó código y borradores. El equipo revisó, probó y decidió qué entraba al repositorio, y es responsable del resultado.

## Registro de prompts (se llena durante el trabajo)

| Hora | Prompt (resumen) | Resultado | Decisión del equipo |
|---|---|---|---|
| 9:05 | Prompt inicial: proyecto "Ruta segura para mujeres en el espacio público nocturno" (ODS 5, 11 y 16), stack (Flask MVC, React + Vite, Expo, PostgreSQL), niveles de funcionalidad, requisitos de seguridad OWASP, UX y WCAG. Se pidió un plan de máximo 20 líneas antes de escribir código. | Plan en 6 fases con sus commits. | **Aceptado.** |
| 9:11 | Ajuste del cronograma a la hora real: Fase 0 directo a `main`, borrador de ARQUITECTURA después de la API, móvil hasta las 10:45, primer despliegue antes de las 9:40. | Plan reprogramado. | **Modificado por el equipo** (tiempos). |
| 9:15 | (Continuación del plan) Esqueleto Flask + Vite y adaptación del workflow de Azure para el monorepo. | API con `/api/health`, web mínima y CI que compila `web/`, corre `pytest` y despliega solo `api/`. Primer despliegue en verde a las 9:20. | **Aceptado.** Se revisó que se conservaran el paso de despliegue y el secreto de publicación. |
| 9:21 | (Continuación del plan) API del nivel 1: roles, JWT, código de invitación, alertas, puntos cifrados, estado "señal perdida", protecciones OWASP y una prueba por protección. | Modelos, servicios, controladores y 36 pruebas en verde. | **Aceptado con ajustes:** el JWT dura 60 min y no 15, para que una alerta activa no se corte por vencimiento del token (queda registrado como decisión). Un primer intento de la IA de crear los archivos con un script de bash falló por un error de comillas; se rehizo archivo por archivo. |
| 9:24 | (Continuación del plan) Portal web: login, registro, onboarding de 3 pasos, vínculo por código, mapa en vivo con Leaflet + Nominatim, sondeo de 5 s, aviso "Señal perdida" y cambio a Google Maps si existe la llave. | Portal React accesible, verificado en un navegador sin interfaz (headless) con datos de prueba. | **Aceptado con corrección:** la IA había puesto en la CSP `*.tile.openstreetmap.org`, pero hoy las teselas se sirven desde `tile.openstreetmap.org`, sin subdominio. Lo detectó la misma revisión y se corrigió antes del merge. Nominatim se consulta como máximo cada 15 s para respetar su política de uso. |
| 9:31 | (Continuación del plan) App móvil Expo: login, SOS con 3 toques, alarma a volumen máximo del reproductor, envío de ubicación cada 5 s y botón para detener. | App con onboarding, SOS, alarma en bucle, "Silenciar alarma" (la ubicación se sigue enviando) y "Estoy a salvo" (cierra la alerta). | **Aceptado con verificación:** Expo SDK 58 es más nuevo que el conocimiento de entrenamiento del modelo, así que se revisaron las firmas reales de `expo-audio` y `expo-location` en `node_modules` antes de escribir código, en lugar de confiar en la memoria del modelo. Se reemplazó `SafeAreaView` de React Native, que está obsoleto. El sonido de la alarma se generó por código (onda cuadrada) para evitar problemas de licencia. |
| 9:40 | (Automático) La revisión de seguridad de Claude Code marcó que `POST /api/links` permitía adivinar códigos de invitación por fuerza bruta (8 caracteres, unos 40 bits, sin límite de intentos). | Se propuso un límite de intentos, códigos más largos o de un solo uso, y que la usuaria apruebe cada vínculo. | **Aceptado en parte:** se agregó un límite de 5 intentos por minuto y 30 por día, con su prueba. La aprobación explícita del vínculo y la revocación quedan como trabajo futuro por tiempo. Es un error de diseño que la IA introdujo en su primera versión y que su propia revisión detectó. |

## Evaluación crítica
_(se completa al cierre)_

## Marco ético de la IA en Colombia (2021)
_(se completa al cierre)_
