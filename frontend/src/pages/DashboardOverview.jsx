import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiArrowUpRight, FiClock, FiCheckCircle, FiStar } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

const DashboardOverview = () => {
  const { getToken, user } = useAuth();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    timeSpent: 0,
    completedInterviews: 0,
    availableInterviews: 0
  });

  const radarData = [
    { subject: 'Correctness', A: 120, fullMark: 150 },
    { subject: 'Clarity', A: 98, fullMark: 150 },
    { subject: 'Relevance', A: 86, fullMark: 150 },
    { subject: 'Detail', A: 99, fullMark: 150 },
    { subject: 'Efficiency', A: 85, fullMark: 150 },
    { subject: 'Creativity', A: 65, fullMark: 150 },
    { subject: 'Communication', A: 110, fullMark: 150 },
    { subject: 'Problem solving', A: 130, fullMark: 150 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/vapi-interview/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(res.data)) {
          const completed = res.data.filter(i => i.status === 'completed').length;
          setStats({
            totalInterviews: res.data.length,
            timeSpent: res.data.length * 10, // Mock time
            completedInterviews: completed,
            availableInterviews: 0 // Mock available
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [getToken]);

  return (
    <div className="p-8 space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.firstName} 👋</h1>
        </div>
        <Link 
          to="/dashboard/setup" 
          className="bg-[#bef264] hover:bg-[#d9f99d] text-black font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(190,242,100,0.2)] flex items-center gap-2"
        >
          <FiPlus />
          Create interview
        </Link>
      </div>

      {/* Overview Section */}
      <section>
        <h2 className="text-zinc-400 font-bold mb-8">Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Interviews" 
            value={stats.totalInterviews} 
            trend="0% from last week" 
            trendColor="text-zinc-500"
          />
          <StatCard 
            title="Total time spent" 
            value={`${stats.timeSpent} min`} 
            trend="0% from last week" 
            trendColor="text-zinc-500"
          />
          <StatCard 
            title="Completed interviews" 
            value={stats.completedInterviews} 
            trend="100% of total interviews" 
            trendColor="text-[#bef264]"
          />
          <StatCard 
            title="Available interviews" 
            value={stats.availableInterviews} 
            badge="Free credit"
            badgeColor="bg-[#bef264]/10 text-[#bef264]"
          />
        </div>
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Technical Interviews">
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <p className="text-sm">Not enough data to display</p>
          </div>
        </ChartContainer>

        <ChartContainer title="Behavioural Interviews">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Interviews"
                  dataKey="A"
                  stroke="#eab308"
                  fill="#eab308"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, trendColor, badge, badgeColor }) => (
  <div className="space-y-4">
    <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
    <div className="flex flex-col gap-1">
      <span className="text-4xl font-bold text-white">{value}</span>
      {trend && <span className={`${trendColor} text-xs font-bold`}>{trend}</span>}
      {badge && (
        <span className={`${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase border border-current`}>
          {badge}
        </span>
      )}
    </div>
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div className="bg-[#18181b]/50 border border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col">
    <div className="flex-1">
      {children}
    </div>
    <div className="mt-4 pt-4 border-t border-white/5 text-center">
      <h3 className="text-white font-bold">{title}</h3>
    </div>
  </div>
);

export default DashboardOverview;
