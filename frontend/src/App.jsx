import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Pages
import Homepage from "./pages/HomePage";
import Interviews from "./pages/Interviews";
import ScheduleInterview from "./pages/ScheduleInterview";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewResult from "./pages/InterviewResult";
import AddFeedback from "./pages/AddFeedback";
import ViewFeedback from "./pages/ViewFeedback";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Chatbot from "./pages/Chatbot";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import CompaniesPage from "./pages/CompaniesPage";
import PricingPage from "./pages/PricingPage";
import AssistantWidget from "./components/common/AssistantWidget";
import Settings from "./pages/Settings";
import DsaPractice from "./pages/DsaPractice";
import { useAuth } from "./context/useAuth";

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, [pathname]);

  useEffect(() => {
    const resetScroll = window.setTimeout(() => {
      const previousBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = previousBehavior;
    }, 0);

    return () => window.clearTimeout(resetScroll);
  }, [pathname]);

  return null;
}

function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isActiveInterview = pathname.startsWith("/interview/");

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* 🟢 PUBLIC PAGES - Anyone can access */}
        <Route path="/" element={<Homepage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔴 PROTECTED PAGES - Only logged-in users */}
        <Route 
          path="/chatbot" 
          element={<ProtectedRoute><Chatbot /></ProtectedRoute>} 
        />
        <Route 
          path="/interviews" 
          element={<ProtectedRoute><Interviews /></ProtectedRoute>} 
        />
        <Route 
          path="/schedule-interview" 
          element={<ProtectedRoute><ScheduleInterview /></ProtectedRoute>} 
        />
        <Route 
          path="/interview/:id" 
          element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} 
        />
        <Route 
          path="/interview-result/:id" 
          element={<ProtectedRoute><InterviewResult /></ProtectedRoute>} 
        />
        
        {/* 🔴 ADMIN ONLY PAGES - Only admins can access */}
        <Route 
          path="/add-feedback" 
          element={<AdminRoute><AddFeedback /></AdminRoute>} 
        />
        <Route 
          path="/add-feedback/:id" 
          element={<AdminRoute><AddFeedback /></AdminRoute>} 
        />
        
        {/* 🔴 PROTECTED PAGES - All logged-in users can view feedback */}
        <Route 
          path="/view-feedback" 
          element={<ProtectedRoute><ViewFeedback /></ProtectedRoute>} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute><Profile /></ProtectedRoute>} 
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
        <Route
          path="/dsa-practice"
          element={<DsaPractice />}
        />
      </Routes>
      {user && !isActiveInterview && <AssistantWidget />}
    </Router>
  );
}

export default App;