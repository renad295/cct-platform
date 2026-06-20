"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Brain, X, Trophy } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: clientsData } = await supabase.from("clients").select("*");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invite`);
    const usersData = await res.json();
    setClients(clientsData || []);
    setUsers(usersData.users || []);
    setLoading(false);
  };

  const getEmployeeStats = (userEmail) => {
    const assigned = clients.filter((c) => c.assigned_to_email === userEmail);
    const newClients = assigned.filter((c) => c.status === "New").length;
    const worked = assigned.filter((c) => c.status !== "New"); // فقط اللي شتغل عليهم
    const total = worked.length;
    const meetings = worked.filter(
      (c) => c.status === "Meeting Arranged",
    ).length;
    const qualified = worked.filter((c) => c.status === "Qualified").length;
    const notQualified = worked.filter(
      (c) => c.status === "Not Qualified",
    ).length;
    const onHold = worked.filter((c) => c.status === "On Hold").length;
    const opportunities = worked.filter(
      (c) => c.status === "Opportunity",
    ).length;
    const noAnswer = worked.filter((c) => c.status === "No Answer").length;
    const existing = worked.filter(
      (c) => c.status === "Existing Client",
    ).length;
    const confirmed = assigned.filter((c) => c.is_confirmed).length;
    const meetingRate = total > 0 ? ((meetings / total) * 100).toFixed(1) : 0;
    const opportunityRate =
      total > 0 ? ((opportunities / total) * 100).toFixed(1) : 0;
    const successRate =
      total > 0 ? (((meetings + opportunities) / total) * 100).toFixed(1) : 0;
    return {
      total,
      newClients,
      meetings,
      qualified,
      notQualified,
      onHold,
      opportunities,
      noAnswer,
      existing,
      confirmed,
      meetingRate,
      opportunityRate,
      successRate,
      totalAssigned: assigned.length,
    };
  };

  const getRating = (stats) => {
    const rate = parseFloat(stats.meetingRate);
    if (rate >= 15)
      return {
        label: "Excellent",
        color: "bg-green-50 text-green-700 border-green-200",
        dot: "bg-green-500",
      };
    if (rate >= 8)
      return {
        label: "Good",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    return {
      label: "Needs Improvement",
      color: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    };
  };

  const getAIAnalysis = async (user, stats) => {
    setLoadingAnalysis(true);
    setAnalysis("");
    const name = user.user_metadata?.full_name || user.email?.split("@")[0];
    const prompt = `You are a sales performance analyst. Analyze this employee's cold calling performance and give a concise professional assessment in 4-5 sentences. Be specific, constructive, and data-driven.

Employee: ${name}
Total Clients Assigned: ${stats.total}
Meeting Arranged: ${stats.meetings} (${stats.meetingRate}%)
Qualified: ${stats.qualified}
Not Qualified: ${stats.notQualified}
Opportunities: ${stats.opportunities} (${stats.opportunityRate}%)
No Answer: ${stats.noAnswer}
Existing Clients: ${stats.existing}
Overall Success Rate: ${stats.successRate}%
Confirmed by employee: ${stats.confirmed}

Write a performance summary covering: current performance level, key strengths, main challenge, and one specific actionable recommendation to improve conversion rates.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      setAnalysis(data.content?.[0]?.text || "Unable to generate analysis.");
    } catch {
      setAnalysis("Error generating analysis. Please try again.");
    }
    setLoadingAnalysis(false);
  };

  const activeUsers = users.filter((u) => getEmployeeStats(u.email).total > 0);

  // Overall stats
  const totalClients = clients.length;
  const totalMeetings = clients.filter(
    (c) => c.status === "Meeting Arranged",
  ).length;
  const totalQualified = clients.filter((c) => c.status === "Qualified").length;
  const totalNotQualified = clients.filter(
    (c) => c.status === "Not Qualified",
  ).length;
  const totalOpportunities = clients.filter(
    (c) => c.status === "Opportunity",
  ).length;
  const totalNoAnswer = clients.filter((c) => c.status === "No Answer").length;
  const totalExisting = clients.filter(
    (c) => c.status === "Existing Client",
  ).length;
  const totalNew = clients.filter((c) => c.status === "New").length;
  const totalOnHold = clients.filter((c) => c.status === "On Hold").length;
  const overallMeetingRate =
    totalClients > 0 ? ((totalMeetings / totalClients) * 100).toFixed(1) : 0;
  const overallSuccessRate =
    totalClients > 0
      ? (((totalMeetings + totalOpportunities) / totalClients) * 100).toFixed(1)
      : 0;
  const qualifiedRate =
    totalMeetings > 0 ? ((totalQualified / totalMeetings) * 100).toFixed(1) : 0;

  const opportunityRate =
    totalQualified > 0
      ? ((totalOpportunities / totalQualified) * 100).toFixed(1)
      : 0;

  // Pie chart data
  const pieData = [
    { name: "New", value: totalNew, color: "#9ca3af" },
    { name: "Meeting Arranged", value: totalMeetings, color: "#0C447C" },
    { name: "Qualified", value: totalQualified, color: "#22c55e" },
    { name: "Not Qualified", value: totalNotQualified, color: "#dc2626" },
    { name: "On Hold", value: totalOnHold, color: "#f9f516" },
    { name: "Opportunity", value: totalOpportunities, color: "#27ae60" },
    { name: "No Answer", value: totalNoAnswer, color: "#f59e0b" },
    { name: "Existing Client", value: totalExisting, color: "#7c3aed" },
  ].filter((d) => d.value > 0);

  // Bar chart - employee comparison
  const barData = activeUsers.map((u) => {
    const stats = getEmployeeStats(u.email);
    return {
      name: u.user_metadata?.full_name || u.email?.split("@")[0],
      Meetings: stats.meetings,
      Qualified: stats.qualified,
      Opportunities: stats.opportunities,
    };
  });

  // Industry breakdown
  const industryData = clients
    .reduce((acc, c) => {
      if (!c.industry) return acc;
      const existing = acc.find((i) => i.name === c.industry);
      if (existing) {
        existing.total++;
        if (c.status === "Meeting Arranged") existing.meetings++;
        if (c.status === "Opportunity") existing.opportunities++;
      } else {
        acc.push({
          name: c.industry,
          total: 1,
          meetings: c.status === "Meeting Arranged" ? 1 : 0,
          opportunities: c.status === "Opportunity" ? 1 : 0,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  // Monthly trend
  const monthlyData = clients
    .reduce((acc, c) => {
      const month = new Date(c.created_at).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const existing = acc.find((m) => m.month === month);
      if (existing) {
        existing.total++;
        if (c.status === "Meeting Arranged") existing.meetings++;
        if (c.status === "Opportunity") existing.opportunities++;
      } else {
        acc.push({
          month,
          total: 1,
          meetings: c.status === "Meeting Arranged" ? 1 : 0,
          opportunities: c.status === "Opportunity" ? 1 : 0,
        });
      }
      return acc;
    }, [])
    .slice(-6);

  // Leaderboard
  const leaderboard = activeUsers
    .map((u) => {
      const stats = getEmployeeStats(u.email);
      return {
        user: u,
        stats,
        name: u.user_metadata?.full_name || u.email?.split("@")[0],
      };
    })
    .sort((a, b) => b.stats.opportunities - a.stats.opportunities);

  const openModal = (user) => {
    const stats = getEmployeeStats(user.email);
    setSelectedUser({ user, stats });
    setAnalysis("");
    getAIAnalysis(user, stats);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-10 px-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-red-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Performance Reports
            </h1>
            <p className="text-xs text-gray-400">
              AI-powered cold calls analytics
            </p>
          </div>
          <div className="flex flex-col items-center ml-auto">
            <img
              src="https://smart.sa/wp-content/themes/smart/images/logo.svg"
              alt="SMART"
              className="h-7"
            />
            <p
              className="mt-1 text-gray-900 tracking-widest"
              style={{ fontSize: "11px" }}
            >
              Cold Call Track
            </p>
          </div>
        </div>

       
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">
            Sales Funnel
          </h2>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-500">{totalClients}</p>
              <p className="text-xs text-gray-400">Leads</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-blue-700">
                {totalMeetings}
              </p>
              <p className="text-xs text-gray-400">Meetings</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-cyan-500">
                {totalQualified}
              </p>
              <p className="text-xs text-gray-400">Qualified</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-green-600">
                {totalOpportunities}
              </p>
              <p className="text-xs text-gray-400">Opportunities</p>
            </div>
          </div>
        </div>
        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pie */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Status Distribution
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="35%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Monthly Trend
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  dot={false}
                  name="Total"
                />
                <Line
                  type="monotone"
                  da
                  taKey="meetings"
                  stroke="#0C447C"
                  strokeWidth={2}
                  dot={false}
                  name="Meetings"
                />
                <Line
                  type="monotone"
                  dataKey="opportunities"
                  stroke="#27ae60"
                  strokeWidth={2}
                  dot={false}
                  name="Opportunities"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Employee Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Employee Comparison
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={10}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  payload={[
                    {
                      value: "Meetings",
                      type: "circle",
                      color: "#0C447C",
                    },
                    {
                      value: "Qualified",
                      type: "circle",
                      color: "#02ddf1",
                    },
                    {
                      value: "Opportunities",
                      type: "circle",
                      color: "#27ae60",
                    },
                  ]}
                />{" "}
                <Bar dataKey="Meetings" fill="#0C447C" radius={4} />
                <Bar dataKey="Qualified" fill="#02ddf1" radius={4} />
                <Bar dataKey="Opportunities" fill="#27ae60" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Industry Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Industry Breakdown
            </h2>
            {industryData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">
                No industry data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={industryData} barSize={10} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="total" fill="#9ca3af" radius={4} name="Total" />
                  <Bar
                    dataKey="meetings"
                    fill="#0C447C"
                    radius={4}
                    name="Meetings"
                  />
                  <Bar
                    dataKey="opportunities"
                    fill="#27ae60"
                    radius={4}
                    name="Opportunities"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Leaderboard</h2>
          </div>
          <div className="space-y-3">
            {leaderboard.map((item, index) => {
              const rating = getRating(item.stats);
              return (
                <div key={item.user.id} className="flex items-center gap-4">
                  <span
                    className={`w-6 text-sm font-bold ${index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-gray-300"}`}
                  >
                    #{index + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center">
                    {item.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-800">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {item.stats.total} clients
                        </span>
                        <span className="text-xs font-semibold text-blue-700">
                          {item.stats.meetingRate}% rate
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${rating.color}`}
                        >
                          {rating.label}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(parseFloat(item.stats.meetingRate) * 4, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Employee Cards */}
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Team Members — Click for AI Analysis
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {activeUsers.map((u) => {
            const stats = getEmployeeStats(u.email);
            const rating = getRating(stats);
            const name = u.user_metadata?.full_name || u.email?.split("@")[0];
            return (
              <button
                key={u.id}
                onClick={() => openModal(u)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-red-200 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 text-sm font-bold flex items-center justify-center">
                      {name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {stats.totalAssigned} clients
                      </p>{" "}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${rating.color}`}
                  >
                    {rating.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-blue-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-blue-700">
                      {stats.meetings}
                    </p>
                    <p className="text-xs text-gray-400">Meetings</p>
                  </div>
                  <div className="bg-green-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-green-700">
                      {stats.opportunities}
                    </p>
                    <p className="text-xs text-gray-400">Opport.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className="text-sm font-bold text-gray-700">
                      {stats.meetingRate}%
                    </p>
                    <p className="text-xs text-gray-400">Rate</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(stats.successRate) * 2, 100)}%`,
                    }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Employee Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 text-sm font-bold flex items-center justify-center">
                  {(
                    selectedUser.user.user_metadata?.full_name ||
                    selectedUser.user.email?.split("@")[0]
                  )
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedUser.user.user_metadata?.full_name ||
                      selectedUser.user.email?.split("@")[0]}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {selectedUser.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Total",
                    value: selectedUser.stats.total,
                    color: "text-gray-900",
                    bg: "bg-gray-50",
                  },
                  {
                    label: "Meetings",
                    value: selectedUser.stats.meetings,
                    color: "text-blue-700",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Qualified",
                    value: selectedUser.stats.qualified,
                    color: "text-green-600",
                    bg: "bg-green-50",
                  },
                  {
                    label: "Not Qualified",
                    value: selectedUser.stats.notQualified,
                    color: "text-red-600",
                    bg: "bg-red-50",
                  },
                  {
                    label: "Opportunities",
                    value: selectedUser.stats.opportunities,
                    color: "text-green-700",
                    bg: "bg-green-50",
                  },
                  {
                    label: "No Answer",
                    value: selectedUser.stats.noAnswer,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "Success Rate",
                    value: `${selectedUser.stats.successRate}%`,
                    color: "text-purple-700",
                    bg: "bg-purple-50",
                  },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mini Pie */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-3">
                  Status Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="35%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* AI Analysis */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-red-700" />
                  <p className="text-xs font-semibold text-gray-700">
                    AI Analysis
                  </p>
                </div>
                {loadingAnalysis ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-700 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-red-700 animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-red-700 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {analysis}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
