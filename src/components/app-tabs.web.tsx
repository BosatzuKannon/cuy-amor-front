import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './ui/app-text';

import { MaxContentWidth, Spacing } from '@/constants/theme';

type TabIcon = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const TAB_ICONS: Record<string, TabIcon> = {
  home: { ios: 'safari', android: 'explore', web: 'explore' },
  matches: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
};

type AppTabsProps = {
  unreadNotifications?: boolean;
};

export default function AppTabs({
  unreadNotifications = false,
}: AppTabsProps) {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild>
            <TabButton icon={TAB_ICONS.home}>Explorar</TabButton>
          </TabTrigger>
          <TabTrigger name="matches" href="/matches" asChild>
            <TabButton icon={TAB_ICONS.matches} unread={unreadNotifications}>
              Mis Cuyes
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon={TAB_ICONS.profile}>Perfil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  unread = false,
  ...props
}: TabTriggerSlotProps & { icon: TabIcon; unread?: boolean }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonFocused,
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        <SymbolView
          tintColor={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
          name={icon}
          size={22}
        />
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
      <AppText
        variant="tag"
        color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
        style={isFocused ? [styles.tabLabel, styles.tabLabelFocused] : styles.tabLabel}>
        {children}
      </AppText>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: Spacing.four,
    width: '100%',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: Spacing.one,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    gap: Spacing.half,
  },
  iconWrap: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabButtonFocused: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabLabel: {
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});