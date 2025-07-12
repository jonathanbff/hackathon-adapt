import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarLayout } from "~/components/sidebar-layout";

export default function TopHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </SidebarProvider>
  );
} 