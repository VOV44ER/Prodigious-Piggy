import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    User,
    Lock,
    Image as ImageIcon,
    Loader2,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AvataaarsPicker } from "@/components/AvataaarsPicker";

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [profile, setProfile] = useState<{
        full_name: string | null;
        avatar_url: string | null;
    } | null>(null);

    const [fullName, setFullName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avataaarsPickerOpen, setAvataaarsPickerOpen] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
                setFullName(data.full_name || "");
                if (data.avatar_url) {
                    setAvatarPreview(data.avatar_url);
                }
            } else {
                setFullName(user.user_metadata?.full_name || "");
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
        }
    };

    const handleAvataaarsSelect = async (avatarUrl: string) => {
        if (!user) return;

        setAvatarLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_url: avatarUrl,
                    full_name: profile?.full_name || fullName || null,
                });

            if (updateError) {
                throw updateError;
            }

            setAvatarPreview(avatarUrl);
            setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);

            window.dispatchEvent(new Event('profile_updated'));

            toast({
                title: "Success",
                description: "Avatar updated successfully",
            });
        } catch (error: any) {
            console.error('Error updating avatar:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update avatar",
                variant: "destructive",
            });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName || null,
                    avatar_url: profile?.avatar_url || null,
                });

            if (error) {
                throw error;
            }

            setProfile(prev => prev ? { ...prev, full_name: fullName } : { full_name: fullName, avatar_url: null });

            window.dispatchEvent(new Event('profile_updated'));

            toast({
                title: "Success",
                description: "Name updated successfully",
            });
        } catch (error: any) {
            console.error('Error updating name:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update name",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                throw error;
            }

            setNewPassword("");
            setConfirmPassword("");

            toast({
                title: "Success",
                description: "Password updated successfully",
            });
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
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

                    <div className="max-w-3xl mx-auto space-y-6">
                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                        >
                            <h1 className="font-display text-4xl font-bold text-foreground mb-2">
                                Profile Settings
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your account settings and preferences
                            </p>
                        </motion.div>

                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                            transition={ { delay: 0.1 } }
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                                            <ImageIcon className="h-5 w-5 text-charcoal-dark" />
                                        </div>
                                        <div>
                                            <CardTitle>Avatar</CardTitle>
                                            <CardDescription>
                                                Create your avatar
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            { avatarPreview ? (
                                                <img
                                                    src={ avatarPreview }
                                                    alt="Avatar"
                                                    className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 bg-gradient-coral rounded-2xl flex items-center justify-center border-2 border-border">
                                                    <User className="h-12 w-12 text-charcoal-dark" />
                                                </div>
                                            ) }
                                            { avatarLoading && (
                                                <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                </div>
                                            ) }
                                        </div>
                                        <div className="flex-1">
                                            <Button
                                                onClick={ () => setAvataaarsPickerOpen(true) }
                                                disabled={ avatarLoading }
                                                variant="outline"
                                            >
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                { avatarLoading ? "Saving..." : "Create Avatar" }
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                            transition={ { delay: 0.2 } }
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                                            <User className="h-5 w-5 text-charcoal-dark" />
                                        </div>
                                        <div>
                                            <CardTitle>Full Name</CardTitle>
                                            <CardDescription>
                                                Update your display name
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={ handleUpdateName } className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input
                                                id="fullName"
                                                value={ fullName }
                                                onChange={ (e) => setFullName(e.target.value) }
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <Button type="submit" disabled={ loading }>
                                            { loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" /> }
                                            Save Changes
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={ { opacity: 0, y: 20 } }
                            animate={ { opacity: 1, y: 0 } }
                            transition={ { delay: 0.3 } }
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                                            <Lock className="h-5 w-5 text-charcoal-dark" />
                                        </div>
                                        <div>
                                            <CardTitle>Change Password</CardTitle>
                                            <CardDescription>
                                                Update your password to keep your account secure
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={ handleUpdatePassword } className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={ newPassword }
                                                onChange={ (e) => setNewPassword(e.target.value) }
                                                placeholder="Enter new password"
                                                minLength={ 6 }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={ confirmPassword }
                                                onChange={ (e) => setConfirmPassword(e.target.value) }
                                                placeholder="Confirm new password"
                                                minLength={ 6 }
                                            />
                                        </div>
                                        <Button type="submit" disabled={ loading }>
                                            { loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" /> }
                                            Update Password
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </main>

            <AvataaarsPicker
                open={ avataaarsPickerOpen }
                onOpenChange={ setAvataaarsPickerOpen }
                onSelect={ handleAvataaarsSelect }
            />
        </div>
    );
}

