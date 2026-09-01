import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

const LIKE_SOUND = require('@/assets/sounds/like.mp3');
const CUYAZO_SOUND = require('@/assets/sounds/Cuyazo.mp3');
const PASS_SOUND = require('../../assets/sounds/pass.mp3');
const ZUMBIDO_SOUND = require('../../assets/sounds/zumbido.mp3');

export function useInteractionSounds() {
  const likePlayer = useAudioPlayer(LIKE_SOUND);
  const cuyazoPlayer = useAudioPlayer(CUYAZO_SOUND);
  const passPlayer = useAudioPlayer(PASS_SOUND);
  const zumbidoPlayer = useAudioPlayer(ZUMBIDO_SOUND);

  const playLike = useCallback(() => {
    if (!likePlayer.isLoaded) {
      return;
    }
    void likePlayer.seekTo(0);
    likePlayer.play();
  }, [likePlayer]);

  const playCuyazo = useCallback(() => {
    if (!cuyazoPlayer.isLoaded) {
      return;
    }
    void cuyazoPlayer.seekTo(0);
    cuyazoPlayer.play();
  }, [cuyazoPlayer]);

  const playPass = useCallback(() => {
    if (!passPlayer.isLoaded) {
      return;
    }
    void passPlayer.seekTo(0);
    passPlayer.play();
  }, [passPlayer]);

  const playZumbido = useCallback(() => {
    if (!zumbidoPlayer.isLoaded) {
      return;
    }
    void zumbidoPlayer.seekTo(0);
    zumbidoPlayer.play();
  }, [zumbidoPlayer]);

  return { playLike, playCuyazo, playPass, playZumbido };
}