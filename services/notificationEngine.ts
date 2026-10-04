import { Platform } from 'react-native';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {
  console.warn("expo-notifications not available in this environment", e);
}

export const notificationEngine = {
  requestPermissions: async () => {
    if (!Notifications?.getPermissionsAsync) return false;
    try {
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('rest-timer', {
          name: 'Rest Timer',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8E7CFF',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (e) {
      console.warn("Notification permission error", e);
      return false;
    }
  },

  scheduleRestNotification: async (seconds: number): Promise<string | null> => {
    if (!Notifications?.scheduleNotificationAsync) return null;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rest Timer Complete 🧗",
          body: "Time to get back on the wall!",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, seconds),
        },
      });
      return id;
    } catch (e) {
      console.warn("Failed to schedule notification", e);
      return null;
    }
  },

  cancelRestNotification: async (notificationId: string) => {
    if (!Notifications?.cancelScheduledNotificationAsync) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn("Failed to cancel notification", e);
    }
  },
};
