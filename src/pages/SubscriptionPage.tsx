import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    Check,
    ArrowLeft,
    Crown,
    Building2,
    Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PlanFeature {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: PlanFeature[];
    popular?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgGradient: string;
}

const plans: Plan[] = [
    {
        id: "free",
        name: "Free",
        description: "Perfect for exploring places",
        price: {
            monthly: 0,
            yearly: 0,
        },
        features: [
            { label: "Browse places" },
            { label: "Save favorites" },
            { label: "Want to go list" },
            { label: "Basic filters" },
        ],
        icon: Heart,
        color: "text-sage",
        bgGradient: "from-sage/20 to-sage/10",
    },
    {
        id: "pro",
        name: "Pro",
        description: "For food enthusiasts",
        price: {
            monthly: 9.99,
            yearly: 99.99,
        },
        features: [
            { label: "Everything in Free" },
            { label: "Unlimited favorites" },
            { label: "Advanced filters" },
            { label: "AI-powered recommendations" },
            { label: "Priority support" },
            { label: "Export lists" },
        ],
        popular: true,
        icon: Crown,
        color: "text-coral",
        bgGradient: "from-coral/20 to-coral/10",
    },
    {
        id: "business",
        name: "Business",
        description: "For teams and businesses",
        price: {
            monthly: 29.99,
            yearly: 299.99,
        },
        features: [
            { label: "Everything in Pro" },
            { label: "Team collaboration" },
            { label: "Custom lists" },
            { label: "Analytics dashboard" },
            { label: "API access" },
            { label: "Dedicated support" },
        ],
        icon: Building2,
        color: "text-gold",
        bgGradient: "from-gold/20 to-gold/10",
    },
];

export default function SubscriptionPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const handleSubscribe = (planId: string) => {
        if (planId === "free") {
            return;
        }
        console.log(`Subscribe to ${planId} - ${billingCycle}`);
    };

    const formatPrice = (price: number) => {
        if (price === 0) return "Free";
        return `$${price.toFixed(2)}`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pt-16">
                <div className="container mx-auto px-4 py-8">
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Profile
                    </Link>

                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                            className="text-center mb-12"
                        >
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                                Choose Your Plan
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Unlock the full potential of discovering amazing places around the world
                            </p>
                        </motion.div>

                        <div className="flex justify-center mb-8">
                            <div className="inline-flex bg-secondary rounded-full p-1">
                                <button
                                    onClick={ () => setBillingCycle("monthly") }
                                    className={ cn(
                                        "px-6 py-2 rounded-full text-sm font-medium transition-all",
                                        billingCycle === "monthly"
                                            ? "bg-card text-foreground shadow-soft"
                                            : "text-muted-foreground hover:text-foreground"
                                    ) }
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={ () => setBillingCycle("yearly") }
                                    className={ cn(
                                        "px-6 py-2 rounded-full text-sm font-medium transition-all relative",
                                        billingCycle === "yearly"
                                            ? "bg-card text-foreground shadow-soft"
                                            : "text-muted-foreground hover:text-foreground"
                                    ) }
                                >
                                    Yearly
                                    <span className="ml-2 px-2 py-0.5 bg-coral/20 text-coral text-xs font-medium rounded-full">
                                        Save 17%
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            { plans.map((plan, index) => {
                                const Icon = plan.icon;
                                const price = billingCycle === "monthly" ? plan.price.monthly : plan.price.yearly;

                                return (
                                    <motion.div
                                        key={ plan.id }
                                        initial={ { opacity: 0, y: 20 } }
                                        animate={ { opacity: 1, y: 0 } }
                                        transition={ { delay: index * 0.1 } }
                                        className={ cn(
                                            "relative bg-card rounded-2xl border-2 p-6 flex flex-col",
                                            plan.popular
                                                ? "border-coral shadow-elevated scale-105 md:scale-100"
                                                : "border-border"
                                        ) }
                                    >
                                        { plan.popular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-coral text-charcoal-dark text-xs font-bold rounded-full">
                                                Most Popular
                                            </div>
                                        ) }

                                        <div className={ cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.bgGradient) }>
                                            <Icon className={ cn("h-6 w-6", plan.color) } />
                                        </div>

                                        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                                            { plan.name }
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-6">{ plan.description }</p>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-display text-4xl font-bold text-foreground">
                                                    { formatPrice(price) }
                                                </span>
                                                { billingCycle === "yearly" && price > 0 && (
                                                    <span className="text-muted-foreground text-sm">
                                                        /month
                                                    </span>
                                                ) }
                                                { billingCycle === "monthly" && price > 0 && (
                                                    <span className="text-muted-foreground text-sm">/month</span>
                                                ) }
                                            </div>
                                            { billingCycle === "yearly" && price > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Billed ${ plan.price.yearly.toFixed(2) } annually
                                                </p>
                                            ) }
                                        </div>

                                        <ul className="flex-1 space-y-3 mb-6">
                                            { plan.features.map((feature, featureIndex) => (
                                                <li key={ featureIndex } className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-foreground">{ feature.label }</span>
                                                </li>
                                            )) }
                                        </ul>

                                        <Button
                                            onClick={ () => handleSubscribe(plan.id) }
                                            variant={ plan.popular ? "default" : "outline" }
                                            className={ cn(
                                                "w-full",
                                                plan.popular && "bg-gradient-coral text-charcoal-dark hover:opacity-90"
                                            ) }
                                            disabled={ plan.id === "free" }
                                        >
                                            { plan.id === "free" ? "Current Plan" : "Subscribe" }
                                        </Button>
                                    </motion.div>
                                );
                            }) }
                        </div>

                        <motion.div
                            initial={ { opacity: 0 } }
                            animate={ { opacity: 1 } }
                            transition={ { delay: 0.4 } }
                            className="bg-card rounded-2xl border border-border p-8"
                        >
                            <h2 className="font-display text-2xl font-bold text-foreground mb-6 text-center">
                                Frequently Asked Questions
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Can I change plans later?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        We accept all major credit cards and PayPal through our secure payment partner Paddle.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Is there a free trial?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        All paid plans come with a 14-day free trial. Cancel anytime during the trial with no charges.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

