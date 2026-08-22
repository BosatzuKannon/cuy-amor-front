import AppTabs from '@/components/app-tabs';
import { useChatStore } from '@/store/useChatStore';

export default function TabsLayout() {
  const hasUnreadNotifications = useChatStore(
    (state) => state.hasUnreadNotifications,
  );

  return <AppTabs unreadNotifications={hasUnreadNotifications} />;
}