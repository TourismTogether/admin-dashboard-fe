import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
const isDev = import.meta.env.DEV;
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import "./index.css";
import { store } from "./store/store";
import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PersonalTaskPage from "./pages/PersonalTaskPage";
import GroupTaskPage from "./pages/GroupTaskPage";
import PortfolioPage from "./pages/PortfolioPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SelfStudyPage from "./pages/SelfStudyPage";
import SettingsPage from "./pages/SettingsPage";
import BrainstormPage from "./pages/BrainstormPage";
import TakeNotePage from "./pages/TakeNotePage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import EventsPage from "./pages/EventsPage";
import AdminEventsPage from "./pages/AdminEventsPage";
import ShareTablePage from "./pages/ShareTablePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

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
            path: "group-tasks/:groupId",
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
            path: "leaderboard",
            element: (
              <ProtectedRoute>
                <LeaderboardPage />
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
            path: "settings",
            element: (
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "brainstorm",
            element: (
              <ProtectedRoute>
                <BrainstormPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "take-note",
            element: (
              <ProtectedRoute>
                <TakeNotePage />
              </ProtectedRoute>
            ),
          },
          {
            path: "events",
            element: (
              <ProtectedRoute>
                <EventsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "admin/events",
            element: (
              <ProtectedRoute>
                <AdminRoute>
                  <AdminEventsPage />
                </AdminRoute>
              </ProtectedRoute>
            ),
          },
          {
            path: "admin/feedback",
            element: (
              <ProtectedRoute>
                <AdminRoute>
                  <AdminFeedbackPage />
                </AdminRoute>
              </ProtectedRoute>
            ),
          },
          {
            index: true,
            element: <Navigate to="/personal-tasks" replace />,
          },
        ],
      },
      // Share table page (same sidebar layout; login required)
      {
        path: "share",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "table/:shareId",
            element: <ShareTablePage />,
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
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-border/80 font-sans shadow-lg shadow-primary/10",
            },
          }}
        />
        {isDev && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
