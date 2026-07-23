import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTransactions } from "@/lib/portfolio/transactions";
import { ActivityList } from "@/components/activity/ActivityList";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const transactions = await getTransactions(session.user.id);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-10">
      <header className="safe-top flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          href="/dashboard"
          aria-label="Zurück"
          className="rounded-full p-2 text-navy hover:bg-black/5"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-navy">Aktivitäten</h1>
      </header>

      <main className="px-5">
        <ActivityList initialTransactions={transactions} />
      </main>
    </div>
  );
}
