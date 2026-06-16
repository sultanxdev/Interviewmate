import "./App.css";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Auth context
import { useAuth } from "./context/AuthContext";

// Components & Pages
import Homepage from "./pages/Homepage";
import InterviewLayout from "./layout/InterviewLayout";
import InterviewSession from "./pages/InterviewSession";
import CreateInterview from "./pages/CreateInterview";
import PastInterviews from "./pages/PastInterviews";
import InterviewResult from "./pages/InterviewResult";
import DashboardOverview from "./pages/DashboardOverview";
import Layout from "./components/layouts/layout";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import { InterviewProvider } from "./context/InterviewContext";

// ── Protected Route wrapper ──────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null; // wait for auth to restore from localStorage
  return isSignedIn ? <Outlet /> : <Navigate to="/signin" replace />;
};

function App() {
  const { isSignedIn } = useAuth();
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // Health check
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    fetch(`${backendUrl}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error("Offline");
        return res.json();
      })
      .then((data) => {
        if (data.status === "OK" || data.message) {
          setBackendStatus("System Online");
        } else {
          setBackendStatus("System Offline");
        }
      })
      .catch(() => {
        setBackendStatus("System Offline");
      });
  }, []);

  return (
    <InterviewProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Homepage */}
        <Route
          path="/"
          element={
            <Layout backendStatus={backendStatus}>
              <Homepage backendStatus={backendStatus} />
            </Layout>
          }
        />

        {/* Auth pages */}
        <Route
          path="/signin"
          element={isSignedIn ? <Navigate to="/dashboard" replace /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={isSignedIn ? <Navigate to="/dashboard" replace /> : <SignUp />}
        />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<InterviewLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="setup" element={<CreateInterview />} />
            <Route path="interviews" element={<PastInterviews />} />
            <Route path="result/:sessionId" element={<InterviewResult />} />
          </Route>

          <Route path="/interview" element={<InterviewLayout />}>
            <Route index element={<Navigate to="setup" replace />} />
            <Route path="setup" element={<CreateInterview />} />
            <Route path="result/:sessionId" element={<InterviewResult />} />
          </Route>

          <Route path="/session" element={<InterviewSession />} />
          <Route path="/session/:sessionId" element={<InterviewSession />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InterviewProvider>
  );
}

export default App;
