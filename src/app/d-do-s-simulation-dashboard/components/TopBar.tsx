'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Wifi,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Radio,
  Lock,
} from 'lucide-react';
import type { SimulationState, SimulationMetrics } from './SimulationDashboard';

interface TopBarProps {
  simulationState: SimulationState;
  metrics: SimulationMetrics;
}

const stateConfig = {
  idle: {
    label: 'NOMINAL',
    sublabel: 'All systems operational',
    color: 'text-neon-green',
    border: 'border-neon-green',
    bg: 'bg-neon-green-dim',
    glow: 'glow-green',
    icon: CheckCircle,
    pulse: 'pulse-green',
    accentColor: 'rgba(0,255,136,0.6)',
    barColor: '#00ff88',
  },
  attacking: {
    label: 'UNDER ATTACK',
    sublabel: 'DDoS detected',
    color: 'text-neon-red',
    border: 'border-neon-red',
    bg: 'bg-neon-red-dim',
    glow: 'glow-red',
    icon: AlertTriangle,
    pulse: 'pulse-red',
    accentColor: 'rgba(255,45,85,0.6)',
    barColor: '#ff2d55',
  },
  protected: {
    label: 'MITIGATING',
    sublabel: 'Firewall active',
    color: 'text-neon-blue',
    border: 'border-neon-blue',
    bg: 'bg-neon-blue-dim',
    glow: 'glow-blue',
    icon: Shield,
    pulse: 'pulse-blue',
    accentColor: 'rgba(0,212,255,0.6)',
    barColor: '#00d4ff',
  },
};

