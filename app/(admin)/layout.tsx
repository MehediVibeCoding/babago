import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen w-full flex-col md:flex-row">
        <Sidebar />
        <main
          className="min-w-0 flex-1 overflow-x-hidden px-4 pt-4 sm:px-6 md:px-8 md:pt-6 md:pb-8"
          style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
