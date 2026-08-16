import Toast from 'react-native-toast-message';

type ToastKind = 'success' | 'error' | 'info';

function show(kind: ToastKind, title: string, message?: string) {
  Toast.show({
    type: kind,
    text1: title,
    text2: message,
    visibilityTime: 3400,
    topOffset: 56,
    swipeable: true,
  });
}

export const toast = {
  success: (title: string, message?: string) => show('success', title, message),
  error: (title: string, message?: string) => show('error', title, message),
  info: (title: string, message?: string) => show('info', title, message),
};