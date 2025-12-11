import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  User,
  Heart,
  Plus,
  MapPin,
  Settings,
  CreditCard,
  Gift,
  ChevronRight,
  Mail,
  BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserReactionsForPlaces } from "@/hooks/useReactions";
import { casablancaPlaces } from "@/data/casablanca-places";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user } = useAuth();
  const [favouritesCount, setFavouritesCount] = useState(0);
  const [wantToGoCount, setWantToGoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hometown, setHometown] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadReactions = useCallback(async () => {
    try {
      if (user) {
        const placeNames = casablancaPlaces.map(p => p.name);
        const reactions = await getUserReactionsForPlaces(user.id, placeNames);

        const favourites = Object.values(reactions).filter(r => r.favourites).length;
        const wantToGo = Object.values(reactions).filter(r => r.wantToGo).length;

        setFavouritesCount(favourites);
        setWantToGoCount(wantToGo);
      } else {
        const reactions = localStorage.getItem('place_reactions');
        if (reactions) {
          const parsed = JSON.parse(reactions);
          let favourites = 0;
          let wantToGo = 0;

          Object.values(parsed).forEach((placeReactions: any) => {
            if (placeReactions.heart || placeReactions.love) {
              favourites++;
            }
            if (placeReactions.bookmark || placeReactions.want_to_go) {
              wantToGo++;
            }
          });

          setFavouritesCount(favourites);
          setWantToGoCount(wantToGo);
        }
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);


  const loadUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, location')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        if (data.full_name) {
          setFirstName(data.full_name);
        }
        if (data.username) {
          setUsername(data.username);
        }
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
        if (data.location) {
          setHometown(data.location);
        }
      }

      if (!firstName && user.user_metadata?.full_name) {
        setFirstName(user.user_metadata.full_name);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [user, firstName]);

  useEffect(() => {
    loadReactions();
    loadUserProfile();

    const handleReactionsUpdate = () => {
      loadReactions();
    };

    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    window.addEventListener('place_reactions_updated', handleReactionsUpdate);
    window.addEventListener('profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('place_reactions_updated', handleReactionsUpdate);
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, [loadReactions, loadUserProfile]);

  const stats = [
    { label: "Favourites", value: favouritesCount, icon: Heart, color: "text-coral" },
    { label: "Want to Go", value: wantToGoCount, icon: Plus, color: "text-gold" },
  ];

  const menuItems = [
    {
      section: "My Lists",
      items: [
        { label: "Favourites", icon: Heart, href: "/map?list=favourites", badge: favouritesCount },
        { label: "Want to Go", icon: Plus, href: "/map?list=want_to_go", badge: wantToGoCount },
        { label: "Piggy Passport", icon: BookOpen, href: "/passport" },
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Subscription", icon: CreditCard, href: "/subscription", badge: "Pro" },
        { label: "Referral Program", icon: Gift, href: "/referrals" },
      ],
    },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        {/* Header */ }
        <div className="bg-gradient-hero">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              initial={ { opacity: 0, y: 20 } }
              animate={ { opacity: 1, y: 0 } }
              className="flex flex-col md:flex-row items-center gap-6"
            >
              {/* Avatar */ }
              { avatarUrl ? (
                <img
                  src={ avatarUrl }
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover shadow-elevated border-2 border-cream/20"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-coral rounded-2xl flex items-center justify-center shadow-elevated">
                  <User className="h-12 w-12 text-charcoal-dark" />
                </div>
              ) }

              {/* User Info */ }
              <div className="text-center md:text-left">
                <h1 className="font-display text-3xl font-bold text-cream mb-1">
                  { firstName ? `Welcome Back, ${firstName}!` : "Welcome Back!" }
                </h1>
                { username && (
                  <p className="text-cream/80 text-sm mb-1">
                    @{ username }
                  </p>
                ) }
                <p className="text-cream/60 flex items-center justify-center md:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  { user?.email || "Not signed in" }
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-coral/20 text-coral-light text-sm font-medium rounded-full">
                    Pro Member
                  </span>
                  { hometown ? (
                    <span className="px-3 py-1 bg-cream/10 text-cream/60 text-sm rounded-full flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      { hometown }
                    </span>
                  ) : null }
                </div>
              </div>

              {/* Edit Button */ }
              <div className="md:ml-auto">
                <Link to="/settings">
                  <Button variant="hero-outline" size="sm">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */ }
        <div className="container mx-auto px-4 -mt-6">
          <motion.div
            initial={ { opacity: 0, y: 20 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { delay: 0.1 } }
            className="bg-card rounded-2xl shadow-card border border-border p-6"
          >
            <div className="grid grid-cols-2 gap-4">
              { stats.map((stat) => (
                <div key={ stat.label } className="text-center">
                  <div className={ cn("inline-flex mb-2", stat.color) }>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    { stat.value }
                  </div>
                  <div className="text-sm text-muted-foreground">{ stat.label }</div>
                </div>
              )) }
            </div>
          </motion.div>
        </div>

        {/* Menu */ }
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            { menuItems.map((section, sectionIndex) => (
              <motion.div
                key={ section.section }
                initial={ { opacity: 0, y: 20 } }
                animate={ { opacity: 1, y: 0 } }
                transition={ { delay: 0.2 + sectionIndex * 0.1 } }
              >
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  { section.section }
                </h2>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  { section.items.map((item, index) => (
                    <Link
                      key={ item.label }
                      to={ item.href }
                      className={ cn(
                        "flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors",
                        index > 0 && "border-t border-border"
                      ) }
                    >
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="flex-1 font-medium text-foreground">
                        { item.label }
                      </span>
                      { item.badge && (
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                          { item.badge }
                        </span>
                      ) }
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  )) }
                </div>
              </motion.div>
            )) }

            {/* Referral Banner */ }
            <motion.div
              initial={ { opacity: 0, y: 20 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { delay: 0.4 } }
              className="bg-gradient-coral rounded-2xl p-6 text-charcoal-dark"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-charcoal-dark/10 rounded-xl flex items-center justify-center">
                  <Gift className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg">
                    Invite Friends, Get Free Months!
                  </h3>
                  <p className="text-charcoal-dark/70 text-sm">
                    Refer 5 friends and earn +1 month free subscription.
                  </p>
                </div>
                <Button variant="outline" className="border-charcoal-dark/30 text-charcoal-dark hover:bg-charcoal-dark/10">
                  Share Link
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
