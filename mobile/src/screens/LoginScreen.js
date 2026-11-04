import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { api, BASE_URL } from "../api";
import { Button } from "../components";
import { colors } from "../theme";

export default function LoginScreen({ onSession, onHelp, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      onSession(await api("/auth/login", { method: "POST", body: { email: email.trim(), password } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title} accessibilityRole="header">Iniciar sesión</Text>
      <View style={styles.field}>
        <Text style={styles.label} nativeID="emailLabel">Correo electrónico</Text>
        <TextInput
          style={styles.input} value={email} onChangeText={setEmail}
          accessibilityLabelledBy="emailLabel" accessibilityLabel="Correo electrónico"
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label} nativeID="passwordLabel">Contraseña</Text>
        <TextInput
          style={styles.input} value={password} onChangeText={setPassword}
          accessibilityLabelledBy="passwordLabel" accessibilityLabel="Contraseña"
          secureTextEntry autoComplete="password" textContentType="password"
        />
      </View>
      {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <Button label={busy ? "Un momento…" : "Entrar"} onPress={submit} disabled={busy || !email || !password} />
      <Button label="Crear cuenta" variant="secondary" onPress={onRegister} />
      <Button
        label="¿Eres familiar? Regístrate en el portal web"
        variant="link"
        hint="Abre el portal de Ruta Segura en el navegador"
        onPress={() => Linking.openURL(BASE_URL).catch(() => setError("No pudimos abrir el navegador."))}
      />
      <Button label="¿Cómo funciona?" variant="link" onPress={onHelp} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 18, backgroundColor: colors.surface, color: colors.text },
  error: { color: colors.danger, backgroundColor: "#FDE7E6", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 8 },
});
