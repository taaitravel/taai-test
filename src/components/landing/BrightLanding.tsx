import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import rawHtml from "@/pages/landing/index-bright.html?raw";

/**
 * Renders the taai "bright edition" landing experience.
 * The source HTML/CSS/JS is kept verbatim (design spec fidelity) and mounted
 * into a container. The page is forced to the light palette while mounted;
 * the authenticated app keeps its own theme toggle.
 */

const extract = () => {
  const styles = Array.from(rawHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)).map((m) => m[1]);
  const scripts = Array.from(rawHtml.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)).map((m) => m[1]);
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : "";
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  return { styles, scripts, body };
};

export const BrightLanding = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const { styles, scripts, body } = extract();

    // Force the light palette for the landing route only (the authenticated
    // app keeps its own theme toggle).
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

    const styleEls = styles.map((css) => {
      const el = document.createElement("style");
      el.setAttribute("data-taai-bright", "");
      el.textContent = css;
      document.head.appendChild(el);
      return el;
    });

    const hostStyle = document.createElement("style");
    hostStyle.setAttribute("data-taai-bright", "");
    hostStyle.textContent =
      ".taai-bright-host{position:relative;z-index:0;background:#FAF7F2;color:#171310;font-family:'Inter',-apple-system,sans-serif}";
    document.head.appendChild(hostStyle);
    styleEls.push(hostStyle);



    host.innerHTML = body;
    document.body.classList.add("ready");

    const scriptEls = scripts.map((code) => {
      const el = document.createElement("script");
      el.setAttribute("data-taai-bright", "");
      el.textContent = code;
      document.body.appendChild(el);
      return el;
    });

    // Route internal links through the SPA router.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("/")) {
        e.preventDefault();
        navigate(href);
      }
    };
    host.addEventListener("click", onClick);

    return () => {
      observer.disconnect();
      host.removeEventListener("click", onClick);
      host.innerHTML = "";
      styleEls.forEach((el) => el.remove());
      scriptEls.forEach((el) => el.remove());
      fonts.remove();
      document.body.classList.remove("ready");
      root.classList.remove("taai-bright");
      if (hadDark) {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    };

  }, [navigate]);

  return <div ref={hostRef} className="taai-bright-host" />;
};

export default BrightLanding;
