type AuthState = "unknown" | "authenticated" | "unauthenticated";

let cachedAuthState: AuthState = "unknown";

export const getAuthCache = (): AuthState => cachedAuthState;

export const setAuthCache = (state: AuthState) => {
  cachedAuthState = state;
};

export const resetAuthCache = () => {
  cachedAuthState = "unknown";
};
