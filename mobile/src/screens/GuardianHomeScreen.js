import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../api";
import { Button } from "../components";
import { colors } from "../theme";

const POLL_MS = 5000;

function time(iso) {
  return new Date(iso).toLocaleTimeString("es-CO");
}

function LiveCard({ userId }) {
  const [status, setStatus] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    async function poll() {
      try {
        const data = await api(`/users/${userId}/live?_=${Date.now()}`);
        if (!cancelled) { setStatus(data); setUpdatedAt(new Date()); setError(""); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) timer = setTimeout(poll, POLL_MS);
      }
    }
    setStatus(null);
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [userId]);

  if (!status) return <Text style={styles.muted}>{error || "Cargando ubicación…"}</Text>;

  const last = status.last_location;
  const active = status.alert?.status === "active";
  let badge = { text: "Sin alerta activa", style: styles.badgeOk };
  if (active) badge = status.signal_lost
    ? { text: "⚠ Señal perdida", style: styles.badgeWarning }
    : { text: "● Alerta activa: en vivo", style: styles.badgeDanger };

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <Text style={styles.name} accessibilityRole="header">{status.user.full_name}</Text>
      <Text style={[styles.badge, badge.style]} accessibilityLiveRegion="polite">{badge.text}</Text>
      <Text style={styles.muted} accessibilityLiveRegion="polite">
        Última actualización: {updatedAt?.toLocaleTimeString("es-CO")} · cada 5 segundos
      </Text>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error} Seguimos intentando.</Text> : null}
      {last ? (
        <>
          <Text style={styles.label}>{status.signal_lost ? "Última ubicación conocida" : "Ubicación"}</Text>
          <Text style={styles.value}>{last.lat.toFixed(5)}, {last.lng.toFixed(5)}</Text>
          <Text style={styles.label}>Hora del último dato</Text>
          <Text style={styles.value}>{time(last.recorded_at)}</Text>
          <Button
            label="Abrir en Google Maps"
            hint="Abre la ubicación en el mapa"
            onPress={() => Linking.openURL(`https://www.google.com/maps?q=${last.lat},${last.lng}`).catch(() => setError("No pudimos abrir el mapa."))}
          />
        </>
      ) : (
        <Text style={styles.value}>{active ? "La alerta está activa, pero aún no llega ninguna ubicación." : "Aquí verás su ubicación cuando active una alerta."}</Text>
      )}
    </View>
  );
}

export default function GuardianHomeScreen({ user, onLogout }) {
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

  async function link() {
    try {
      const linked = await api("/links", { method: "POST", body: { invite_code: code.trim().toUpperCase() } });
      setCode("");
      setMessage({ text: `Listo. Ya estás vinculado o vinculada con ${linked.full_name}.`, error: false });
      setSelectedId(linked.id);
      await loadUsers();
    } catch (err) {
      setMessage({ text: err.message, error: true });
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">Hola, {user.full_name}</Text>
      <Text style={styles.muted}>Cuenta de familiar</Text>

      <Text style={styles.section} accessibilityRole="header">Personas que cuidas</Text>
      {users.length === 0 && <Text style={styles.muted}>Aún no tienes personas vinculadas. Pídele su código de invitación.</Text>}
      {users.map((u) => (
        <Pressable
          key={u.id}
          onPress={() => setSelectedId(u.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: u.id === selectedId }}
          accessibilityLabel={`${u.full_name}${u.has_active_alert ? ", alerta activa" : ""}`}
          style={[styles.person, u.id === selectedId && styles.personSelected]}
        >
          <Text style={styles.personName}>{u.full_name}</Text>
          {u.has_active_alert && <Text style={[styles.badge, styles.badgeDanger]}>Alerta activa</Text>}
        </Pressable>
      ))}

      {selectedId && <LiveCard userId={selectedId} />}

      <Text style={styles.label} nativeID="codeLabel">Vincular con código de invitación</Text>
      <TextInput
        style={styles.input} value={code} onChangeText={(v) => setCode(v.toUpperCase())} maxLength={8}
        autoCapitalize="characters" autoCorrect={false}
        accessibilityLabelledBy="codeLabel" accessibilityLabel="Código de invitación"
        accessibilityHint="Son 8 letras o números que ella ve en su app"
      />
      <Button label="Vincular" onPress={link} disabled={code.trim().length !== 8} />
      {message.text ? (
        <Text style={message.error ? styles.error : styles.ok} accessibilityRole={message.error ? "alert" : undefined} accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}

      <Button label="Cerrar sesión" variant="link" onPress={onLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  section: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 20, marginBottom: 8 },
  muted: { color: colors.muted, fontSize: 15, marginBottom: 6 },
  person: { minHeight: 56, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderWidth: 2, borderColor: "#CAC4D0", borderRadius: 10, backgroundColor: colors.surface, marginBottom: 8 },
  personSelected: { borderColor: colors.primary, backgroundColor: "#F3E5F5" },
  personName: { fontSize: 18, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginVertical: 12 },
  cardActive: { borderLeftWidth: 6, borderLeftColor: colors.danger },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 6 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontWeight: "700", fontSize: 15, overflow: "hidden", marginBottom: 6 },
  badgeDanger: { backgroundColor: colors.danger, color: "#FFFFFF" },
  badgeWarning: { backgroundColor: "#FFE08A", color: "#5C3C00", borderWidth: 2, borderColor: "#5C3C00" },
  badgeOk: { backgroundColor: "#E3F3E4", color: colors.ok },
  label: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 10, marginBottom: 4 },
  value: { fontSize: 18, color: colors.text },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 20, letterSpacing: 4, backgroundColor: colors.surface, color: colors.text },
  error: { color: colors.danger, backgroundColor: "#FDE7E6", padding: 12, borderRadius: 8, fontSize: 16, marginTop: 8 },
  ok: { color: colors.ok, backgroundColor: "#E3F3E4", padding: 12, borderRadius: 8, fontSize: 16, marginTop: 8 },
});
