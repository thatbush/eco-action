import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}