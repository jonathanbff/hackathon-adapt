import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { UserProfile } from "~/components/user-profile";
import { CopilotKit } from "@copilotkit/react-core";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-surface">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-end px-6">
            <UserProfile />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <CopilotKit
              runtimeUrl="http://localhost:4000/copilotkit"
              agent="sample_agent"
            >
              {children}
            </CopilotKit>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
