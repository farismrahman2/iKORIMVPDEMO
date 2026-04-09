import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    return (
      <div className="min-h-screen bg-ikori-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-ikori-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-ikori-dark mb-2">Unauthorized</h1>
          <p className="text-ikori-muted text-sm mb-6">
            You do not have admin access. Contact an administrator if you believe
            this is an error.
          </p>
          <Link href="/dashboard" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ikori-surface">
      <AdminSidebar userEmail={user.email || ""} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
