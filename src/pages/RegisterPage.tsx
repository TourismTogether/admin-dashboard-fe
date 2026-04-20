import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import {
  registerStart,
  registerSuccess,
  registerFailure,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";
import { API_URL } from "@/lib/api";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");

  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/personal-tasks");
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(registerStart());

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          account,
          nickname: nickname || undefined,
          fullname: fullname || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      dispatch(
        registerSuccess({
          token: data.access_token,
          user: data.user,
        }),
      );
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error && apiError.message
          ? apiError.message
          : "Registration failed. Please try again.";
      dispatch(registerFailure(errorMessage));
    }
  };

  return (
    <div className="expressive-app-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-secondary/40 blur-3xl"
        aria-hidden
      />
      <Card className="relative w-full max-w-md border-primary/15 shadow-2xl shadow-primary/15">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-2 ring-primary/25">
              <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Duckilot Admin Dashboard
            </span>
          </div>
          <CardTitle className="text-2xl text-center">Sign up</CardTitle>
          <CardDescription className="text-center">
            Create a new account to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Input
                id="account"
                type="text"
                placeholder="Enter your account name"
                value={account}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAccount(e.target.value)
                }
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters, one uppercase, one lowercase, and one
                special character
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name (Optional)</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Enter your full name"
                value={fullname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFullname(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (Optional)</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNickname(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
