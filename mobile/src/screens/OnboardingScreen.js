import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components";
import { colors } from "../theme";

const STEPS = [
  { icon: "🛡️", title: "Ayuda con un gesto", text: "Si te sientes en peligro, toca tres veces seguidas el botón grande de la pantalla principal. No necesitas escribir nada." },
  { icon: "🔊", title: "Alarma y ubicación", text: "Sonará una alarma a todo volumen para llamar la atención, y tu ubicación se enviará cada 5 segundos a tus familiares." },
  { icon: "👪", title: "Tu familia te ve", text: "Comparte tu código de invitación con quien confíes. Esa persona verá tu ubicación en vivo solo mientras la alerta esté activa." },
];

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>Paso {step + 1} de {STEPS.length}</Text>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">{current.icon}</Text>
      <Text style={styles.title} accessibilityRole="header">{current.title}</Text>
      <Text style={styles.text}>{current.text}</Text>
      <Button label={last ? "Empezar" : "Siguiente"} onPress={() => (last ? onFinish() : setStep(step + 1))} />
      {step > 0 && <Button label="Atrás" variant="secondary" onPress={() => setStep(step - 1)} />}
      {!last && <Button label="Saltar introducción" variant="link" onPress={onFinish} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  counter: { color: colors.muted, fontSize: 16, textAlign: "center" },
  icon: { fontSize: 64, textAlign: "center", marginVertical: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 12 },
  text: { fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 24, lineHeight: 26 },
});
