import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWebPush = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Eroare",
        description: "Browser-ul tău nu suportă notificări",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: "Succes",
          description: "Notificările au fost activate",
        });
        return true;
      } else {
        toast({
          title: "Info",
          description: "Notificările au fost refuzate",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          badge: '/favicon.ico',
          icon: '/favicon.ico',
          ...options,
        });
      } else {
        new Notification(title, options);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
};
