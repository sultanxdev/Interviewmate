import React from "react";
import { Outlet } from "react-router-dom";
import { InterviewProvider } from "../context/InterviewContext";
import Sidebar from "../components/layouts/Sidebar";

const InterviewLayout = () => {
  return (
    <div className="flex min-h-screen bg-zinc-900">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default InterviewLayout;
