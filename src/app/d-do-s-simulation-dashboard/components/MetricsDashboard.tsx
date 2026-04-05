'use client';

import React, { useRef, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield, Zap, Activity, Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import type { SimulationState, SimulationMetrics, LogEntry, SimulationConfig } from './SimulationDashboard';

interface MetricsDashboardProps {
  metrics: SimulationMetrics;
  metricsHistory: Array<{
    time: string;
    requests: number;
    blocked: number;
    serverLoad: number;
    legitimate: number;
  }>;
  simulationState: SimulationState;
  logs: LogEntry[];
  config: SimulationConfig;
}

const logTypeConfig = {
  attack: { color: '#ff2d55', bg: 'rgba(255,45,85,0.07)', border: 'rgba(255,45,85,0.2)', label: 'ATK', glow: 'rgba(255,45,85,0.3)' },
  defense: { color: '#00d4ff', bg: 'rgba(0,212,255,0.05)', border: 'rgba(0,212,255,0.15)', label: 'DEF', glow: 'rgba(0,212,255,0.2)' },
  info: { color: '#4a7a9b', bg: 'rgba(0,212,255,0.02)', border: 'rgba(0,212,255,0.07)', label: 'INF', glow: 'transparent' },
  warning: { color: '#ffaa00', bg: 'rgba(255,170,0,0.06)', border: 'rgba(255,170,0,0.15)', label: 'WRN', glow: 'rgba(255,170,0,0.2)' },
  critical: { color: '#ff2d55', bg: 'rgba(255,45,85,0.1)', border: 'rgba(255,45,85,0.28)', label: 'CRT', glow: 'rgba(255,45,85,0.4)' },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 border"
      style={{
        background: 'rgba(4,12,22,0.98)',
        borderColor: 'rgba(0,212,255,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)',
      }}
    >
      <div className="text-[8px] font-mono-data mb-1.5" style={{ color: 'rgba(0,212,255,0.4)' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={`tt-${i}`} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color, boxShadow: `0 0 4px ${entry.color}` }} />
          <span className="text-[9px] font-mono-data" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value.toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MetricsDashboard({ metrics, metricsHistory, simulationState, logs, config }: MetricsDashboardProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const metricCards = [
    {
      id: 'metric-req-per-sec',
      label: 'Req / Sec',
      value: formatNumber(metrics.requestsPerSec),
      icon: Activity,
      color: simulationState === 'attacking' ? '#ff2d55' : '#00d4ff',
      bg: simulationState === 'attacking' ? 'rgba(255,45,85,0.07)' : 'rgba(0,212,255,0.05)',
      border: simulationState === 'attacking' ? 'rgba(255,45,85,0.22)' : 'rgba(0,212,255,0.18)',
      glow: simulationState === 'attacking' ? 'rgba(255,45,85,0.2)' : 'rgba(0,212,255,0.12)',
      trend: simulationState !== 'idle' ? 'up' : 'neutral',
      sub: `${formatNumber(metrics.maliciousTraffic)} malicious`,
    },
    {
      id: 'metric-blocked',
      label: 'Blocked',
      value: formatNumber(metrics.blockedRequests),
      icon: Shield,
      color: '#00ff88',
      bg: 'rgba(0,255,136,0.05)',
      border: 'rgba(0,255,136,0.18)',
      glow: 'rgba(0,255,136,0.12)',
      trend: 'up',
      sub: `${metrics.firewallEfficiency}% efficiency`,
    },
    {
      id: 'metric-server-load',
      label: 'Server Load',
      value: `${metrics.serverLoad}%`,
      icon: Zap,
      color: metrics.serverLoad > 75 ? '#ff2d55' : metrics.serverLoad > 45 ? '#ffaa00' : '#00ff88',
      bg: metrics.serverLoad > 75 ? 'rgba(255,45,85,0.07)' : metrics.serverLoad > 45 ? 'rgba(255,170,0,0.06)' : 'rgba(0,255,136,0.05)',
      border: metrics.serverLoad > 75 ? 'rgba(255,45,85,0.22)' : metrics.serverLoad > 45 ? 'rgba(255,170,0,0.18)' : 'rgba(0,255,136,0.18)',
      glow: metrics.serverLoad > 75 ? 'rgba(255,45,85,0.2)' : 'rgba(0,212,255,0.08)',
      trend: metrics.serverLoad > 50 ? 'up' : 'neutral',
      sub: metrics.serverLoad > 75 ? 'CRITICAL' : metrics.serverLoad > 45 ? 'Elevated' : 'Normal',
    },
    {
      id: 'metric-attackers',
      label: 'Active Bots',
      value: String(metrics.activeAttackers),
      icon: Users,
      color: metrics.activeAttackers > 0 ? '#ff2d55' : '#4a7a9b',
      bg: metrics.activeAttackers > 0 ? 'rgba(255,45,85,0.06)' : 'rgba(0,212,255,0.03)',
      border: metrics.activeAttackers > 0 ? 'rgba(255,45,85,0.18)' : 'rgba(0,212,255,0.08)',
      glow: metrics.activeAttackers > 0 ? 'rgba(255,45,85,0.15)' : 'transparent',
      trend: 'neutral',
      sub: metrics.activeAttackers > 0 ? 'Botnet active' : 'No threats',
    },
    {
      id: 'metric-latency',
      label: 'Latency',
      value: `${metrics.networkLatency}ms`,
      icon: Clock,
      color: metrics.networkLatency > 80 ? '#ff2d55' : metrics.networkLatency > 40 ? '#ffaa00' : '#00ff88',
      bg: metrics.networkLatency > 80 ? 'rgba(255,45,85,0.06)' : 'rgba(0,255,136,0.04)',
      border: metrics.networkLatency > 80 ? 'rgba(255,45,85,0.18)' : 'rgba(0,255,136,0.14)',
      glow: metrics.networkLatency > 80 ? 'rgba(255,45,85,0.15)' : 'rgba(0,255,136,0.08)',
      trend: metrics.networkLatency > 40 ? 'up' : 'neutral',
      sub: 'Network RTT',
    },
    {
      id: 'metric-dropped',
      label: 'Pkts Dropped',
      value: formatNumber(metrics.packetsDropped),
      icon: Filter,
      color: '#00d4ff',
      bg: 'rgba(0,212,255,0.04)',
      border: 'rgba(0,212,255,0.12)',
      glow: 'rgba(0,212,255,0.08)',
      trend: 'neutral',
      sub: 'Cumulative',
    },
  ];

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      {/* Metrics Grid */}
      <div
        className="holo-panel rounded-xl p-3 flex flex-col gap-2"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <Activity size={10} className="text-neon-blue" />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Live Metrics</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-blink"
              style={{ background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }}
            />
            <span className="text-[7px] font-mono-data" style={{ color: 'rgba(0,255,136,0.5)' }}>LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {metricCards.map(card => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.id}
                className="rounded-xl p-2.5 border metric-card transition-all duration-300 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${card.bg} 0%, rgba(0,0,0,0.2) 100%)`,
                  borderColor: card.border,
                  boxShadow: `0 0 12px ${card.glow}, inset 0 1px 0 ${card.border}`,
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${card.color}50, transparent)` }}
                />
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="flex items-center justify-center w-5 h-5 rounded-md"
                    style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}
                  >
                    <CardIcon size={9} style={{ color: card.color }} />
                  </div>
                  {card.trend === 'up' && simulationState !== 'idle' ? (
                    <TrendingUp size={8} style={{ color: card.color, filter: `drop-shadow(0 0 3px ${card.color})` }} />
                  ) : card.trend === 'down' ? (
                    <TrendingDown size={8} className="text-neon-green" />
                  ) : null}
                </div>
                <div
                  className="text-base font-mono-data font-bold leading-tight"
                  style={{
                    color: card.color,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: `0 0 10px ${card.color}80`,
                  }}
                >
                  {card.value}
                </div>
                <div className="text-[7px] font-mono-data mt-0.5 leading-tight" style={{ color: 'rgba(0,212,255,0.4)' }}>
                  {card.label}
                </div>
                <div
                  className="text-[7px] font-mono-data mt-0.5 leading-tight"
                  style={{ color: card.color, opacity: 0.65 }}
                >
                  {card.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="holo-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={10} className="text-neon-blue" />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Traffic Flow</span>
          <div className="ml-auto text-[7px] font-mono-data" style={{ color: 'rgba(0,212,255,0.3)' }}>
            LAST 30s
          </div>
        </div>
        <div style={{ height: 88 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricsHistory} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="grad-requests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d55" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ff2d55" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-blocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-legit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 8" stroke="rgba(0,212,255,0.04)" />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" stroke="#ff2d55" strokeWidth={1.5} fill="url(#grad-requests)" name="Total" dot={false} />
              <Area type="monotone" dataKey="blocked" stroke="#00ff88" strokeWidth={1} fill="url(#grad-blocked)" name="Blocked" dot={false} />
              <Area type="monotone" dataKey="legitimate" stroke="#00d4ff" strokeWidth={1} fill="url(#grad-legit)" name="Legit" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between">
          {[
            { color: '#ff2d55', label: 'Total' },
            { color: '#00ff88', label: 'Blocked' },
            { color: '#00d4ff', label: 'Legit' },
          ].map(item => (
            <div key={`chart-legend-${item.label}`} className="flex items-center gap-1.5">
              <div className="w-2.5 h-0.5 rounded" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
              <span className="text-[7px] font-mono-data" style={{ color: 'rgba(0,212,255,0.4)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Server Load Bar Chart */}
      <div className="holo-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className={metrics.serverLoad > 75 ? 'text-neon-red' : 'text-neon-amber'} style={{ filter: `drop-shadow(0 0 3px ${metrics.serverLoad > 75 ? '#ff2d55' : '#ffaa00'})` }} />
            <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Server Load</span>
          </div>
          <span
            className="text-xs font-mono-data font-bold"
            style={{
              color: metrics.serverLoad > 75 ? '#ff2d55' : metrics.serverLoad > 45 ? '#ffaa00' : '#00ff88',
              textShadow: `0 0 8px ${metrics.serverLoad > 75 ? 'rgba(255,45,85,0.6)' : metrics.serverLoad > 45 ? 'rgba(255,170,0,0.5)' : 'rgba(0,255,136,0.5)'}`,
            }}
          >
            {metrics.serverLoad}%
          </span>
        </div>
        <div style={{ height: 56 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsHistory.slice(-12)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={5}>
              <CartesianGrid strokeDasharray="2 8" stroke="rgba(0,212,255,0.03)" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="serverLoad"
                name="Load %"
                radius={[2, 2, 0, 0]}
                fill={metrics.serverLoad > 75 ? '#ff2d55' : metrics.serverLoad > 45 ? '#ffaa00' : '#00d4ff'}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Premium load bar */}
        <div className="flex flex-col gap-1">
          <div
            className="flex h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${metrics.serverLoad}%`,
                background: metrics.serverLoad > 75
                  ? 'linear-gradient(90deg, #ff6b35, #ff2d55)'
                  : metrics.serverLoad > 45
                  ? 'linear-gradient(90deg, #ffaa00, #ff6b35)'
                  : 'linear-gradient(90deg, #00d4ff, #00ff88)',
                boxShadow: metrics.serverLoad > 75
                  ? '0 0 10px rgba(255,45,85,0.6), 0 0 20px rgba(255,45,85,0.3)'
                  : '0 0 8px rgba(0,212,255,0.4)',
              }}
            />
          </div>
          <div className="flex justify-between text-[7px] font-mono-data" style={{ color: 'rgba(0,212,255,0.25)' }}>
            <span>0%</span>
            <span style={{ color: metrics.serverLoad > 75 ? 'rgba(255,45,85,0.6)' : 'rgba(0,212,255,0.25)' }}>75% WARN</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div
        className="holo-panel rounded-xl p-3 flex flex-col gap-2 flex-1 overflow-hidden min-h-0"
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <AlertTriangle size={10} className="text-neon-amber" style={{ filter: 'drop-shadow(0 0 3px rgba(255,170,0,0.6))' }} />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Event Log</span>
          <div
            className="ml-auto px-1.5 py-0.5 rounded text-[7px] font-mono-data"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)', color: 'rgba(0,212,255,0.4)' }}
          >
            {logs.length} events
          </div>
        </div>

        <div
          ref={logRef}
          className="flex flex-col gap-1 overflow-y-auto flex-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {logs.map((log, idx) => {
            const tc = logTypeConfig[log.type];
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all"
                style={{
                  background: tc.bg,
                  borderColor: tc.border,
                  boxShadow: idx === 0 ? `0 0 8px ${tc.glow}` : 'none',
                  animation: idx === 0 ? 'tickerScroll 0.3s ease-out' : 'none',
                }}
              >
                <div
                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-mono-data font-bold"
                  style={{
                    color: tc.color,
                    background: `${tc.color}18`,
                    border: `1px solid ${tc.border}`,
                    textShadow: `0 0 6px ${tc.color}`,
                    letterSpacing: '0.05em',
                  }}
                >
                  {tc.label}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[9px] font-mono-data leading-tight" style={{ color: tc.color }}>
                    {log.message}
                  </span>
                  <span className="text-[7px] font-mono-data mt-0.5" style={{ color: 'rgba(0,212,255,0.25)' }}>
                    {log.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <CheckCircle size={18} style={{ color: 'rgba(0,212,255,0.2)' }} />
              <span className="text-[9px] font-mono-data" style={{ color: 'rgba(0,212,255,0.25)' }}>No events yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}