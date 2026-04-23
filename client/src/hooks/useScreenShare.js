import { useState } from 'react';

export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);

  const toggleScreenShare = async (option) => {
    if (isSharing) {
      stopScreenShare();
      return;
    }

    try {
      let stream;
      if (option === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      } else if (option === 'window') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          preferCurrentTab: false,
          surfaceSwitching: 'include',
        });
      } else if (option === 'tab') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          preferCurrentTab: true,
          surfaceSwitching: 'exclude',
        });
      }

      setScreenStream(stream);
      setIsSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Erreur de partage d'écran :", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsSharing(false);
    }
  };

  return { isSharing, screenStream, toggleScreenShare, stopScreenShare };
}