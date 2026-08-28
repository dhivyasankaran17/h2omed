import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from './src/components/AppBackground';
import { TabKey, TopTabs } from './src/components/TopTabs';
import { AppStateProvider, useAppState } from './src/context/AppStateContext';
import { MedicationScreen } from './src/screens/MedicationScreen';
import { WaterScreen } from './src/screens/WaterScreen';
import { colors } from './src/theme/colors';

function AppContent() {
  const { loading, permissionGranted } = useAppState();
  const [tab, setTab] = useState<TabKey>('water');

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.accentTealLight} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {!permissionGranted && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Notifications are off — enable them in Settings so H2OMed can remind you.</Text>
        </View>
      )}
      <TopTabs active={tab} onChange={setTab} />
      <View style={styles.flex}>{tab === 'water' ? <WaterScreen /> : <MedicationScreen />}</View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AppBackground>
          <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
            <StatusBar style="light" />
            <AppStateProvider>
              <AppContent />
            </AppStateProvider>
          </SafeAreaView>
        </AppBackground>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { backgroundColor: colors.warning, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, marginHorizontal: 20, marginTop: 8 },
  bannerText: { color: colors.background, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
