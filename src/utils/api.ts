import { auth } from '../lib/firebase';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as any).url || '');
  
  // Create a clean init object to avoid read-only header/init modifications
  const cleanInit = { ...(init || {}) };
  
  if (url.includes('/api/')) {
    const headers = { ...((cleanInit.headers as Record<string, string>) || {}) };
    if (!headers['x-user-uid']) {
      const user = auth.currentUser;
      if (user) {
        headers['x-user-uid'] = user.uid;
      } else {
        const sandboxUid = localStorage.getItem('life-saver-sandbox-uid');
        if (sandboxUid) {
          headers['x-user-uid'] = sandboxUid;
        }
      }
    }
    cleanInit.headers = headers;
  }
  
  return window.fetch(input, cleanInit);
}
