import { LOGO_URL } from "@/lib/constants";

interface FooterLink {
  label: string;
  path: string;
}

interface PublicFooterProps {
  links?: FooterLink[];
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Contact Us", path: "/contact" },
];

export const PublicFooter = ({ links = DEFAULT_LINKS }: PublicFooterProps) => {
  return (
    <footer className="bg-background text-foreground py-12 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center mb-4">
          <img src={LOGO_URL} alt="TAAI Travel" className="max-h-8" />
        </div>
        <p className="text-muted-foreground mb-4">
          Revolutionizing travel planning with artificial intelligence
        </p>
        <div className="flex justify-center space-x-6 text-sm">
          {links.map((link) => (
            <a
              key={link.path}
              href={link.path}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};
