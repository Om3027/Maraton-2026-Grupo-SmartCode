import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { api, tokenStore } from "./src/api";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import { colors } from "./src/theme";

const ONBOARDING_KEY = "rs_onboarding_done";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function restore() {
      setShowOnboarding((await SecureStore.getItemAsync(ONBOARDING_KEY)) !== "1");
      if (await tokenStore.get()) {
        setUser(await api("/auth/me").catch(() => null));
      }
      setLoading(false);
    }
    restore();
  }, []);

  async function finishOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }

  async function handleSession(session) {
    await tokenStore.set(session.token);
    setUser(session.user);
  }

  async function logout() {
    await tokenStore.clear();
    setUser(null);
  }

  let screen;
  if (loading) screen = <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" style={styles.loader} />;
  else if (showOnboarding) screen = <OnboardingScreen onFinish={finishOnboarding} />;
  else if (!user) screen = <LoginScreen onSession={handleSession} onHelp={() => setShowOnboarding(true)} />;
  else screen = <HomeScreen user={user} onLogout={logout} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        {screen}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1 },
});
