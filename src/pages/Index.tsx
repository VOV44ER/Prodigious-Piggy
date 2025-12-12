import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { MessageCircle, Map, Heart, Sparkles, Globe, Shield, ChevronRight } from "lucide-react";
import heroDiner from "@/assets/hero-diner.jpg";
import { WorldCoverageHeatmap } from "@/components/WorldCoverageHeatmap";
import { useCountriesCount } from "@/hooks/useCountriesCount";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getFeatures = (countriesCount: number | null) => [
  {
    icon: MessageCircle,
    title: "AI-Powered Discovery",
    description: "Chat with The Piggy to find the perfect spot. Just describe what you're in the mood for.",
  },
  {
    icon: Map,
    title: "Interactive Maps",
    description: "Explore your saved places on a beautiful map with powerful filters.",
  },
  {
    icon: Heart,
    title: "Smart Lists",
    description: "Favourites and Want to Go lists auto-populate from your interactions and reactions.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: countriesCount
      ? `Curated restaurants, bars, cafés, and landmarks across ${countriesCount} countries.`
      : "Curated restaurants, bars, cafés, and landmarks across the world.",
  },
  {
    icon: Sparkles,
    title: "Personalized",
    description: "Your preferences shape future recommendations. The Piggy learns what you love.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "GDPR compliant, cookieless analytics, and EU-hosted data.",
  },
];

export default function Index() {
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const { countriesCount } = useCountriesCount();
  const features = getFeatures(countriesCount);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */ }
      <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
        {/* Background */ }
        <div className="absolute inset-0 bg-gradient-hero">
          <div className="absolute inset-0 bg-charcoal-dark/60" />
          <img
            src={ heroDiner }
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          {/* Decorative elements */ }
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-coral/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-pulse-soft" style={ { animationDelay: "1s" } } />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={ { opacity: 0, y: 30 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { duration: 0.8 } }
            >
              <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-6 leading-tight">
                Discover Places <br />
                <span className="text-gradient">You'll Actually Love</span>
              </h1>

              <p className="text-lg md:text-xl text-cream/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                The Piggy combines trusted human curation with AI-powered discovery. Find hidden gems,
                track your favourites, and get personalised recommendations that improve with every interaction from over 14,000 places.
              </p>

              <div className="mb-10">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={ () => setIsMapDialogOpen(true) }
                >
                  <Map className="h-5 w-5 mr-2" />
                  View the map
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Dialog */ }
      <Dialog open={ isMapDialogOpen } onOpenChange={ setIsMapDialogOpen }>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl font-display">Global Coverage</DialogTitle>
            <DialogDescription>
              { countriesCount
                ? `Explore over 14,000 curated places across ${countriesCount} countries. The heat map shows where The Piggy has coverage.`
                : "Explore over 14,000 curated places across the world. The heat map shows where The Piggy has coverage." }
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-charcoal-dark p-4">
            <div className="w-full h-full min-h-[500px]">
              <WorldCoverageHeatmap />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Features Section */ }
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={ { opacity: 0, y: 20 } }
            whileInView={ { opacity: 1, y: 0 } }
            viewport={ { once: true } }
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Foodies Choose The Piggy
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Traditional discovery tools fail to give you authentic, trustworthy experiences.
              The Piggy is different.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            { features.map((feature, index) => (
              <motion.div
                key={ feature.title }
                initial={ { opacity: 0, y: 20 } }
                whileInView={ { opacity: 1, y: 0 } }
                viewport={ { once: true } }
                transition={ { delay: index * 0.1 } }
                className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  { feature.title }
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  { feature.description }
                </p>
              </motion.div>
            )) }
          </div>
        </div>
      </section>

      {/* Sample Places Section */ }
      <section className="py-24 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={ { opacity: 0, y: 20 } }
            whileInView={ { opacity: 1, y: 0 } }
            viewport={ { once: true } }
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Curated by Experts, Enhanced by AI
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every place in The Piggy is hand-selected and verified. Here's a taste of what you'll discover.
            </p>
          </motion.div>

          <motion.div
            initial={ { opacity: 0 } }
            whileInView={ { opacity: 1 } }
            viewport={ { once: true } }
            className="text-center mt-12"
          >
            <Link to="/chat">
              <Button size="lg">
                Discover More Places
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */ }
      <section className="py-24 bg-charcoal-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-coral/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-coral/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={ { opacity: 0, scale: 0.95 } }
            whileInView={ { opacity: 1, scale: 1 } }
            viewport={ { once: true } }
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-cream mb-6">
              Ready to Discover Your Next <span className="text-gradient">Favourite Spot?</span>
            </h2>
            <p className="text-cream/60 text-lg mb-10">
              Join other foodies and start eating like a prodigious piggy!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
            <p className="text-cream/40 text-sm mt-6">
              No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
