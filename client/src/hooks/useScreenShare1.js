import { useMedia } from '../context/MediaContext.jsx';

export function useScreenShare() {
  const { screenStream, startScreenShare, stopScreenShare } = useMedia();
  return {
    isSharing: !!screenStream,
    startScreenShare,
    stopScreenShare,
    toggle: screenStream ? stopScreenShare : startScreenShare,
  };
}
