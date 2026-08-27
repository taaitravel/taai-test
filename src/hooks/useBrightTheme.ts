import { useEffect } from "react";

/**
 * Forces the bright (light) TAAI palette for public marketing pages.
 * The authenticated app keeps its own theme toggle untouched.
 */
export function useBrightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    const stripDark = () => {
      if (root.classList.contains("dark")) root.classList.remove("dark");
      if (!root.classList.contains("light")) root.classList.add("light");
    };

    stripDark();
    root.classList.add("taai-bright");

    const observer = new MutationObserver(stripDark);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Yellowtail&display=swap";
    document.head.appendChild(fonts);

    return () => {
      observer.disconnect();
      root.classList.remove("taai-bright");
      if (hadDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      }
      fonts.remove();
    };
  }, []);
}
