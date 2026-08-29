import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { useFonts, type FontSource } from 'expo-font';

const appFonts: Record<string, FontSource> = {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
};

const iconFonts: Record<string, FontSource> = {
  ...Ionicons.font,
  ...AntDesign.font,
  ...FontAwesome.font,
  ...MaterialIcons.font,
};

export const fontAssets: Record<string, FontSource> = {
  ...appFonts,
  ...iconFonts,
};

export function useAppFonts() {
  return useFonts(fontAssets);
}