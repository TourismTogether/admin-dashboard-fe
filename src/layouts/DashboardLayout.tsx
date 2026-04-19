import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, selectAuthUser, selectAuthToken, setUser } from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { path: "/personal-tasks", label: "Personal Tasks" },
  { path: "/group-tasks", label: "Group Tasks" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/brainstorm", label: "Brainstorm" },
  { path: "/take-note", label: "Take note" },
  { path: "/settings", label: "Settings" },
];
const eventNavItem = { path: "/events", label: "Events" };

const adminExtraNavItems = [
  { path: "/admin/events", label: "Create Event" },
  { path: "/admin/feedback", label: "Feedback" },
];

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectAuthUser);
  const token = useSelector(selectAuthToken);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!token) return;
    apiRequest("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) dispatch(setUser(data.user));
      })
      .catch(() => {});
  }, [token, dispatch]);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const isAdmin = user?.isAdmin === true;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "block w-full px-3 py-2 text-left text-sm transition-colors",
      active
        ? "bg-sidebar-primary/20 font-medium text-sidebar-primary"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/55 hover:text-sidebar-foreground",
    );

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden bg-background">
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeSidebar}
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl shadow-black/20 transition-transform duration-200 ease-out md:static md:z-0 md:translate-x-0 md:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-4 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/25 text-sidebar-primary ring-1 ring-sidebar-primary/40">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 leading-tight">
              <span className="block truncate bg-gradient-to-r from-sidebar-primary to-primary bg-clip-text font-bold tracking-tight text-transparent">
                Admin
              </span>
              <span className="block truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/55">
                Dashboard
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="shrink-0 text-sidebar-foreground/80 hover:bg-sidebar-accent md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden p-3">
          {user && (
            <p className="mb-3 truncate text-xs text-sidebar-foreground/70" title={user.email}>
              {user.email}
            </p>
          )}
          <nav className="-mx-3 grow space-y-0.5 overflow-y-auto">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={navLinkClass(location.pathname === item.path)}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-3 border-t border-sidebar-border/80" />
            <Link
              to={eventNavItem.path}
              onClick={closeSidebar}
              className={navLinkClass(location.pathname === eventNavItem.path)}
            >
              {eventNavItem.label}
            </Link>
            {isAdmin && (
              <>
                <div className="my-3 border-t border-sidebar-border/80" />
                {adminExtraNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={navLinkClass(location.pathname === item.path)}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="mt-4 w-full shrink-0 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-card/90 px-3 backdrop-blur-md md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((o) => !o)}
            className="text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">Menu</span>
        </header>
        <main className="expressive-app-bg flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
