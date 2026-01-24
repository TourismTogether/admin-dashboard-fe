import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import "./index.css";
import { store } from "./store/store";
import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PersonalTaskPage from "./pages/PersonalTaskPage";
import GroupTaskPage from "./pages/GroupTaskPage";
import PortfolioPage from "./pages/PortfolioPage";
import SelfStudyPage from "./pages/SelfStudyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "personal-tasks",
            element: (
              <ProtectedRoute>
                <PersonalTaskPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "group-tasks",
            element: (
              <ProtectedRoute>
                <GroupTaskPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "portfolio",
            element: (
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "self-study",
            element: (
              <ProtectedRoute>
                <SelfStudyPage />
              </ProtectedRoute>
            ),
          },
          {
            index: true,
            element: <Navigate to="/personal-tasks" replace />,
          },
        ],
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors closeButton position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
