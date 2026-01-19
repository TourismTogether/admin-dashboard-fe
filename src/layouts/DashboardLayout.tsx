import React from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { logout, selectAuthUser } from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectAuthUser);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { path: "/personal-tasks", label: "Personal Tasks" },
    { path: "/group-tasks", label: "Group Tasks" },
  ];

  return (
    <div className="dashboard-layout flex h-screen">
      <aside className="w-64 bg-gray-100 p-4 border-r border-gray-300 flex flex-col">
        <div className="font-bold text-xl mb-4">Admin Dashboard</div>
        {user && (
          <div className="text-sm text-gray-600 mb-4">
            {user.email}
          </div>
        )}
        <nav className="flex-grow space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button onClick={handleLogout} variant="outline" className="mt-auto">
          Logout
        </Button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