export default function TopBar({ simulationState, metrics }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [uptime, setUptime] = useState(0);
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setUptime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setScanPos((p) => (p + 1) % 100), 30);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const state = stateConfig[simulationState];
  const StateIcon = state.icon;

  return (
    <div
      className="relative z-30 flex items-center justify-between px-5 py-2.5 border-b overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(4, 12, 22, 0.98) 0%, rgba(2, 8, 16, 0.96) 100%)',
        borderColor: 'rgba(0, 212, 255, 0.12)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Animated top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${state.accentColor} 50%, transparent 100%)`,
          opacity: 0.7,
        }}
      />

      {/* Horizontal scan line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] pointer-events-none"
        style={{
          left: `${scanPos}%`,
          background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.15), transparent)',
          transition: 'left 0.03s linear',
        }}
      />

      {/* Left: Brand */}
      <div className="flex items-center gap-3 z-10">
        <div className="relative">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-xl ${state.bg} border ${state.border}`}
            style={{
              boxShadow: `0 0 16px ${state.accentColor}30, inset 0 1px 0 ${state.accentColor}20`,
            }}
          >
            <Shield size={16} className={state.color} />
          </div>
          {/* Corner accents on logo */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[rgba(0,212,255,0.5)]" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[rgba(0,212,255,0.5)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm tracking-[0.2em] text-white"
              style={{
                fontFamily: 'Geist, sans-serif',
                textShadow: '0 0 20px rgba(0,212,255,0.3)',
              }}
            >
              NET<span className="text-neon-blue text-glow-blue">SHIELD</span>
            </span>
            <span
              className="text-[9px] font-mono-data tracking-widest px-1.5 py-0.5 rounded"
              style={{
                color: 'rgba(0,212,255,0.5)',
                border: '1px solid rgba(0,212,255,0.12)',
                background: 'rgba(0,212,255,0.04)',
              }}
            >
              v2.4.1
            </span>
          </div>
          <div
            className="text-[8px] font-mono-data tracking-[0.2em]"
            style={{ color: 'rgba(0,212,255,0.3)' }}
          >
            DDoS SIMULATION PLATFORM
          </div>
          <div
            className="text-[8px] font-mono-data tracking-[0.14em]"
            style={{ color: 'rgba(255,255,255,0.42)' }}
          >
            Build bởi tôi Carter Fill
          </div>
        </div>

        {/* Vertical separator */}
        <div
          className="w-px h-8 mx-1"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.2), transparent)',
          }}
        />

        {/* System status badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${state.bg} ${state.border}`}
          style={{
            boxShadow: `0 0 12px ${state.accentColor}25`,
          }}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${state.pulse}`}
            style={{ background: state.barColor }}
          />
          <StateIcon size={11} className={state.color} />
          <div className="flex flex-col">
            <span className={`text-[9px] font-mono-data font-bold tracking-widest ${state.color}`}>
              {state.label}
            </span>
            <span className="text-[7px] font-mono-data" style={{ color: 'rgba(0,212,255,0.35)' }}>
              {state.sublabel}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Quick metrics strip */}
      <div className="flex items-center gap-2 z-10">
        {[
          {
            label: 'REQ/S',
            value: metrics.requestsPerSec.toLocaleString(),
            icon: Activity,
            color: simulationState === 'attacking' ? '#ff2d55' : '#00d4ff',
            glow: simulationState === 'attacking' ? 'rgba(255,45,85,0.3)' : 'rgba(0,212,255,0.2)',
          },
          {
            label: 'BLOCKED',
            value: metrics.blockedRequests.toLocaleString(),
            icon: Shield,
            color: '#00ff88',
            glow: 'rgba(0,255,136,0.2)',
          },
          {
            label: 'SRV LOAD',
            value: `${metrics.serverLoad}%`,
            icon: Zap,
            color:
              metrics.serverLoad > 70 ? '#ff2d55' : metrics.serverLoad > 40 ? '#ffaa00' : '#00ff88',
            glow: metrics.serverLoad > 70 ? 'rgba(255,45,85,0.3)' : 'rgba(0,212,255,0.15)',
          },
          {
            label: 'LATENCY',
            value: `${metrics.networkLatency}ms`,
            icon: Radio,
            color: metrics.networkLatency > 80 ? '#ff2d55' : '#00d4ff',
            glow: 'rgba(0,212,255,0.15)',
          },
        ].map((item) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={`topbar-metric-${item.label}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg metric-card"
              style={{
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.08)',
                boxShadow: `0 0 8px ${item.glow}`,
              }}
            >
              <ItemIcon size={10} style={{ color: item.color }} />
              <div className="flex flex-col">
                <span
                  className="text-[7px] font-mono-data tracking-widest leading-none"
                  style={{ color: 'rgba(0,212,255,0.4)' }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[11px] font-mono-data font-bold leading-tight"
                  style={{ color: item.color, textShadow: `0 0 8px ${item.glow}` }}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Time + uptime + nodes */}
      <div className="flex items-center gap-3 z-10">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}
        >
          <Clock size={9} style={{ color: 'rgba(0,212,255,0.4)' }} />
          <span className="text-[9px] font-mono-data" style={{ color: 'rgba(0,212,255,0.5)' }}>
            {currentTime}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}
        >
          <Wifi size={9} className="text-neon-green" />
          <span className="text-[9px] font-mono-data text-neon-green">
            UP {formatUptime(uptime)}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}
        >
          <Lock size={9} style={{ color: 'rgba(0,212,255,0.4)' }} />
          <div className="flex items-center gap-1">
            {['n1', 'n2', 'n3', 'n4'].map((nodeId, i) => (
              <div
                key={nodeId}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#00ff88',
                  boxShadow: '0 0 4px rgba(0,255,136,0.6)',
                  animation: `pulseGreen ${1.4 + i * 0.25}s ease-in-out infinite`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
          <span className="text-[8px] font-mono-data" style={{ color: 'rgba(0,212,255,0.35)' }}>
            4 NODES
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.08) 30%, rgba(0,212,255,0.15) 50%, rgba(0,212,255,0.08) 70%, transparent 100%)',
        }}
      />
    </div>
  );
}
