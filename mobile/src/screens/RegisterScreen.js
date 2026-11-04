import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../api";
import { Button } from "../components";
import { colors } from "../theme";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

function validate({ fullName, email, password }) {
  if (fullName.trim().length < 2 || fullName.trim().length > 80) return "Escribe tu nombre (entre 2 y 80 caracteres).";
  if (!EMAIL_RE.test(email.trim())) return "Escribe un correo electrónico válido.";
  if (password.length < 8 || password.length > 72) return "La contraseña debe tener entre 8 y 72 caracteres.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "La contraseña debe tener al menos una letra y un número.";
  return "";
}

function Field({ id, label, help, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label} nativeID={id}>{label}</Text>
      <TextInput style={styles.input} accessibilityLabelledBy={id} accessibilityLabel={label} accessibilityHint={help} {...inputProps} />
      {help ? <Text style={styles.help}>{help}</Text> : null}
    </View>
  );
}

export default function RegisterScreen({ onSession, onBack }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const problem = validate({ fullName, email, password });
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      const body = { full_name: fullName.trim(), email: email.trim(), password, role: "user" };
      onSession(await api("/auth/register", { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">Crear cuenta</Text>
        <Text style={styles.intro}>Al terminar verás tu código de invitación para compartirlo con tu familia.</Text>
        <Field id="nameLabel" label="Nombre completo" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" />
        <Field id="regEmailLabel" label="Correo electrónico" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <Field id="regPasswordLabel" label="Contraseña" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="new-password" textContentType="newPassword"
          help="Mínimo 8 caracteres, con al menos una letra y un número." />
        {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}
        <Button label={busy ? "Un momento…" : "Crear cuenta"} onPress={submit} disabled={busy} />
        <Button label="Ya tengo cuenta: iniciar sesión" variant="link" onPress={onBack} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 8 },
  intro: { fontSize: 16, color: colors.muted, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 18, backgroundColor: colors.surface, color: colors.text },
  help: { color: colors.muted, fontSize: 14, marginTop: 4 },
  error: { color: colors.danger, backgroundColor: "#FDE7E6", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 8 },
});
