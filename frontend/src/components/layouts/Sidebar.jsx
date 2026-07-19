import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiMessageSquare,
  FiMessageCircle,
  FiHelpCircle,
  FiLogOut,
  FiPlus,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

// ── Initials Avatar ───────────────────────────────────────────────────────────
const InitialsAvatar = ({ firstName, lastName, size = "w-10 h-10" }) => {
  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  return (
    <div
      className={`${size} rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-indigo-300 font-bold text-sm">{initials}</span>
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Overview",
      icon: <FiTrendingUp />,
      path: "/dashboard",
      active: location.pathname === "/dashboard",
    },
    {
      name: "Create Interview",
      icon: <FiPlus />,
      path: "/dashboard/setup",
      active: location.pathname === "/dashboard/setup",
    },
    {
      name: "Interviews",
      icon: <FiMessageSquare />,
      path: "/dashboard/interviews",
      active: location.pathname === "/dashboard/interviews",
    },
  ];

  const exposureItems = [];

  const bottomItems = [
    { name: "Feedback", icon: <FiMessageCircle />, path: "#" },
    { name: "Help", icon: <FiHelpCircle />, path: "#" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-[#bef264] rounded-lg flex items-center justify-center font-bold text-black text-xl">
          i
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          interviewmate
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        {/* Main Section */}
        <div>
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider px-2 mb-4">
            Main
          </h3>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#bef264]/10 text-[#bef264]"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <span className={item.active ? "text-[#bef264]" : "text-zinc-500"}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Exposure Section */}
        {exposureItems.length > 0 && (
          <div>
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider px-2 mb-4">
              Exposure
            </h3>
            <div className="space-y-1">
              {exposureItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-white/5 space-y-4">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
            >
              <span className="text-zinc-500">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-2 py-2">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.firstName}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <InitialsAvatar firstName={user?.firstName} lastName={user?.lastName} />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-xs font-bold truncate">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}
            </h4>
            <p className="text-zinc-500 text-[10px] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
            title="Sign out"
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
