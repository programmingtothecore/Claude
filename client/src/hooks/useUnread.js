import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { getSocket } from '../socket.js';
import { useAuth } from '../auth.jsx';

export function useUnread() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = () => {
    if (!user) return;
    api.get('/api/connections/mutual').then(({ connections }) => {
      setCount(connections.reduce((s, c) => s + (c.unread_count || 0), 0));
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) { setCount(0); return; }
    refresh();
    const s = getSocket();
    const handler = () => refresh();
    s.on('message:new', handler);
    return () => s.off('message:new', handler);
  }, [user?.id]);

  return count;
}
