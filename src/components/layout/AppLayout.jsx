import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Hotel,
  Phone,
  LogOut,
  Menu,
  X,
  Palmtree,
  CalendarRange
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "لوحة التحكم", path: "/", icon: LayoutDashboard },
  { label: "الضيوف", path: "/guests", icon: Users },
  { label: "الحجوزات", path: "/reservations", icon: CalendarDays },
  { label: "الوحدات", path: "/units", icon: Hotel },
  { label: "المكالمات", path: "/calls", icon: Phone },
  { label: "التقويم", path: "/calendar", icon: CalendarRange },
];

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-bl from-stone-50 via-white to-amber-50/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palmtree className="w-6 h-6 text-amber-600" />
          <span className="font-heading font-bold text-stone-800">رحائل</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 z-50 h-full w-64 bg-white/90 backdrop-blur-xl border-l border-stone-200/60 shadow-2xl shadow-stone-200/20 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-8 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
                <Palmtree className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-stone-800 tracking-tight">رحائل</h1>
                <p className="text-[11px] text-amber-500 font-semibold tracking-wide">للمنتجعات السياحية</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-l from-amber-50 to-amber-100/80 text-amber-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-amber-600" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-stone-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-400 hover:text-red-500 hover:bg-red-50/50 transition-all w-full"
            >
              <LogOut className="w-[18px] h-[18px]" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:mr-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}