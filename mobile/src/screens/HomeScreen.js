import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { api } from "../api";
import { Button } from "../components";
import { colors } from "../theme";
import { useAlarm } from "../useAlarm";
import { useLocationSender } from "../useLocationSender";

const TAPS_NEEDED = 3;
const TAP_WINDOW_MS = 1500;

export default function HomeScreen({ user, onLogout }) {
  const [alertId, setAlertId] = useState(null);
  const [alarmOn, setAlarmOn] = useState(false);
  const [taps, setTaps] = useState(0);
  const [startError, setStartError] = useState("");
  const tapTimer = useRef(null);
  const alarm = useAlarm();
  const { lastSentAt, error: sendError } = useLocationSender(alertId);
  const active = alarmOn || alertId !== null;

  useEffect(() => {
    api(`/users/${user.id}/live`)
      .then((status) => status.alert?.status === "active" && setAlertId(status.alert.id))
      .catch(() => {});
  }, [user.id]);

  function tap() {
    const count = taps + 1;
    clearTimeout(tapTimer.current);
    Haptics.selectionAsync().catch(() => {});
    if (count >= TAPS_NEEDED) {
      setTaps(0);
      trigger();
      return;
    }
    setTaps(count);
    tapTimer.current = setTimeout(() => setTaps(0), TAP_WINDOW_MS);
  }

  async function trigger() {
    alarm.start(); // local first: the alarm must sound even without internet
    setAlarmOn(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    await startAlertWithRetry();
  }

  async function startAlertWithRetry() {
    try {
      const alert = await api("/alerts", { method: "POST" });
      setAlertId(alert.id);
      setStartError("");
    } catch (err) {
      setStartError(`${err.message} Reintentando en 5 segundos…`);
      setTimeout(startAlertWithRetry, 5000);
    }
  }

  function silence() {
    alarm.stop();
    setAlarmOn(false);
  }

  async function imSafe() {
    silence();
    if (alertId) {
      await api(`/alerts/${alertId}/close`, { method: "POST" }).catch(() => {});
    }
    setAlertId(null);
  }

  if (user.role !== "user") {
    return (
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">Hola, {user.full_name}</Text>
        <Text style={styles.text}>Tu cuenta es de familiar. Para ver la ubicación de quien cuidas, usa el portal web de Ruta Segura.</Text>
        <Button label="Cerrar sesión" variant="secondary" onPress={onLogout} />
      </View>
    );
  }

  if (active) {
    return (
      <View style={[styles.container, styles.alertBg]}>
        <Text style={styles.alertTitle} accessibilityRole="header" accessibilityLiveRegion="assertive">Alerta activa</Text>
        <Text style={styles.alertText}>
          {alertId ? "Tu familia está viendo tu ubicación en vivo." : "Activando la alerta…"}
        </Text>
        <Text style={styles.alertText} accessibilityLiveRegion="polite">
          {lastSentAt ? `Última ubicación enviada: ${lastSentAt.toLocaleTimeString("es-CO")}` : "Buscando tu ubicación…"}
        </Text>
        {(startError || sendError) ? <Text style={styles.alertWarning} accessibilityRole="alert">{startError || sendError}</Text> : null}
        {alarmOn && <Button label="Silenciar alarma" variant="secondary" hint="La ubicación se sigue enviando" onPress={silence} />}
        <Button label="Estoy a salvo: terminar alerta" variant="secondary" hint="Detiene la alarma y deja de compartir tu ubicación" onPress={imSafe} />
      </View>
    );
  }

  const remaining = TAPS_NEEDED - taps;
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {user.full_name}</Text>
      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel="Botón de auxilio"
        accessibilityHint="Tócalo tres veces seguidas para activar la alarma y compartir tu ubicación"
        style={({ pressed }) => [styles.sos, pressed && styles.sosPressed]}
      >
        <Text style={styles.sosText}>SOS</Text>
        <Text style={styles.sosHint} accessibilityLiveRegion="polite">
          {taps === 0 ? "Toca 3 veces seguidas" : `Toca ${remaining} ${remaining === 1 ? "vez" : "veces"} más`}
        </Text>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tu código de invitación</Text>
        <Text style={styles.code} accessibilityLabel={`Código ${user.invite_code.split("").join(" ")}`}>{user.invite_code}</Text>
        <Text style={styles.muted}>Compártelo solo con familiares de confianza.</Text>
      </View>
      <Button label="Cerrar sesión" variant="link" onPress={onLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  greeting: { fontSize: 20, color: colors.text, textAlign: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 12 },
  text: { fontSize: 18, color: colors.text, marginBottom: 20, lineHeight: 26 },
  sos: { alignSelf: "center", width: 260, height: 260, borderRadius: 130, backgroundColor: colors.danger, justifyContent: "center", alignItems: "center", elevation: 6 },
  sosPressed: { backgroundColor: colors.dangerDark, transform: [{ scale: 0.97 }] },
  sosText: { color: "#FFFFFF", fontSize: 64, fontWeight: "900" },
  sosHint: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 28, alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  code: { fontSize: 30, fontWeight: "800", letterSpacing: 6, color: colors.primary, marginVertical: 6 },
  muted: { color: colors.muted, fontSize: 15 },
  alertBg: { backgroundColor: colors.danger },
  alertTitle: { fontSize: 34, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginBottom: 12 },
  alertText: { fontSize: 19, color: "#FFFFFF", textAlign: "center", marginBottom: 10 },
  alertWarning: { fontSize: 17, color: colors.text, backgroundColor: "#FFE08A", padding: 12, borderRadius: 8, marginBottom: 12 },
});
