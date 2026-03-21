import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from '@/components/navbar'

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}): Promise<React.ReactElement> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
            <Navbar />
            <main className="page-content pt-[100px]">
                {children}
            </main>
        </div>
    );
}