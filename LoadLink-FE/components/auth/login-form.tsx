"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FadeIn } from "@/components/ui/fade-in";
import { SlideIn } from "@/components/ui/slide-in";
import { useAuth } from "@/contexts/auth-context";
import { loginApi } from "@/lib/auth";
import { Truck, Package } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await loginApi(email, password);
      login(user);
      if (user.role === "shipper") router.push("/shipper/dashboard");
      else router.push("/carrier/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FadeIn>
      <Card className="w-full max-w-md mx-auto transform hover:scale-105 transition-all duration-300">
        <CardHeader className="text-center">
          <SlideIn direction="down" delay={0.2}>
            <div className="flex justify-center mb-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-8 w-8 text-blue-600 animate-pulse" />
                <span className="text-2xl font-bold">LoadLink</span>
              </div>
            </div>
          </SlideIn>
          <FadeIn delay={0.4}>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your LoadLink account</CardDescription>
          </FadeIn>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SlideIn direction="left" delay={0.6}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
            </SlideIn>

            <SlideIn direction="right" delay={0.8}>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
            </SlideIn>

            {error && (
              <FadeIn>
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </FadeIn>
            )}

            <SlideIn direction="up" delay={1.0}>
              <Button
                type="submit"
                className="w-full transform hover:scale-105 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </SlideIn>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
