# Uso de Inteligencia Artificial (declaración, artículo 8)

## Declaración
- **Integrantes responsables:** Brian Mauricio Aldana Sánchez, Zamuel David Murcia Tangarife y Omar Bravo Montaña.
- **Herramienta:** Claude Code (extensión de VS Code), modelo **Claude Opus 5.5** (`claude-opus-5-5`) de Anthropic.
- **Preparado antes del evento:** el archivo `CLAUDE.md` (reglas del proyecto e infraestructura) y la infraestructura de Azure (App Service, PostgreSQL, GitHub Actions). También `docs/GUIA_MARATON.md`, que resume las reglas de la competencia.
- **Desarrollado durante la maratón (4 de noviembre de 2026):** todo el código de la aplicación (`api/`, `web/`, `mobile/`) y la documentación de `docs/`.
- La IA generó código y borradores. El equipo revisó, probó y decidió qué entraba al repositorio, y es responsable del resultado.

## Registro de prompts

| Hora | Prompt | Resultado | Decisión del equipo |
|---|---|---|---|
| 9:05 | Prompt inicial: proyecto "Ruta segura para mujeres en el espacio público nocturno" (ODS 5, 11 y 16), stack (Flask MVC, React + Vite, Expo, PostgreSQL), niveles de funcionalidad, requisitos de seguridad OWASP, UX y WCAG. Se pidió un plan de máximo 20 líneas antes de escribir código. | Plan en 6 fases con sus commits. | **Aceptado.** |
| 9:11 | Ajuste del cronograma a la hora real: Fase 0 directo a `main`, borrador de ARQUITECTURA después de la API, móvil hasta las 10:45, primer despliegue antes de las 9:40. | Plan reprogramado. | **Modificado por el equipo** (tiempos). |
| 9:50 | Error en el teléfono: al activar el SOS el volumen bajó y no sonó nada. Se pidió depurarlo con `expo-av` (`setAudioModeAsync`), `react-native-volume-manager` para poner el volumen al máximo, vibración de respaldo y logs temporales. | Se revisó el código fuente de `expo-audio` en Android: pausa el reproductor cuando pierde el foco de audio, y el código anterior ignoraba en silencio los errores del modo de audio. | **Modificado:** no se usó `expo-av` porque fue retirado del SDK de Expo (este proyecto usa el SDK 58); se aplicaron las opciones equivalentes de `expo-audio`. Se aceptaron `react-native-volume-manager` (solo funciona en un build de desarrollo o APK, no en Expo Go), la vibración continua de respaldo, la reanudación automática si el sistema pausa la alarma y los logs `[alarm]`. |
| 10:14 | La app se cerraba al abrir en Expo Go con el error "react-native-volume-manager doesn't seem to be linked". El equipo diagnosticó que el import de arriba del archivo cargaba el módulo nativo y pidió cargarlo de forma diferida. | `require()` diferido, solo si existe `NativeModules.VolumeManager`. | **Error de la IA, corregido por el equipo:** la IA había afirmado que el `try/catch` alrededor de las llamadas bastaba para Expo Go, sin probarlo en un teléfono. El paquete falla apenas se importa. El equipo confirmó en su teléfono que la alarma suena y la app abre, y después se quitaron los logs temporales. |
| 10:20 | Quitar los logs temporales, fusionar la corrección, preparar el APK con EAS (perfil `preview`) y terminar los documentos, el guion y la plantilla de usabilidad. | `eas.json`, permisos de Android mínimos y documentos en español. | **Aceptado.** El equipo lanza el build con su propia cuenta de Expo. |
| 10:40 | Dos errores en la demo de punta a punta: el portal no se actualizaba solo y, en Expo Go, la alarma bajaba el volumen y no sonaba. | Portal: un bucle de sondeo que se reprograma solo y sobrevive a errores, `Cache-Control: no-store` en la API, `fetch` con `cache: "no-store"`, un parámetro anti-caché y la etiqueta "Última actualización". Alarma: se confirmó en el código de `expo-audio` que siempre usa el canal multimedia. | **Aceptado.** El problema del volumen en Expo Go se documentó como limitación con un límite de 5 minutos para intentarlo: el APK es la versión pensada para subir el volumen y la vibración es el aviso garantizado. Un hallazgo anterior ("la alarma funciona") no se cumplía en todos los casos, lo que confirma que hay que probar en el dispositivo real. |
| 10:45 | Registro en la app móvil para el rol de usuaria (nombre, correo y contraseña con validación) y enlace "¿Eres familiar? Regístrate en el portal web" que usa la misma URL base que la API. | Pantalla `RegisterScreen`, que inicia sesión al terminar y muestra el código de invitación, y el enlace con `Linking.openURL(BASE_URL)`. | **Aceptado.** Sin módulos nativos nuevos. Se probó el endpoint contra Azure (registro válido y correo duplicado). |
| 10:55–11:08 | Selector de tipo de cuenta (Usuaria o Familiar) en el registro móvil, pantalla de inicio del familiar en la app (vincular con código, lista de personas, sondeo de 5 s, "Señal perdida", "Abrir en Google Maps") y enrutamiento por rol. | `GuardianHomeScreen` y `RegisterScreen` con selector de rol accesible (`radiogroup`). El bundle compila y las 38 pruebas de ese momento pasan. | **Aceptado por decisión del equipo.** La IA detuvo el trabajo a las 11:02 porque se había pasado el límite de tiempo y la hora de entrega, y no hizo merge sin autorización. El equipo decidió explícitamente terminarlo y fusionarlo después de las 11:00, y queda registrado así por transparencia. Las pantallas no las probó la IA en un dispositivo; las prueba el equipo en Expo Go. |
| 11:30 | Página pública `/guia` ("¿Cómo probar la app?") en el portal, sin iniciar sesión: qué es Ruta Segura, opción A con el APK (enlace configurable en `APK_URL`), opción B con Expo Go y botones para copiar comandos, flujo completo y aviso de que la alerta solo se activa desde la app. Enlace desde el login web, el encabezado y el login móvil. | `TestGuide.jsx`, `config.js`, enrutamiento sin librerías nuevas y una prueba de pytest para `/guia` y `/api/health`. Fusionado en el PR #15. | **Aceptado.** Las 39 pruebas pasan. Se revisó en un navegador sin interfaz a 375 px de ancho (orden de encabezados, sin desbordamiento horizontal, sin errores de consola) y en Azure. El botón del APK queda en «Próximamente» hasta que el equipo publique el build. |

