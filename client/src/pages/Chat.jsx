import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { getSocket } from '../socket.js';

function timeOfDay(ts) {
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayKey(ts) {
  const d = new Date(Number(ts) * 1000);
  return d.toDateString();
}

export default function Chat() {
  const { userId } = useParams();
  const other = Number(userId);
  const { user } = useAuth();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [other_user, setOtherUser] = useState(null);
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typing, setTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const emitTypingAt = useRef(0);

  const load = useCallback(async () => {
    try {
      const prof = await api.get(`/api/users/${other}`);
      if (prof.connection_status !== 'mutual') {
        setErr('You need to be mutually connected to chat.');
        return;
      }
      setOtherUser(prof.user);
      const { messages } = await api.get(`/api/messages/${other}?limit=50`);
      setMessages(messages);
      setHasMore(messages.length === 50);
      await api.post(`/api/messages/${other}/read`);
    } catch (e) {
      setErr(e.message || 'failed to load');
    }
  }, [other]);

  useEffect(() => { load(); }, [load]);

  // Scroll to bottom on initial load + new own message
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ block: 'end' });
  }, [other_user?.id]);

  useEffect(() => {
    if (bottomRef.current && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last && last.from_user_id === user.id) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [messages, user?.id]);

  // Socket listeners
  useEffect(() => {
    const s = getSocket();

    const onMsg = (msg) => {
      const involved =
        (msg.from_user_id === other && msg.to_user_id === user.id) ||
        (msg.from_user_id === user.id && msg.to_user_id === other);
      if (!involved) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.from_user_id === other) {
        api.post(`/api/messages/${other}/read`).catch(() => {});
      }
    };
    const onTyping = ({ from_user_id }) => {
      if (from_user_id !== other) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    };
    const onPresence = ({ user_id, online }) => {
      if (user_id === other) setOtherOnline(!!online);
    };
    const onRead = ({ reader_id, up_to_id }) => {
      if (reader_id !== other) return;
      setMessages((prev) => prev.map((m) =>
        m.from_user_id === user.id && !m.read_at && m.id <= up_to_id
          ? { ...m, read_at: Math.floor(Date.now() / 1000) }
          : m
      ));
    };

    s.on('message:new', onMsg);
    s.on('typing:from', onTyping);
    s.on('presence', onPresence);
    s.on('message:read', onRead);

    // Ask current presence of the other user
    s.emit('presence:query', { user_id: other }, (online) => setOtherOnline(!!online));

    return () => {
      s.off('message:new', onMsg);
      s.off('typing:from', onTyping);
      s.off('presence', onPresence);
      s.off('message:read', onRead);
      clearTimeout(typingTimer.current);
    };
  }, [other, user]);

  const emitTyping = () => {
    const now = Date.now();
    if (now - emitTypingAt.current < 1500) return;
    emitTypingAt.current = now;
    const s = getSocket();
    s.emit('typing', { to_user_id: other });
  };

  const send = async (e) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text) return;
    const s = getSocket();
    const clientMsg = text;
    setBody('');
    s.emit('message:send', { to_user_id: other, body: clientMsg }, (ack) => {
      if (!ack?.ok) setErr(ack?.error || 'send failed');
    });
  };

  const loadOlder = async () => {
    if (!messages.length || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    try {
      const oldestId = messages[0].id;
      const el = listRef.current;
      const prevHeight = el ? el.scrollHeight : 0;
      const { messages: older } = await api.get(`/api/messages/${other}?before=${oldestId}&limit=50`);
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (e) {
      setErr(e.message || 'failed to load older');
    } finally { setLoadingOlder(false); }
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop < 60 && hasMore && !loadingOlder) loadOlder();
  };

  if (err) {
    return (
      <div className="page-container">
        <div className="error">{err}</div>
        <button className="btn ghost" onClick={() => nav(-1)}>Go back</button>
      </div>
    );
  }
  if (!other_user) return <div className="loading">Loading…</div>;

  const myLastReadId = messages
    .filter((m) => m.from_user_id === user.id && m.read_at)
    .map((m) => m.id)
    .pop();

  let lastDay = null;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="back icon" onClick={() => nav('/connections')} aria-label="Back">‹</button>
        <Link to={`/u/${other_user.id}`} className="chat-user">
          {other_user && (
            <>
              <span className="chat-name">{other_user.display_name}</span>
              <span className={`chat-presence ${otherOnline ? 'on' : 'off'}`}>
                {otherOnline ? 'online' : 'offline'}
              </span>
            </>
          )}
        </Link>
      </header>

      <div ref={listRef} className="chat-list" onScroll={onScroll}>
        {loadingOlder && <div className="muted center small">Loading older…</div>}
        {!hasMore && messages.length > 0 && <div className="muted center small">Start of conversation</div>}
        {messages.length === 0 && (
          <div className="muted center" style={{ marginTop: 40 }}>
            You're connected. Say something real.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.from_user_id === user.id;
          const d = dayKey(m.created_at);
          const showDay = d !== lastDay;
          lastDay = d;
          const showRead = mine && myLastReadId === m.id;
          return (
            <div key={m.id}>
              {showDay && <div className="day-sep">{new Date(Number(m.created_at) * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>}
              <div className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
                <div className="bubble">
                  <div className="bubble-body">{m.body}</div>
                  <div className="bubble-time">{timeOfDay(m.created_at)}</div>
                </div>
              </div>
              {showRead && <div className="read-mark">Read</div>}
            </div>
          );
        })}
        {typing && <div className="typing">{other_user.display_name} is typing…</div>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-composer" onSubmit={send}>
        <input
          className="composer-input"
          value={body}
          onChange={(e) => { setBody(e.target.value); emitTyping(); }}
          placeholder="Say something…"
          maxLength={2000}
          autoFocus
        />
        <button className="btn primary" type="submit" disabled={!body.trim()}>Send</button>
      </form>
    </div>
  );
}
