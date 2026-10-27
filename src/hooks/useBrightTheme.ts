import { useEffect } from "react";

/**
 * Loads the bright-edition typefaces. Public pages follow the same light/dark
 * theme as the rest of taai; they do not pin the document to light.
 */
export function useBrightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("taai-bright");

    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Yellowtail&display=swap";
    document.head.appendChild(fonts);

    return () => {
      root.classList.remove("taai-bright");
      fonts.remove();
    };
  }, []);
}
