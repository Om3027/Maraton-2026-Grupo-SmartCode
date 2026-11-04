# Sustentación (10 minutos + 5 de preguntas)

**Roles:** Integrante 1 (presenta y conduce), Integrante 2 (demo móvil, con el teléfono), Integrante 3 (demo del portal y la parte técnica). Reemplacen los nombres antes de presentar.

## Preparación (antes de entrar)
- Abrir la URL pública 5 minutos antes para "despertar" el plan F1, que tarda en la primera carga: https://smartcode-maraton-app-c7f9asg3badvf8fr.spaincentral-01.azurewebsites.net
- Cuentas de demo ya creadas y vinculadas: **usuaria** (en el teléfono, con el APK o Expo Go) y **familiar** (en el portal, en el portátil proyectado).
- Teléfono con volumen multimedia alto, GPS encendido y datos móviles. La app ya abierta con la sesión iniciada.
- Plan B: video corto grabado de la demo, por si falla la red del auditorio.
- **No hacer merge a `main` durante la sustentación:** cada despliegue reinicia la app y el portal muestra errores 502 durante unos segundos.

## Diapositivas y guion

| Min | Diapositiva | Quién | Qué se dice |
|---|---|---|---|
| 0:00–1:00 | **1. El problema** | Integrante 1 | De noche, en un paradero o una calle sola, pedir ayuda exige desbloquear el teléfono, abrir una app y escribir. No hay tiempo. ODS 5 (igualdad de género), 11 (ciudades seguras) y 16 (paz y justicia). |
| 1:00–1:45 | **2. La solución: Ruta Segura** | Integrante 1 | Tres toques activan una alarma fuerte y envían la ubicación cada 5 s. La familia la ve en vivo en un portal web. Si el teléfono se queda sin señal, el portal muestra el último lugar conocido, su hora y el aviso "Señal perdida". |
| 1:45–5:15 | **3. Demo en vivo** | Integrantes 2 y 3 | Ver el guion de la demo abajo. |
| 5:15–6:45 | **4. Arquitectura** | Integrante 3 | Diagrama MVC: Flask (modelos, vistas, controladores y servicios), React, Expo y PostgreSQL en Azure. CI/CD: cada PR corre 37 pruebas y despliega solo. APIs externas: Google Maps JavaScript API para el mapa (con OpenStreetMap y Leaflet como respaldo sin llave) y Nominatim para la dirección. Disparador de 3 toques, porque Expo no puede leer el botón de encendido. |
| 6:45–7:45 | **5. Seguridad y accesibilidad** | Integrante 3 | JWT, bcrypt, teléfono y coordenadas cifrados con Fernet, autorización por dueño y por vínculo, límite de intentos (login y códigos), CSP y cabeceras, una prueba por cada riesgo OWASP. WCAG 2.1 AA: contraste, foco visible, etiquetas, botones grandes, lector de pantalla y onboarding de 3 pasos. |
| 7:45–8:45 | **6. Uso ético de la IA** | Integrante 1 | Claude Code (Claude Opus 5.5). Todo prompt registrado. Errores de la IA que el equipo detectó (el módulo nativo que cerraba la app, `expo-av` retirado, la CSP, el código adivinable). Marco ético colombiano 2021: transparencia, privacidad, control humano. |
| 8:45–10:00 | **7. Impacto, limitaciones y cierre** | Integrante 1 | Costo casi cero (F1 y mapas abiertos), lo pueden adoptar alcaldías y universidades. Limitaciones: solo primer plano, botón físico y aprobación de vínculos (trabajo futuro). Cierre: "Tres toques pueden ser la diferencia." |

## Guion de la demo (3 min 30 s, pasos exactos)
1. **(Integrante 3, portal)** Mostrar el portal: login como **familiar**. Señalar que la persona vinculada aparece sin alerta activa. *(20 s)*
2. **(Integrante 3)** Abrir "¿Qué significan estos estados?" para mostrar la ayuda contextual. *(15 s)*
3. **(Integrante 2, teléfono)** Mostrar la pantalla principal con el botón SOS y el código de invitación. Tocar SOS una vez: "Toca 2 veces más". Explicar que esto evita activaciones accidentales. *(20 s)*
4. **(Integrante 2)** Completar los 3 toques: suena la alarma, vibra y la pantalla se pone roja ("Alerta activa"). *(15 s)*
5. **(Integrante 3)** En el portal, en menos de 5 s aparecen la etiqueta **"Alerta activa: en vivo"**, el mapa con el punto, la dirección de Nominatim y la hora. *(30 s)*
6. **(Integrante 2)** Pulsar **"Silenciar alarma"**: la ubicación se sigue enviando (la hora del portal sigue avanzando). *(20 s)*
7. **(Integrante 2)** Poner el teléfono en **modo avión**. **(Integrante 3)** Esperar unos 30 s mientras Integrante 1 explica por qué: el portal muestra **"⚠ Señal perdida"** con la última ubicación y su hora. *(45 s)*
8. **(Integrante 2)** Quitar el modo avión. El envío se reanuda y la etiqueta vuelve a "en vivo". *(15 s)*
9. **(Integrante 2)** Pulsar **"Estoy a salvo: terminar alerta"**. **(Integrante 3)** El portal muestra "Sin alerta activa". *(20 s)*

## Preguntas probables del jurado
- *¿Por qué no WebSockets?* Por el plan F1: CPU limitada y 1 worker. El sondeo de 5 s es simple, robusto y barato. La ruta de mejora es Azure Web PubSub.
- *¿Qué pasa si le roban el teléfono?* El portal conserva la última ubicación y su hora. La sesión del token vence en 60 minutos.
- *¿Cómo se protege la privacidad?* La ubicación se envía solo durante una alerta, va cifrada en reposo y solo la ven los familiares vinculados.
- *¿Por qué no el botón de encendido?* Expo no puede leerlo sin un módulo nativo. Queda como trabajo futuro.
