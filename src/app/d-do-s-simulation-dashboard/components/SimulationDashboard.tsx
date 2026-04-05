'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster } from 'sonner';
import ControlPanel from './ControlPanel';
import NetworkTopology from './NetworkTopology';
import MetricsDashboard from './MetricsDashboard';
import TopBar from './TopBar';

export type SimulationState = 'idle' | 'attacking' | 'protected';
export type AttackType = 'syn-flood' | 'udp-flood' | 'http-flood' | 'icmp-flood';

export interface SimulationMetrics {
  requestsPerSec: number;
  blockedRequests: number;
  totalRequests: number;
  serverLoad: number;
  activeAttackers: number;
  packetsDropped: number;
  legitimateTraffic: number;
  maliciousTraffic: number;
  firewallEfficiency: number;
  networkLatency: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'attack' | 'defense' | 'info' | 'warning' | 'critical';
  message: string;
}

export interface SimulationConfig {
  attackIntensity: number;
  firewallEnabled: boolean;
  attackType: AttackType;
  attackerCount: number;
  isRunning: boolean;
}

const initialMetrics: SimulationMetrics = {
  requestsPerSec: 142,
  blockedRequests: 0,
  totalRequests: 1204,
  serverLoad: 12,
  activeAttackers: 0,
  packetsDropped: 0,
  legitimateTraffic: 142,
  maliciousTraffic: 0,
  firewallEfficiency: 100,
  networkLatency: 18,
};

const initialLogs: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '04:48:32',
    type: 'info',
    message: 'NetShield monitoring system initialized',
  },
  {
    id: 'log-002',
    timestamp: '04:48:35',
    type: 'info',
    message: 'Firewall rules loaded — 2,847 active signatures',
  },
  {
    id: 'log-003',
    timestamp: '04:48:41',
    type: 'info',
    message: 'Network baseline established — 142 req/s nominal',
  },
  {
    id: 'log-004',
    timestamp: '04:48:47',
    type: 'info',
    message: 'All systems nominal — awaiting simulation start',
  },
];

