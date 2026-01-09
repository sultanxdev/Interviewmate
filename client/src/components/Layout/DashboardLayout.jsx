import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../Logo";
import {
  Brain,
  Home,
  Play,
  History,
  BarChart3,
  User,
  CreditCard,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Zap,
  Globe,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Setup Interview", href: "/interview/setup", icon: Play },
    { name: "Reports", href: "/history", icon: History },
    { name: "Performance Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Add admin navigation if user is admin
  if (user?.isAdmin) {
    navigation.push({ name: "Admin Panel", href: "/admin", icon: Shield });
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const isActive = (href) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:inset-y-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/dashboard">
              <Logo size="md" showText={true} />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 p-1 rounded-2xl bg-slate-50 border border-slate-100 shadow-soft">
              <img
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=3b66f5&color=fff&bold=true`
                }
                alt={user?.name}
                className="w-10 h-10 rounded-xl"
              />
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-wider">
                  {user?.name}
                </p>
                <div className="flex items-center text-[10px] text-slate-500 font-medium truncate">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Subscription info */}
            <div className="mt-4 p-3 bg-brand-50/50 border border-brand-100 rounded-xl">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-brand-600 font-bold uppercase tracking-tight">Active Plan</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${user?.subscription?.plan === "pro"
                    ? "bg-brand-500 text-white"
                    : "bg-slate-200 text-slate-600"
                    }`}
                >
                  {user?.subscription?.plan === "pro" ? "Pro" : "Free"}
                </span>
              </div>
              <div className="h-1 w-full bg-brand-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-brand-500 w-2/3"></div>
              </div>
              {user?.subscription?.plan === "free" && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">VAPI Minutes</span>
                  <span className="font-bold text-brand-700">
                    {user?.subscription?.vapiMinutesRemaining || 0}
                  </span>
                </div>
              )}
              {user?.subscription?.plan === "pro" && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Balance</span>
                  <span className="font-bold text-emerald-600">
                    ${(user?.subscription?.payAsYouGoBalance || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link-v2 ${isActive(item.href)
                  ? "sidebar-link-active-v2"
                  : "sidebar-link-inactive-v2"
                  }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive(item.href) ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "User"
                    )}&background=3b66f5&color=fff&bold=true`
                  }
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all border border-slate-200 shadow-soft"
                  onClick={() => navigate("/profile")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
