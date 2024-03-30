import { useEffect, useRef } from 'react';
import { Id, toast } from 'react-toastify';

import { LOST_INTERNET_TOAST_MSG } from '@/api/error';
import { ErrorToast } from '@/components/Toast/error';

export function useOfflineStatus() {
  const toastId = useRef<Id>();
  useEffect(() => {
    const handleOnline = () => {
      toast.dismiss(toastId.current);
    };
    const handleOffline = () =>
      (toastId.current = toast(<ErrorToast msg={LOST_INTERNET_TOAST_MSG} />));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return [];
}
