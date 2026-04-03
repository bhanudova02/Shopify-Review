import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 md:flex">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
