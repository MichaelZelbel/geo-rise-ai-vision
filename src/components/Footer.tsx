const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-primary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-foreground/60">
          <a href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-accent transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="/cookies" className="hover:text-accent transition-colors">Cookies Policy</a>
          <span>•</span>
          <a href="/pricing" className="hover:text-accent transition-colors">Pricing</a>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-sm text-foreground/60">
            Questions or feedback? Reach us anytime at{" "}
            <a href="mailto:support@georise.ai" className="text-accent hover:text-accent/80 transition-colors">
              support@georise.ai
            </a>
            {" "}💙
          </p>
        </div>

        <div className="text-center text-sm text-foreground/50">
          © {currentYear} by GEORISE Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