export default function SimulationDashboard() {
  const [simulationState, setSimulationState] = useState<SimulationState>('idle');
  const [metrics, setMetrics] = useState<SimulationMetrics>(initialMetrics);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [config, setConfig] = useState<SimulationConfig>({
    attackIntensity: 50,
    firewallEnabled: true,
    attackType: 'syn-flood',
    attackerCount: 5,
    isRunning: false,
  });
  const [metricsHistory, setMetricsHistory] = useState<Array<{
    time: string;
    requests: number;
    blocked: number;
    serverLoad: number;
    legitimate: number;
  }>>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const logCounterRef = useRef(5);

  const getTimestamp = useCallback(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const id = `log-${String(logCounterRef.current).padStart(3, '0')}`;
    logCounterRef.current += 1;
    const entry: LogEntry = {
      id,
      timestamp: getTimestamp(),
      type,
      message,
    };
    setLogs(prev => [entry, ...prev].slice(0, 60));
  }, [getTimestamp]);

  const startAttack = useCallback(() => {
    setConfig(prev => ({ ...prev, isRunning: true }));
    setSimulationState(prev => prev === 'idle' ? 'attacking' : prev);
    addLog('critical', `DDoS attack initiated — Type: ${config.attackType.toUpperCase()}`);
    addLog('attack', `${config.attackerCount} attacker nodes activated`);
    if (config.firewallEnabled) {
      setTimeout(() => {
        addLog('defense', 'Firewall detected anomalous traffic pattern');
        addLog('defense', 'Rate limiting rules applied — blocking malicious IPs');
        setSimulationState('protected');
      }, 1200);
    }
  }, [config.attackType, config.attackerCount, config.firewallEnabled, addLog]);

  const stopAttack = useCallback(() => {
    setConfig(prev => ({ ...prev, isRunning: false }));
    setSimulationState('idle');
    addLog('info', 'Attack simulation terminated by operator');
    addLog('info', 'Network returning to baseline state');
    setMetrics(prev => ({
      ...prev,
      activeAttackers: 0,
      maliciousTraffic: 0,
      serverLoad: 12,
      requestsPerSec: 142,
    }));
  }, [addLog]);

  const toggleFirewall = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, firewallEnabled: enabled }));
    if (enabled) {
      addLog('defense', 'Firewall ENABLED — traffic filtering active');
      if (config.isRunning) {
        setSimulationState('protected');
        addLog('defense', 'Switching to mitigation mode — blocking attack vectors');
      }
    } else {
      addLog('warning', 'Firewall DISABLED — network exposed to attack traffic');
      if (config.isRunning) {
        setSimulationState('attacking');
        addLog('critical', 'WARNING: Server receiving unfiltered malicious traffic');
      }
    }
  }, [config.isRunning, addLog]);

  // Simulation tick
  useEffect(() => {
    if (config.isRunning) {
      intervalRef.current = setInterval(() => {
        tickRef.current += 1;
        const tick = tickRef.current;
        const intensity = config.attackIntensity / 100;
        const attackerMult = config.attackerCount / 5;
        const baseAttack = Math.floor(intensity * attackerMult * 8500 + Math.sin(tick * 0.3) * 800 + Math.random() * 600);
        const legitTraffic = Math.floor(142 + Math.sin(tick * 0.1) * 20 + Math.random() * 15);
        const blocked = config.firewallEnabled ? Math.floor(baseAttack * (0.88 + Math.random() * 0.1)) : 0;
        const unfiltered = baseAttack - blocked;
        const serverLoad = config.firewallEnabled
          ? Math.min(100, Math.floor(12 + (unfiltered / 100) * 0.8 + Math.random() * 5))
          : Math.min(100, Math.floor(12 + (baseAttack / 100) * 1.2 + Math.random() * 8));

        const currentState = config.firewallEnabled ? 'protected' : 'attacking';
        setSimulationState(currentState);

        setMetrics(prev => {
          const newRequests = prev.totalRequests + baseAttack + legitTraffic;
          const newBlocked = prev.blockedRequests + blocked;
          const newDropped = prev.packetsDropped + blocked;
          const efficiency = baseAttack > 0 ? Math.round((blocked / baseAttack) * 100) : 100;
          const latency = config.firewallEnabled
            ? Math.floor(18 + (unfiltered / 500) + Math.random() * 8)
            : Math.floor(18 + (baseAttack / 200) + Math.random() * 40);

          return {
            requestsPerSec: baseAttack + legitTraffic,
            blockedRequests: newBlocked,
            totalRequests: newRequests,
            serverLoad,
            activeAttackers: config.attackerCount,
            packetsDropped: newDropped,
            legitimateTraffic: legitTraffic,
            maliciousTraffic: baseAttack,
            firewallEfficiency: efficiency,
            networkLatency: latency,
          };
        });

        setMetricsHistory(prev => {
          const time = getTimestamp();
          const newPoint = {
            time,
            requests: baseAttack + legitTraffic,
            blocked,
            serverLoad,
            legitimate: legitTraffic,
          };
          return [...prev, newPoint].slice(-30);
        });

        // Random log events
        if (tick % 8 === 0 && config.firewallEnabled) {
          const ips = ['203.45.12.88', '91.234.56.77', '185.220.101.45', '198.51.100.23', '45.142.212.100'];
          const ip = ips[Math.floor(Math.random() * ips.length)];
          addLog('defense', `Blocked ${Math.floor(Math.random() * 2000 + 500)} packets from ${ip}`);
        }
        if (tick % 12 === 0 && !config.firewallEnabled) {
          addLog('critical', `Server load critical: ${serverLoad}% — unfiltered traffic`);
        }
        if (tick % 15 === 0) {
          addLog('warning', `Traffic anomaly: ${(baseAttack / 1000).toFixed(1)}K req/s spike detected`);
        }
        if (tick % 20 === 0 && config.firewallEnabled) {
          addLog('defense', `Rate limit applied — ${config.attackerCount} source IPs throttled`);
        }
      }, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      tickRef.current = 0;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.isRunning, config.attackIntensity, config.attackerCount, config.firewallEnabled, addLog, getTimestamp]);

  // Drift metrics when idle
  useEffect(() => {
    if (!config.isRunning) {
      const driftInterval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          requestsPerSec: Math.floor(142 + Math.sin(Date.now() / 3000) * 18 + Math.random() * 10),
          serverLoad: Math.floor(12 + Math.sin(Date.now() / 5000) * 3 + Math.random() * 2),
          networkLatency: Math.floor(18 + Math.random() * 4),
          legitimateTraffic: Math.floor(142 + Math.random() * 15),
        }));
        setMetricsHistory(prev => {
          const time = getTimestamp();
          const point = {
            time,
            requests: Math.floor(142 + Math.random() * 20),
            blocked: 0,
            serverLoad: Math.floor(12 + Math.random() * 3),
            legitimate: Math.floor(142 + Math.random() * 15),
          };
          return [...prev, point].slice(-30);
        });
      }, 1500);
      return () => clearInterval(driftInterval);
    }
  }, [config.isRunning, getTimestamp]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col" style={{ background: '#020810' }}>
      {/* Deep space background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(0,100,180,0.03) 0%, transparent 50%), radial-gradient(ellipse 40% 30% at 20% 50%, rgba(0,212,255,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Hex grid background */}
      <div className="absolute inset-0 hex-grid pointer-events-none opacity-60" />

      {/* Cyber grid overlay */}
      <div className="absolute inset-0 cyber-grid animate-grid-pulse pointer-events-none" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none z-10 opacity-30" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(2,8,16,0.6) 100%)',
        }}
      />

      {/* Ambient glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          top: '-200px',
          left: '30%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.025) 0%, transparent 70%)',
          animation: 'floatNode 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          bottom: '-100px',
          right: '10%',
          background: 'radial-gradient(circle, rgba(0,100,255,0.02) 0%, transparent 70%)',
          animation: 'floatNode 12s ease-in-out infinite reverse',
        }}
      />

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(4,12,22,0.97)',
            border: '1px solid rgba(0,212,255,0.25)',
            color: '#e0f4ff',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '11px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)',
          },
        }}
      />

      {/* Top bar */}
      <TopBar simulationState={simulationState} metrics={metrics} />

      {/* Main 3-panel layout */}
      <div className="relative z-20 flex flex-1 overflow-hidden gap-2 p-2 pt-1.5">
        {/* Left: Control Panel */}
        <div className="w-[272px] flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          <ControlPanel
            config={config}
            simulationState={simulationState}
            onStartAttack={startAttack}
            onStopAttack={stopAttack}
            onToggleFirewall={toggleFirewall}
            onUpdateConfig={setConfig}
          />
        </div>

        {/* Center: Network Topology */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <NetworkTopology
            simulationState={simulationState}
            config={config}
            metrics={metrics}
          />
        </div>

        {/* Right: Metrics + Logs */}
        <div className="w-[292px] flex-shrink-0 flex flex-col gap-2 overflow-hidden">
          <MetricsDashboard
            metrics={metrics}
            metricsHistory={metricsHistory}
            simulationState={simulationState}
            logs={logs}
            config={config}
          />
        </div>
      </div>
    </div>
  );
}