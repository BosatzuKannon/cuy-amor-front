import AsyncStorage from '@react-native-async-storage/async-storage';

const SWIPE_TUTORIAL_SEEN_KEY = 'explore_swipe_tutorial_seen_v1';

export async function hasSeenSwipeTutorial(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SWIPE_TUTORIAL_SEEN_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function markSwipeTutorialSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(SWIPE_TUTORIAL_SEEN_KEY, 'true');
  } catch {
    // ignore storage failures
  }
}
