import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { AIAssistantWidget } from "@/components/layout/ai-assistant-widget";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <TopNavbar />
                <main className="flex-1 overflow-y-auto w-full relative">
                    {children}
                </main>
                <AIAssistantWidget />
            </div>
        </div>
    );
}
