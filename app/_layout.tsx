import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { MiniPlayer } from '@/components/MiniPlayer';
import { Colors } from '@/utils/colors';
import { useShareSheet } from '@/hooks/useShareSheet';

export default function RootLayout() {
  useShareSheet();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Now Playing',
            headerShown: true,
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <Stack.Screen
          name="album/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="liked"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="system-album/[name]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
