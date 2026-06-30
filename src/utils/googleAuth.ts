// Cache the access token in memory.
let cachedAccessToken: string | null = null;

/**
 * Simulated Firebase initialization.
 * Always returns true for compatibility.
 */
export async function initFirebase(): Promise<boolean> {
  return true;
}

/**
 * Simulated Auth Listener.
 * Always returns an empty unsubscribe function.
 */
export const initAuthListener = async (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  return () => {};
};

/**
 * Simulates Google Sign-In.
 * Returns a mock user and a simulated access token.
 */
export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const simulatedToken = "simulated_gcal_token_" + Math.random().toString(36).substr(2, 9);
  cachedAccessToken = simulatedToken;

  return {
    user: { displayName: "Raj", email: "raj@college.edu" },
    accessToken: simulatedToken
  };
};

/**
 * Returns the currently cached access token.
 */
export const getAccessToken = () => cachedAccessToken;

/**
 * Fetches Google Calendar events.
 * Always returns simulated events to support the demo mode.
 */
export async function fetchGoogleCalendarEvents(token: string): Promise<any[]> {
  // Return simulated Google calendar blockers to provide high fidelity demo experience
  return [
    {
      id: "gcal_sim_1",
      summary: "🤝 Corporate Synergy Alignment Meeting",
      start: { dateTime: "2026-06-23T14:00:00-07:00" },
      end: { dateTime: "2026-06-23T15:30:00-07:00" }
    },
    {
      id: "gcal_sim_2",
      summary: "🍕 Client Dinner & Product Pitch",
      start: { dateTime: "2026-06-24T18:00:00-07:00" },
      end: { dateTime: "2026-06-24T20:30:00-07:00" }
    },
    {
      id: "gcal_sim_3",
      summary: "💼 Google Workspace Architecture Checkpoint",
      start: { dateTime: "2026-06-25T10:00:00-07:00" },
      end: { dateTime: "2026-06-25T11:30:00-07:00" }
    }
  ];
}

/**
 * Simulates logging out.
 */
export const logout = async () => {
  cachedAccessToken = null;
};
