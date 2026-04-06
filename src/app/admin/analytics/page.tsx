"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Users, ShoppingBag, Package, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface AnalyticsData {
  revenue: Array<{ day: string; label: string; revenue: number; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; slug: string; totalQuantity: number; orderCount: number }>;
  customerGrowth: Array<{ day: string; label: string; newCustomers: number; cumulative: number }>;
  totals: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    recentRevenue: number;
    recentOrders: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#ef4444",
  refunded: "#6b7280",
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#16a34a", "#ef4444", "#6b7280", "#ec4899"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "0.75rem" }}>
        <Loader2 size={24} className="spin" />
        <span style={{ color: "var(--on-surface-variant)" }}>Loading analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--on-surface-variant)" }}>
        <p>{error || "No data available."}</p>
      </div>
    );
  }

  const { totals } = data;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Analytics</h1>
        <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9375rem" }}>
          Store performance over the last 30 days
        </p>
      </div>

      {/* KPI Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="stat-label">Total Revenue</p>
            <DollarSign size={18} style={{ color: "var(--primary)", opacity: 0.6 }} />
          </div>
          <div className="stat-value">${totals.totalRevenue.toFixed(2)}</div>
          <p className="stat-change">
            <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <ArrowUpRight size={14} />
              ${totals.recentRevenue.toFixed(2)}
            </span>{" "}
            last 30 days
          </p>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="stat-label">Orders</p>
            <ShoppingBag size={18} style={{ color: "var(--primary)", opacity: 0.6 }} />
          </div>
          <div className="stat-value">{totals.totalOrders}</div>
          <p className="stat-change">{totals.recentOrders} in last 30 days</p>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="stat-label">Customers</p>
            <Users size={18} style={{ color: "var(--primary)", opacity: 0.6 }} />
          </div>
          <div className="stat-value">{totals.totalCustomers}</div>
          <p className="stat-change">Registered accounts</p>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="stat-label">Products</p>
            <Package size={18} style={{ color: "var(--primary)", opacity: 0.6 }} />
          </div>
          <div className="stat-value">{totals.totalProducts}</div>
          <p className="stat-change">In catalog</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={18} /> Revenue Trend (30 Days)
        </h2>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data.revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "12px",
                  fontSize: "0.8125rem",
                  boxShadow: "var(--shadow-md)",
                }}
                formatter={((value: unknown) => [`$${Number(value ?? 0).toFixed(2)}`, "Revenue"]) as never}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column: Status Pie + Top Products Bar */}
      <div className="grid grid-2" style={{ marginBottom: "1.5rem", gap: "1.5rem" }}>
        {/* Order Status Distribution */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>Order Status</h2>
          {data.statusDistribution.length > 0 ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, value }: { name?: string; value?: number }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {data.statusDistribution.map((entry, i) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-container)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "12px",
                      fontSize: "0.8125rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "2rem" }}>No orders yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>Top Products</h2>
          {data.topProducts.length > 0 ? (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-container)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: "12px",
                      fontSize: "0.8125rem",
                    }}
                  />
                  <Bar dataKey="totalQuantity" name="Units Sold" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "2rem" }}>No product data yet</p>
          )}
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="admin-card">
        <h2 style={{ fontSize: "1.125rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Users size={18} /> Customer Growth (30 Days)
        </h2>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data.customerGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-container)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "12px",
                  fontSize: "0.8125rem",
                }}
              />
              <Bar dataKey="newCustomers" name="New Customers" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
