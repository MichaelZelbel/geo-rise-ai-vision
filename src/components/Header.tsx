import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import georiseLogo from "@/assets/georise-logo.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={georiseLogo} alt="GEORISE Logo" className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              GEORISE
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
