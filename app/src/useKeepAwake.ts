import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'beckenboden-session';

/**
 * Hält den Bildschirm während der Einheit an.
 *
 * Anders als `useKeepAwake` aus expo-keep-awake schluckt dieser Haken Fehler:
 * im Browser verlangt die Wake-Lock-API ein sichtbares Dokument und lehnt sonst
 * ab — das darf das Training nicht stören.
 */
export function useKeepAwake() {
  useEffect(() => {
    activateKeepAwakeAsync(TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(TAG).catch(() => {});
    };
  }, []);
}
