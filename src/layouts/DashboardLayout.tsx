import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, selectAuthUser, selectAuthToken, setUser } from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";
import { apiRequest } from "@/lib/api";

const baseNavItems = [
  { path: "/personal-tasks", label: "Personal Tasks" },
  { path: "/group-tasks", label: "Group Tasks" },
  { path: "/portfolio", label: "Portfolio" },
  { path: "/brainstorm", label: "Brainstorm" },
  { path: "/settings", label: "Settings" },
];

const SIDEBAR_WIDTH = 256; // w-64 = 16rem = 256px

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectAuthUser);
  const token = useSelector(selectAuthToken);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    if (!token || user) return;
    apiRequest("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) dispatch(setUser(data.user));
      })
      .catch(() => {});
  }, [token, user, dispatch]);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  const navItems =
    user?.isAdmin === true
      ? [...baseNavItems, { path: "/admin/feedback", label: "Bug Reports" }]
      : baseNavItems;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden bg-background">
      {/* Overlay for mobile when sidebar is open */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeSidebar}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar: drawer on mobile, static on md+ */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out md:static md:z-0 md:translate-x-0 md:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: sidebarOpen ? SIDEBAR_WIDTH : undefined }}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 md:justify-start md:border-0 md:px-4">
          <span className="font-bold text-lg">Admin Dashboard</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {user && (
            <div className="mb-4 truncate text-sm text-muted-foreground" title={user.email}>
              {user.email}
            </div>
          )}
          <nav className="grow space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="mt-4 w-full shrink-0"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar with hamburger: only on mobile/tablet; hidden on md+ */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Menu</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