## Evaluación crítica

**Errores y alucinaciones detectados y corregidos**
1. **Import de un módulo nativo en Expo Go:** la IA afirmó que bastaba un `try/catch` alrededor de las llamadas a `react-native-volume-manager`. Era falso: el paquete falla apenas se importa y la app se cerraba al abrir. Lo detectó el equipo en el teléfono. *Lección: una afirmación de la IA sobre comportamiento nativo no vale hasta probarla en el dispositivo.*
2. **API obsoleta en las instrucciones:** el prompt del equipo pedía `expo-av`, que ya no existe en el SDK 58. La IA lo detectó al revisar `node_modules` y usó `expo-audio`.
3. **CSP con un dominio inexacto** (`*.tile.openstreetmap.org`): se corrigió antes del merge.
4. **Diseño inseguro inicial:** el vínculo por código de invitación no tenía límite de intentos. Lo marcó la revisión automática de seguridad y se corrigió con una prueba.
5. **Conocimiento desactualizado:** Expo SDK 58 es posterior a los datos de entrenamiento del modelo. Para no depender de la memoria del modelo, se leyeron los tipos (`.d.ts`) y el código nativo de las librerías instaladas.

**Verificación humana:** cada cambio pasó por `pytest` (39 pruebas al cierre) en local y en CI antes de desplegar. El portal se revisó en un navegador y la app en un teléfono real. Después de la Fase 0 (que se subió directo a `main` por decisión del equipo), ningún cambio llegó a `main` sin Pull Request.

**Sesgos:** la app supone que la usuaria tiene un smartphone, datos móviles y alfabetización digital. Eso puede excluir a mujeres en situación de mayor vulnerabilidad económica. Los textos se escribieron con lenguaje cuidadoso y no culpabilizante, y el rol de familiar se pensó sin suponer el género de quien cuida.

**Privacidad:** a la IA no se le dieron contraseñas, la `DATABASE_URL` ni la `SECRET_KEY`; solo se usan variables de entorno. No se usaron datos personales reales: las cuentas de prueba son ficticias. La ubicación se cifra en reposo y solo la ven los familiares vinculados. Advertencia: el portal envía las coordenadas a Nominatim (OpenStreetMap) para obtener la dirección. Es un tercero, y se documenta como limitación.

**Dependencia:** la IA aceleró el trabajo repetitivo (estructura, pruebas, estilos), pero las decisiones de producto fueron del equipo: el gesto de 3 toques, "Silenciar alarma" separado de "Estoy a salvo" y los 30 s para "Señal perdida". También el diagnóstico del error de Expo Go. El equipo puede explicar y mantener cada capa sin la IA.

## Marco ético de la IA en Colombia (2021)
| Principio | Cómo se aplicó |
|---|---|
| **Transparencia y explicación** | Se declara la herramienta, el modelo y cada prompt relevante con lo que se aceptó, se modificó o se rechazó. Los commits llevan la línea `Co-Authored-By` de la IA. |
| **Privacidad** | Datos mínimos (no se pide documento de identidad), cifrado del teléfono y las coordenadas, ubicación solo durante una alerta y solo para familiares vinculados, y sin secretos en el repositorio ni en los prompts. |
| **Control humano y responsabilidad** | El equipo aprobó el plan antes de que se escribiera código, revisó cada PR y probó en dispositivos. La responsabilidad del software es del equipo, no de la IA. |
| **Seguridad** | OWASP Top 10 con una prueba por protección, y revisión automática de seguridad atendida. |
| **No discriminación e inclusión** | Accesibilidad WCAG 2.1 AA (contraste, foco visible, etiquetas, botones grandes, lector de pantalla) y lenguaje claro en español. |
| **Beneficio social** | La herramienta atiende un problema de violencia de género en el espacio público (ODS 5, 11 y 16). |
