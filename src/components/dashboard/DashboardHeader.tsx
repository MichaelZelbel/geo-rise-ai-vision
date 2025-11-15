import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "@/components/NavLink";
import headerLogo from "@/assets/header-logo.png";

interface DashboardHeaderProps {
  userEmail?: string;
  userPlan?: string;
}

const DashboardHeader = ({ userEmail, userPlan }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center">
              <img src={headerLogo} alt="GEORISE" className="h-10" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                activeClassName="text-primary"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/reports"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                activeClassName="text-primary"
              >
                Reports
              </NavLink>
              {userPlan === 'free' && (
                <NavLink
                  to="/pricing"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  activeClassName="text-primary"
                >
                  Pricing
                </NavLink>
              )}
            </nav>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {userEmail && (
                <>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate("/account")}>
                <Settings className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
