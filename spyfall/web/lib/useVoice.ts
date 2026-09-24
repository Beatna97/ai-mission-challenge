'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { getSocket } from './socket';

// Joins the LiveKit room while `enabled` is true (auto-join when the game starts).
export function useVoice(enabled: boolean) {
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'on' | 'error'>('idle');
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let dead = false;
    const room = new Room({ adaptiveStream: true });
    room.on(RoomEvent.ActiveSpeakersChanged, (sp) => setSpeaking(sp.map((p) => p.identity)));
    room.on(RoomEvent.TrackSubscribed, (track) => { if (track.kind === 'audio') document.body.appendChild(track.attach()); });
    room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((el) => el.remove()));
    setStatus('connecting');

    getSocket().emit('voice:token', async (r: { ok: boolean; token?: string; url?: string }) => {
      if (dead) return;
      if (!r.ok || !r.token || !r.url) { setStatus('error'); return; }
      try {
        await room.connect(r.url, r.token);
        if (dead) { room.disconnect(); return; }
        let micBlocked = false;
        await room.localParticipant.setMicrophoneEnabled(true).catch(() => { micBlocked = true; });
        room.startAudio().catch(() => {});
        roomRef.current = room;
        setMuted(micBlocked);
        setStatus('on');
      } catch {
        if (!dead) setStatus('error');
      }
    });

    return () => {
      dead = true; roomRef.current = null; room.disconnect();
      setStatus('idle'); setSpeaking([]);
    };
  }, [enabled]);

  const toggle = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try { await room.localParticipant.setMicrophoneEnabled(muted); setMuted(!muted); } catch { /* mic permission denied */ }
  }, [muted]);

  return { status, muted, speaking, toggle };
}
