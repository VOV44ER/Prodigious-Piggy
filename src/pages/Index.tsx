import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PlaceCard } from "@/components/place/PlaceCard";
import { motion } from "framer-motion";
import { MessageCircle, Map, Heart, Sparkles, Globe, Shield, ChevronRight } from "lucide-react";
import heroDiner from "@/assets/hero-diner.jpg";
import { casablancaPlaces } from "@/data/casablanca-places";

const features = [
  {
    icon: MessageCircle,
    title: "AI-Powered Discovery",
    description: "Chat with Piggy to find the perfect spot. Just describe what you're in the mood for.",
  },
  {
    icon: Map,
    title: "Interactive Maps",
    description: "Explore your saved places on a beautiful map with powerful filters.",
  },
  {
    icon: Heart,
    title: "Smart Lists",
    description: "Favourites and Want to Go lists auto-populate from your reactions.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Curated restaurants, bars, cafés, and landmarks across the world.",
  },
  {
    icon: Sparkles,
    title: "Personalized",
    description: "Your preferences shape future recommendations. Piggy learns what you love.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "GDPR compliant, cookieless analytics, and EU-hosted data.",
  },
];

const samplePlaces = casablancaPlaces.slice(0, 3);

export default function Index() {
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
              <span className="inline-block px-4 py-1.5 bg-coral/20 text-coral-light text-sm font-medium rounded-full mb-6 backdrop-blur-sm border border-coral/30">
                🐷 AI-Powered Foodie Discovery
              </span>

              <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-6 leading-tight">
                Discover Places <br />
                <span className="text-gradient">You'll Actually Love</span>
              </h1>

              <p className="text-lg md:text-xl text-cream/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                Piggy combines trusted curation with AI-powered discovery. Find hidden gems,
                track your favourites, and get personalized recommendations that improve with every interaction.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button variant="hero" size="xl">
                    Start Free Trial
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button variant="hero-outline" size="xl">
                    <MessageCircle className="h-5 w-5" />
                    Try the Chat
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */ }
        <motion.div
          initial={ { opacity: 0 } }
          animate={ { opacity: 1 } }
          transition={ { delay: 1.5 } }
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-cream/30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={ { y: [0, 8, 0] } }
              transition={ { repeat: Infinity, duration: 1.5 } }
              className="w-1.5 h-1.5 bg-cream/50 rounded-full"
            />
          </div>
        </motion.div>
      </section>

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
              Why Foodies Choose Piggy
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Traditional discovery tools fail to give you flexible, trustworthy experiences.
              Piggy is different.
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
              Every place in Piggy is hand-selected and verified. Here's a taste of what you'll discover.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            { samplePlaces.map((place, index) => (
              <motion.div
                key={ place.name }
                initial={ { opacity: 0, y: 20 } }
                whileInView={ { opacity: 1, y: 0 } }
                viewport={ { once: true } }
                transition={ { delay: index * 0.15 } }
              >
                <PlaceCard { ...place } />
              </motion.div>
            )) }
          </div>

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
              Join thousands of foodies who trust Piggy for their culinary adventures.
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
