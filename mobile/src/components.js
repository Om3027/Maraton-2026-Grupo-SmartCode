import { Pressable, StyleSheet, Text } from "react-native";
import { colors, touch } from "./theme";

export function Button({ label, onPress, variant = "primary", disabled, hint }) {
  const style = styles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, style.box, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.label, style.text]}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  ...StyleSheet.create({
    base: { ...touch, borderRadius: 12, paddingHorizontal: 20, justifyContent: "center", alignItems: "center", marginVertical: 6, borderWidth: 2 },
    label: { fontSize: 18, fontWeight: "700" },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.6 },
  }),
  primary: StyleSheet.create({ box: { backgroundColor: colors.primary, borderColor: colors.primary }, text: { color: colors.onPrimary } }),
  secondary: StyleSheet.create({ box: { backgroundColor: colors.surface, borderColor: colors.primary }, text: { color: colors.primary } }),
  danger: StyleSheet.create({ box: { backgroundColor: colors.surface, borderColor: colors.danger }, text: { color: colors.danger } }),
  link: StyleSheet.create({ box: { backgroundColor: "transparent", borderColor: "transparent" }, text: { color: colors.primary, textDecorationLine: "underline" } }),
};
