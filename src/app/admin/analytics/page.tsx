"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, ShoppingBag, DollarSign, Users, Activity } from "lucide-react";
import { getAnalyticsData } from "./actions";
import { formatCurrency } from "@/lib/currency";

const COLORS = ["#643900", "#004a57", "#535f70", "#ba1a1a", "#854d00"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getAnalyticsData();
        setData(result);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="admin-card" style={{ textAlign: 'center', padding: '5rem' }}>Loading Performance Data...</div>;
  if (!data) return <div className="admin-card" style={{ textAlign: 'center', padding: '5rem', color: 'var(--error)' }}>Failed to load analytics engine.</div>;

  return (
    <div className="admin-main" style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Performance Intelligence</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Real-time revenue, growth, and audience metrics.</p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.5rem 1rem', 
          backgroundColor: 'var(--surface-container-high)', 
          color: 'var(--primary)', 
          borderRadius: 'var(--radius-full)', 
          fontSize: '0.75rem', 
          fontWeight: 700,
          border: '1px solid var(--outline-variant)'
        }}>
          <Activity size={14} /> LIVE DATA SYNC
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-stat-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Total Revenue</div>
            <div style={{ color: 'var(--primary)', opacity: 0.7 }}><DollarSign size={18} /></div>
          </div>
          <div className="stat-value">{formatCurrency(data.totals.revenue, data.currency)}</div>
          <div className="stat-change positive">Store cumulative total</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Total Orders</div>
            <div style={{ color: 'var(--tertiary)', opacity: 0.7 }}><ShoppingBag size={18} /></div>
          </div>
          <div className="stat-value">{data.totals.orders}</div>
          <div className="stat-change positive">Success & Pending combined</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Avg. Ticket Size</div>
            <div style={{ color: 'var(--secondary)', opacity: 0.7 }}><TrendingUp size={18} /></div>
          </div>
          <div className="stat-value">{formatCurrency(data.totals.avgOrder, data.currency)}</div>
          <div className="stat-change">Weighted mean</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="stat-label">Active Presence</div>
            <div style={{ color: 'var(--error)', opacity: 0.7 }}><Users size={18} /></div>
          </div>
          <div className="stat-value">{data.totals.activeUsers}</div>
          <div className="stat-change positive">Live sessions / {data.totals.totalUsers} total users</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', gridAutoFlow: 'dense' }}>
        {/* Revenue Growth - Desktop 2/3 */}
        <div className="admin-card" style={{ gridColumn: 'span 1' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingUp size={20} color="var(--primary)" /> Revenue Growth Projection
          </h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 500}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--on-surface-variant)', fontSize: 11, fontWeight: 500}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--outline-variant)', 
                    boxShadow: 'var(--shadow-md)',
                    backgroundColor: 'var(--surface-container-lowest)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ fontWeight: 800, color: 'var(--primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Allocation */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Operational Status Allocation</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  cornerRadius={4}
                  dataKey="value"
                >
                  {data.statusData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 'var(--radius-md)', 
                    border: 'none', 
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '12px'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @media (min-width: 1024px) {
          .admin-main > div:nth-child(3) {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
