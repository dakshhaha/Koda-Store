"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useParams() as { locale: string };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Credential mismatch or unrecognized identity.");
      }

      const redirectTo = searchParams.get("redirect");
      const target = redirectTo && redirectTo.startsWith("/")
        ? redirectTo
        : `/${locale}`;
        
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-in">
        <div className="auth-header">
          <Link href={`/${locale}`} className="logo" style={{ marginBottom: '1.5rem', display: 'block' }}>
            KODA<span className="logo-accent">STORE</span>
          </Link>
          <h1 className="auth-title">Welcome back.</h1>
          <p className="auth-subtitle">Continue your journey with the Digital Curator.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don&apos;t have an account? <Link href={`/${locale}/auth/signup`}>Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
