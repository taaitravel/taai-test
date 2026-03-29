import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();

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
            <Button
              key={link.path}
              variant="link"
              className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
};
