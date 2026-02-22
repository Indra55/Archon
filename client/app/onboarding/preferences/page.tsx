"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface Preferences {
  language: string;
  codebaseSize: string;
  primaryLanguage: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    language: "english",
    codebaseSize: "medium",
    primaryLanguage: "typescript",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, loading, isAuthenticated, router]);

  const handleNext = () => {
    // Save preferences to localStorage
    localStorage.setItem("onboarding_preferences", JSON.stringify(preferences));
    router.push("/onboarding/complete");
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="space-y-8">
          {/* Progress */}
          <div className="flex gap-2">
            <div className="h-1 flex-1 bg-accent rounded-full" />
            <div className="h-1 flex-1 bg-accent rounded-full" />
            <div className="h-1 flex-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-[var(--font-bebas)]">
              Your Preferences
            </h1>
            <p className="text-muted-foreground">
              Help us personalize your experience
            </p>
          </div>

          {/* Preferences Card */}
          <Card className="border border-border p-8 space-y-6 bg-card">
            {/* Language */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Language</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "english", label: "English" },
                  { value: "spanish", label: "Spanish" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({ ...preferences, language: option.value })
                    }
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                      preferences.language === option.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-foreground hover:border-accent/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Codebase Size */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Codebase Size</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        codebaseSize: option.value,
                      })
                    }
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                      preferences.codebaseSize === option.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-foreground hover:border-accent/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Language */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Primary Programming Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "typescript", label: "TypeScript" },
                  { value: "python", label: "Python" },
                  { value: "go", label: "Go" },
                  { value: "rust", label: "Rust" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        primaryLanguage: option.value,
                      })
                    }
                    className={`py-2 px-3 rounded border text-sm font-medium transition-colors ${
                      preferences.primaryLanguage === option.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-foreground hover:border-accent/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-accent hover:bg-accent/90 text-background"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
