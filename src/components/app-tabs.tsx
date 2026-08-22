import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppTabsProps = {
  unreadNotifications?: boolean;
};

const DOT_TOP_OFFSET = 46;

export default function AppTabs({
  unreadNotifications = false,
}: AppTabsProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <NativeTabs
        backgroundColor="transparent"
        indicatorColor="rgba(255,255,255,0.45)"
        labelStyle={{
          color: 'rgba(255,255,255,0.75)',
          selected: { color: '#FFFFFF' },
        }}>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'safari', selected: 'safari.fill' }}
            md={{ default: 'explore', selected: 'explore' }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="matches">
          <NativeTabs.Trigger.Label>Mis Cuyes</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'heart', selected: 'heart.fill' }}
            md={{ default: 'favorite_border', selected: 'favorite' }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person', selected: 'person.fill' }}
            md={{ default: 'person_outline', selected: 'person' }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>

      {unreadNotifications ? (
        <View
          pointerEvents="none"
          style={[
            styles.unreadDot,
            {
              right: width / 2 - 16,
              bottom: insets.bottom + DOT_TOP_OFFSET,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  unreadDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});