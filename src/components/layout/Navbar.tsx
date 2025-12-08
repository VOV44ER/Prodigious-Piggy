import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle, Map, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const navLinks = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/map", label: "Map", icon: Map },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */ }
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={ logo }
            alt="The Prodigious Piggy"
            className="h-8 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation */ }
        { isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            { navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link key={ link.href } to={ link.href }>
                  <Button
                    variant="ghost"
                    className={ cn(
                      "gap-2",
                      isActive && "bg-accent text-accent-foreground"
                    ) }
                  >
                    <Icon className="h-4 w-4" />
                    { link.label }
                  </Button>
                </Link>
              );
            }) }
          </div>
        ) }

        {/* CTA Buttons */ }
        <div className="hidden md:flex items-center gap-3">
          { isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={ handleSignOut }>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          ) }
        </div>

        {/* Mobile Menu Button */ }
        <button
          className="md:hidden p-2 text-foreground"
          onClick={ () => setMobileMenuOpen(!mobileMenuOpen) }
        >
          { mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" /> }
        </button>
      </nav>

      {/* Mobile Menu */ }
      <AnimatePresence>
        { mobileMenuOpen && (
          <motion.div
            initial={ { opacity: 0, height: 0 } }
            animate={ { opacity: 1, height: "auto" } }
            exit={ { opacity: 0, height: 0 } }
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              { isAuthenticated && navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={ link.href }
                    to={ link.href }
                    onClick={ () => setMobileMenuOpen(false) }
                  >
                    <Button
                      variant="ghost"
                      className={ cn(
                        "w-full justify-start gap-2",
                        isActive && "bg-accent"
                      ) }
                    >
                      <Icon className="h-4 w-4" />
                      { link.label }
                    </Button>
                  </Link>
                );
              }) }
              <div className="flex gap-2 pt-4 border-t border-border mt-2">
                { isAuthenticated ? (
                  <Button variant="outline" className="w-full" onClick={ () => { handleSignOut(); setMobileMenuOpen(false); } }>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1" onClick={ () => setMobileMenuOpen(false) }>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth" className="flex-1" onClick={ () => setMobileMenuOpen(false) }>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                ) }
              </div>
            </div>
          </motion.div>
        ) }
      </AnimatePresence>
    </header>
  );
}
