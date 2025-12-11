import { Navbar } from "@/components/layout/Navbar";
import { PiggyPassport } from "@/components/PiggyPassport";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PassportPage() {
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

                    <motion.div
                        initial={ { opacity: 0, y: 20 } }
                        animate={ { opacity: 1, y: 0 } }
                        className="max-w-4xl mx-auto"
                    >
                        <PiggyPassport />
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

