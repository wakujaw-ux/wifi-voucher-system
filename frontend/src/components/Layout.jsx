import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ScrollToTop from "./ScrollToTop";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // h-screen inazuia page yote kusogea, overflow-hidden inaficha scrollbar ya nje
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop (Inabaki pale pale) */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden h-full">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar inabaki pale pale */}
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Hapa ndio scroll inatokea */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
          <ScrollToTop />
        </main>
      </div>
    </div>
  );
};

export default Layout;
