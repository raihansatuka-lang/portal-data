import Cookie from "js-cookie";

export const TOKEN_PPDB = "TOKEN_PPDB";

export const setAccessTokenCookie = (accessToken: string | undefined) => {
  if (accessToken) {
    Cookie.set(TOKEN_PPDB, accessToken, {
      expires: 7,
      secure: typeof window !== "undefined" && window.location.protocol === "https:",
    });
    localStorage.setItem(TOKEN_PPDB, accessToken);
  }
};

export const getAccessTokenCookie = (): string | null => {
  const accessTokenCookie = Cookie.get(TOKEN_PPDB);
  return accessTokenCookie ?? (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_PPDB) : null);
};

export const clearAccessTokenCookie = () => {
  Cookie.remove(TOKEN_PPDB);
  localStorage.removeItem(TOKEN_PPDB);
};
