/**
 * Alles, was echte Geräte-Fähigkeiten braucht: Erinnerung, Haptik, Datensicherung.
 * Jede Funktion schluckt Fehler — keine davon darf das Training stören.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { getDocumentAsync } from 'expo-document-picker';

const isWeb = Platform.OS === 'web';

/* ---------- Haptik ---------- */

export function tapTense(on: boolean) {
  if (!on || isWeb) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function tapRelease(on: boolean) {
  if (!on || isWeb) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapDone(on: boolean) {
  if (!on || isWeb) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/* ---------- Tägliche Erinnerung ---------- */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Bittet um Erlaubnis. Gibt zurück, ob erteilt wurde. */
export async function askForReminders(): Promise<boolean> {
  if (isWeb) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return !!asked.granted;
  } catch {
    return false;
  }
}

/** Setzt genau eine tägliche Erinnerung — alte werden vorher entfernt. */
export async function setReminder(
  on: boolean,
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  if (isWeb) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!on) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', {
        name: title,
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120],
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'daily',
      },
    });
  } catch {
    // Ohne Erlaubnis oder im Simulator schlägt das fehl — kein Grund abzubrechen
  }
}

/* ---------- Datensicherung ---------- */

/** Schreibt den Zustand in eine Datei und öffnet das Teilen-Menü. */
export async function exportState(json: string): Promise<boolean> {
  try {
    const file = new File(Paths.document, 'beckenboden-sicherung.json');
    if (file.exists) file.delete();
    file.create();
    file.write(json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Beckenboden',
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** Lässt eine Sicherungsdatei auswählen und gibt ihren Inhalt zurück. */
export async function importState(): Promise<string | null> {
  try {
    const res = await getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return null;
    return new File(res.assets[0].uri).text();
  } catch {
    return null;
  }
}
