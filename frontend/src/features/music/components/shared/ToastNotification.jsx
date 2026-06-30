import React, { useEffect } from 'react';
import { useMusicState, useMusicDispatch } from '../../context/MusicContext.jsx';
import { ACTIONS } from '../../utils/constants.js';

export function ToastNotification() {
  const { toast } = useMusicState();
  const dispatch = useMusicDispatch();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.HIDE_TOAST });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className={`music-toast music-toast--${toast.type}`} role="status" aria-live="polite">
      <span className="music-toast-msg">{toast.message}</span>
    </div>
  );
}
