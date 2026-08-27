import { useNavigate } from "react-router-dom";
import { LOGO_URL } from "@/lib/constants";

/**
 * Global public footer — taai bright edition.
 * Warm cream/white ground, hairline top rule, mono tagline and a single
 * link row. Used at the very bottom of every public page.
 */

const CSS = `
.taai-foot{
  --tf-cream:var(--cream,#FAF7F2);
  --tf-ink:var(--ink,#171310);
  --tf-ink2:var(--ink-2,rgba(23,19,16,.62));
  --tf-ink3:var(--ink-3,rgba(23,19,16,.36));
  --tf-line:var(--line-2,rgba(23,19,16,.055));
  --tf-mono:var(--mono,"IBM Plex Mono",ui-monospace,monospace);
  --tf-body:var(--body,"Inter",-apple-system,sans-serif);
  background:#fff;border-top:1px solid var(--tf-line);padding:44px 0 34px;
  font-family:var(--tf-body);color:var(--tf-ink3);position:relative;z-index:1;
}
.taai-foot-in{max-width:1320px;margin:0 auto;padding:0 40px;display:flex;justify-content:space-between;
  align-items:center;gap:24px;flex-wrap:wrap}
.taai-foot-brand{display:flex;flex-direction:column;gap:10px}
.taai-foot-brand img{height:24px;width:auto;display:block}
.taai-foot-tag{font-family:var(--tf-mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--tf-ink3)}
.taai-foot nav{display:flex;flex-wrap:wrap;gap:8px 22px;align-items:center;justify-content:flex-end}
.taai-foot a{color:var(--tf-ink2);font-size:13px;text-decoration:none;background:none;border:0;
  font-family:inherit;cursor:pointer;padding:0;transition:color .3s cubic-bezier(.22,.61,.28,1)}
.taai-foot a:hover{color:#F2536E}
.taai-foot-legal{max-width:1320px;margin:26px auto 0;padding:18px 40px 0;border-top:1px solid var(--tf-line);
  font-size:11.5px;color:var(--tf-ink3);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
@media (max-width:900px){
  .taai-foot-in{flex-direction:column;align-items:flex-start;gap:20px;padding:0 24px}
  .taai-foot nav{justify-content:flex-start}
  .taai-foot-legal{padding:18px 24px 0}
}
`;

interface FooterLink {
  label: string;
  path: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Product", path: "/#journey" },
  { label: "Workspace", path: "/#capability" },
  { label: "What we do", path: "/what-we-do" },
  { label: "Demo", path: "/login" },
  { label: "Join", path: "/signup" },
  { label: "Contact", path: "/contact" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms of Service", path: "/terms" },
];

interface PublicFooterProps {
  links?: FooterLink[];
}

export const PublicFooter = ({ links = DEFAULT_LINKS }: PublicFooterProps) => {
  const navigate = useNavigate();

  const go = (e: React.MouseEvent, path: string) => {
    if (path.startsWith("/#")) return; // let the browser handle in-page anchors
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="taai-foot">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="taai-foot-in">
        <div className="taai-foot-brand">
          <img src={LOGO_URL} alt="taai travel" />
          <span className="taai-foot-tag">taai.travel · travel agent · affiliate · intelligence</span>
        </div>
        <nav aria-label="Footer">
          {links.map((link) => (
            <a key={link.path} href={link.path} onClick={(e) => go(e, link.path)}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="taai-foot-legal">
        <span>© {new Date().getFullYear()} taai travel. All rights reserved.</span>
        <span>Every trip, arriving.</span>
      </div>
    </footer>
  );
};
