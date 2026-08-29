import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type ColorValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/theme/colors';


type IconName = ComponentProps<typeof Ionicons>['name'];

type TabKey = 'home' | 'matches' | 'profile';

type AppTabsProps = {
  unreadNotifications?: boolean;
};

const TAB_ICONS: Record<TabKey, { default: IconName; focused: IconName }> = {
  home: { default: 'compass-outline', focused: 'compass' },
  matches: { default: 'heart-outline', focused: 'heart' },
  profile: { default: 'person-outline', focused: 'person' },
};

const BAR_MARGIN = 20;
const BAR_HEIGHT = 70;

export default function AppTabs({
  unreadNotifications = false,
}: AppTabsProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabBarBottom = Math.max(insets.bottom, 14) + 11;
  const dotBottom = tabBarBottom + 36;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelPosition: 'below-icon',
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [
            styles.tabBar,
            { bottom: tabBarBottom, marginHorizontal: BAR_MARGIN },
          ],
        }}>
        <Tabs.Screen name="home" options={tabOptions('home')} />
        <Tabs.Screen name="matches" options={tabOptions('matches')} />
        <Tabs.Screen name="profile" options={tabOptions('profile')} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      {unreadNotifications ? (
        <View
          pointerEvents="none"
          style={[
            styles.unreadDot,
            {
              right: width / 2 - 16,
              bottom: dotBottom,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

function tabOptions(route: TabKey) {
  return {
    title: route === 'home' ? 'Explorar' : route === 'matches' ? 'Mis Cuyes' : 'Perfil',
    tabBarLabel:
      route === 'home' ? 'Explorar' : route === 'matches' ? 'Mis Cuyes' : 'Perfil',
    tabBarIcon: ({
      focused,
      color,
    }: {
      focused: boolean;
      color: ColorValue;
      size: number;
    }) => {
      let iconName: "compass" | "compass-outline" | "heart" | "heart-outline" | "person" | "person-outline";

      if (route === 'home') {
        iconName = focused ? 'compass' : 'compass-outline';
      } else if (route === 'matches') {
        iconName = focused ? 'heart' : 'heart-outline';
      } else {
        iconName = focused ? 'person' : 'person-outline';
      }

      return (
        <View style={[styles.iconPill, focused && styles.iconPillActive]}>
          <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={iconName} size={22} color={color} />
          </View>
        </View>
      );
    },
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    borderRadius: 35,
    borderTopWidth: 0,
    backgroundColor: Colors.white,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabItem: {
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
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