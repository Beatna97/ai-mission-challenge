import { io, Socket } from 'socket.io-client';

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

let socket: Socket | undefined;
export const getSocket = () => (socket ??= io(SERVER_URL));

// Per-tab secret used to reconnect to the same seat after a refresh or dropped connection.
export function getKey() {
  let k = sessionStorage.getItem('sf_key');
  if (!k) {
    k = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('sf_key', k);
  }
  return k;
}
export const loadName = () => localStorage.getItem('sf_name') || '';
export const saveName = (n: string) => localStorage.setItem('sf_name', n);
