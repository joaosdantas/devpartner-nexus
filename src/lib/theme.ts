// The app is dark-first. Adding the `dark` class ensures shadcn's `.dark`
// selectors also activate, matching the design system tokens.
export function ensureDarkTheme() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add("dark");
}
