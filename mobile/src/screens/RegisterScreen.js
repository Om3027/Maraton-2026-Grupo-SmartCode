import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../api";
import { Button } from "../components";
import { colors } from "../theme";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
const ROLES = [
  { value: "user", label: "Usuaria", title: "Crear cuenta de usuaria", description: "Activa la alarma y comparte su ubicación." },
  { value: "guardian", label: "Familiar", title: "Crear cuenta de familiar", description: "Ve la ubicación en tiempo real de quien la invitó." },
];

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
  const [role, setRole] = useState("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = ROLES.find((option) => option.value === role);

  async function submit() {
    const problem = validate({ fullName, email, password });
    setError(problem);
    if (problem) return;
    setBusy(true);
    try {
      const body = { full_name: fullName.trim(), email: email.trim(), password, role };
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
        <Text style={styles.title} accessibilityRole="header">{selected.title}</Text>
        <Text style={styles.label} nativeID="roleLabel">Tipo de cuenta</Text>
        <View accessibilityRole="radiogroup" accessibilityLabelledBy="roleLabel" style={styles.roles}>
          {ROLES.map((option) => {
            const checked = option.value === role;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRole(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                accessibilityLabel={`${option.label}: ${option.description}`}
                style={[styles.role, checked && styles.roleChecked]}
              >
                <Text style={[styles.roleLabel, checked && styles.roleLabelChecked]}>{checked ? "◉" : "○"} {option.label}</Text>
                <Text style={styles.roleText}>{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.intro}>
          {role === "user"
            ? "Al terminar verás tu código de invitación para compartirlo con tu familia."
            : "Al terminar podrás escribir el código de invitación que ella te comparta."}
        </Text>
        <Field id="nameLabel" label="Nombre completo" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" />
        <Field id="regEmailLabel" label="Correo electrónico" value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <Field id="regPasswordLabel" label="Contraseña" value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="new-password" textContentType="newPassword"
          help="Mínimo 8 caracteres, con al menos una letra y un número." />
        {error ? <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="assertive">{error}</Text> : null}
        <Button label={busy ? "Un momento…" : selected.title} onPress={submit} disabled={busy} />
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
  roles: { marginBottom: 12 },
  role: { minHeight: 64, borderWidth: 2, borderColor: "#CAC4D0", borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: colors.surface },
  roleChecked: { borderColor: colors.primary, backgroundColor: "#F3E5F5" },
  roleLabel: { fontSize: 18, fontWeight: "700", color: colors.text },
  roleLabelChecked: { color: colors.primary },
  roleText: { fontSize: 15, color: colors.muted, marginTop: 2 },
  field: { marginBottom: 14 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 18, backgroundColor: colors.surface, color: colors.text },
  help: { color: colors.muted, fontSize: 14, marginTop: 4 },
  error: { color: colors.danger, backgroundColor: "#FDE7E6", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 8 },
});
