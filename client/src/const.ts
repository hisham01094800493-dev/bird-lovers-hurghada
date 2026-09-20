export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Open the self-contained email/password authentication page. */
export const startLogin = () => {
  window.location.href = "/login";
};
