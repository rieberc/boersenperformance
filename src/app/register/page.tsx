"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-navy">Konto erstellen</h1>
        <p className="mb-6 text-sm text-muted">
          Verwalte dein Depot an ETFs, Aktien und Crypto an einem Ort.
        </p>

        <Card className="p-5">
          <form action={action} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Name</label>
              <Input name="name" type="text" autoComplete="name" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">E-Mail</label>
              <Input name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Passwort</label>
              <Input name="password" type="password" autoComplete="new-password" required />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? "Wird erstellt…" : "Registrieren"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          Schon ein Konto?{" "}
          <Link href="/login" className="font-semibold text-accent-dark">
            Anmelden
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-muted">
          Erst mal reinschauen?{" "}
          <Link href="/demo" className="font-semibold text-accent-dark">
            Demo ansehen
          </Link>
        </p>
      </div>
    </main>
  );
}
