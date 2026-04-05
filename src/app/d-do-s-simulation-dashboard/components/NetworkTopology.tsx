'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { SimulationState, SimulationConfig, SimulationMetrics } from './SimulationDashboard';

interface NetworkTopologyProps {
  simulationState: SimulationState;
  config: SimulationConfig;
  metrics: SimulationMetrics;
}

interface Packet {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  blocked: boolean;
  fromAttacker: boolean;
  attackerIndex: number;
  phase: 'to-firewall' | 'to-server' | 'blocked-explode';
  opacity: number;
}

interface NodePosition {
  x: number;
  y: number;
}

export default function NetworkTopology({ simulationState, config, metrics }: NetworkTopologyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 800, height: 700 });
  const [nodeGlow, setNodeGlow] = useState(0);
  const [scanY, setScanY] = useState(0);
  const packetCounterRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSvgSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    if (svgRef.current?.parentElement) {
      observer.observe(svgRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  const W = svgSize.width;
  const H = svgSize.height;

  // Key node positions (relative)
  const firewallPos: NodePosition = { x: W * 0.52, y: H * 0.5 };
  const serverPos: NodePosition = { x: W * 0.82, y: H * 0.5 };

  const getAttackerPos = (index: number): NodePosition => {
    const count = config.attackerCount;
    const spacing = H / (count + 1);
    return { x: W * 0.08, y: spacing * (index + 1) };
  };

  const getClientPos = (index: number): NodePosition => {
    const positions = [
      { x: W * 0.08, y: H * 0.25 },
      { x: W * 0.08, y: H * 0.5 },
      { x: W * 0.08, y: H * 0.75 },
    ];
    return positions[index] || positions[0];
  };

  // Node glow pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setNodeGlow(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(p => (p + 1.5) % (H + 20));
    }, 16);
    return () => clearInterval(interval);
  }, [H]);

  // Packet spawning
  useEffect(() => {
    if (!config.isRunning) {
      const interval = setInterval(() => {
        const clientIdx = Math.floor(Math.random() * 3);
        const clientPos = getClientPos(clientIdx);
        const id = `pkt-legit-${packetCounterRef.current++}`;
        const newPkt: Packet = {
          id,
          x: clientPos.x,
          y: clientPos.y,
          targetX: firewallPos.x,
          targetY: firewallPos.y,
          progress: 0,
          speed: 0.018 + Math.random() * 0.008,
          color: '#00d4ff',
          size: 2.5,
          blocked: false,
          fromAttacker: false,
          attackerIndex: clientIdx,
          phase: 'to-firewall',
          opacity: 1,
        };
        setPackets(prev => [...prev.slice(-60), newPkt]);
      }, 400);
      return () => clearInterval(interval);
    }

    const intensity = config.attackIntensity / 100;
    const spawnRate = Math.max(40, 250 - intensity * 200);

    const interval = setInterval(() => {
      const newPkts: Packet[] = [];
      const pktsThisTick = Math.floor(1 + intensity * 3);
      for (let i = 0; i < pktsThisTick; i++) {
        const attackerIdx = Math.floor(Math.random() * config.attackerCount);
        const attackerPos = getAttackerPos(attackerIdx);
        const id = `pkt-atk-${packetCounterRef.current++}`;
        const willBeBlocked = config.firewallEnabled && Math.random() < 0.88;
        newPkts.push({
          id,
          x: attackerPos.x,
          y: attackerPos.y,
          targetX: firewallPos.x,
          targetY: firewallPos.y,
          progress: 0,
          speed: 0.022 + Math.random() * 0.012,
          color: '#ff2d55',
          size: 2 + Math.random() * 1.5,
          blocked: willBeBlocked,
          fromAttacker: true,
          attackerIndex: attackerIdx,
          phase: 'to-firewall',
          opacity: 1,
        });
      }
      if (Math.random() < 0.3) {
        const clientIdx = Math.floor(Math.random() * 3);
        const clientPos = getClientPos(clientIdx);
        const id = `pkt-legit-${packetCounterRef.current++}`;
        newPkts.push({
          id,
          x: clientPos.x,
          y: clientPos.y,
          targetX: firewallPos.x,
          targetY: firewallPos.y,
          progress: 0,
          speed: 0.015 + Math.random() * 0.008,
          color: '#00d4ff',
          size: 2.5,
          blocked: false,
          fromAttacker: false,
          attackerIndex: clientIdx,
          phase: 'to-firewall',
          opacity: 1,
        });
      }
      setPackets(prev => [...prev.slice(-120), ...newPkts]);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [config.isRunning, config.attackIntensity, config.attackerCount, config.firewallEnabled, W, H]);

  // Packet animation loop
  useEffect(() => {
    const animate = () => {
      setPackets(prev => {
        const updated: Packet[] = [];
        for (const pkt of prev) {
          const newProgress = pkt.progress + pkt.speed;
          if (newProgress >= 1) {
            if (pkt.phase === 'to-firewall') {
              if (pkt.blocked) {
                updated.push({ ...pkt, progress: 1, phase: 'blocked-explode', opacity: 0.8 });
              } else {
                updated.push({
                  ...pkt,
                  x: firewallPos.x,
                  y: firewallPos.y,
                  targetX: serverPos.x,
                  targetY: serverPos.y,
                  progress: 0,
                  phase: 'to-server',
                  color: pkt.fromAttacker ? '#ff6b35' : '#00d4ff',
                  speed: pkt.speed * 0.9,
                });
              }
            } else if (pkt.phase === 'to-server') {
              // arrived — remove
            } else if (pkt.phase === 'blocked-explode') {
              if (pkt.opacity > 0.05) {
                updated.push({ ...pkt, opacity: pkt.opacity - 0.12 });
              }
            }
          } else {
            const t = newProgress;
            const newX = pkt.x + (pkt.targetX - pkt.x) * t;
            const newY = pkt.y + (pkt.targetY - pkt.y) * t;
            const waveAmp = pkt.fromAttacker ? 8 : 4;
            const waveY = newY + Math.sin(t * Math.PI * 2) * waveAmp * (pkt.attackerIndex % 2 === 0 ? 1 : -1);
            updated.push({ ...pkt, progress: newProgress, x: newX, y: waveY });
          }
        }
        return updated;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [firewallPos.x, firewallPos.y, serverPos.x, serverPos.y]);

  const glowIntensity = (Math.sin(nodeGlow * 0.063) + 1) / 2;

  const getServerColor = () => {
    if (simulationState === 'attacking') return '#ff2d55';
    if (simulationState === 'protected') return '#00d4ff';
    return '#00ff88';
  };

  const getFirewallColor = () => {
    if (!config.firewallEnabled) return '#4a7a9b';
    if (simulationState === 'protected') return '#00d4ff';
    return '#00d4ff';
  };

  const serverGlowColor = getServerColor();
  const firewallGlowColor = getFirewallColor();

  return (
    <div
      className="relative flex-1 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(4,12,22,0.95) 0%, rgba(2,8,16,0.92) 100%)',
        border: `1px solid ${
          simulationState === 'attacking' ? 'rgba(255,45,85,0.22)' :
          simulationState === 'protected' ? 'rgba(0,212,255,0.22)' :
          'rgba(0,212,255,0.12)'
        }`,
        boxShadow: simulationState === 'attacking' ?'0 0 30px rgba(255,45,85,0.08), inset 0 1px 0 rgba(255,45,85,0.08)'
          : simulationState === 'protected' ?'0 0 30px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.08)' :'inset 0 1px 0 rgba(0,212,255,0.06)',
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10"
        style={{
          background: simulationState === 'attacking' ?'linear-gradient(90deg, transparent, rgba(255,45,85,0.5), transparent)'
            : simulationState === 'protected' ?'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' :'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)',
        }}
      />

      {/* Panel label */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div
          className="w-0.5 h-4 rounded-full"
          style={{ background: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.8)' }}
        />
        <span className="text-[9px] font-mono-data tracking-[0.2em]" style={{ color: 'rgba(0,212,255,0.4)' }}>
          NETWORK TOPOLOGY
        </span>
      </div>

      {/* State indicator */}
      <div className="absolute top-3 right-3 z-20">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono-data font-bold tracking-widest border"
          style={{
            background: simulationState === 'attacking' ? 'rgba(255,45,85,0.1)' : simulationState === 'protected' ? 'rgba(0,212,255,0.08)' : 'rgba(0,255,136,0.07)',
            borderColor: simulationState === 'attacking' ? 'rgba(255,45,85,0.3)' : simulationState === 'protected' ? 'rgba(0,212,255,0.25)' : 'rgba(0,255,136,0.22)',
            color: simulationState === 'attacking' ? '#ff2d55' : simulationState === 'protected' ? '#00d4ff' : '#00ff88',
            boxShadow: simulationState === 'attacking' ? '0 0 12px rgba(255,45,85,0.2)' : simulationState === 'protected' ? '0 0 12px rgba(0,212,255,0.15)' : '0 0 8px rgba(0,255,136,0.12)',
            textShadow: simulationState === 'attacking' ? '0 0 8px rgba(255,45,85,0.7)' : simulationState === 'protected' ? '0 0 8px rgba(0,212,255,0.6)' : '0 0 8px rgba(0,255,136,0.6)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: simulationState === 'attacking' ? '#ff2d55' : simulationState === 'protected' ? '#00d4ff' : '#00ff88',
              boxShadow: simulationState === 'attacking' ? '0 0 6px rgba(255,45,85,0.8)' : '0 0 6px rgba(0,212,255,0.8)',
              animation: simulationState !== 'idle' ? `${simulationState === 'attacking' ? 'pulseRed' : 'pulseBlue'} 1s infinite` : 'none',
            }}
          />
          {simulationState === 'attacking' ? 'UNDER ATTACK' : simulationState === 'protected' ? 'MITIGATING' : 'NOMINAL'}
        </div>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="fw-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="server-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={simulationState === 'attacking' ? '12' : '7'} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="packet-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="text-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="line-attack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2d55" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#ff2d55" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff2d55" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="line-legit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
          </linearGradient>

          <radialGradient id="server-bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={serverGlowColor} stopOpacity={0.18 + glowIntensity * 0.12} />
            <stop offset="100%" stopColor={serverGlowColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="fw-bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={firewallGlowColor} stopOpacity={0.12 + glowIntensity * 0.1} />
            <stop offset="100%" stopColor={firewallGlowColor} stopOpacity="0" />
          </radialGradient>

          {/* Attacker node gradient */}
          <radialGradient id="attacker-grad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,45,85,0.15)" />
            <stop offset="100%" stopColor="rgba(20,5,10,0.95)" />
          </radialGradient>

          {/* Server body gradient */}
          <linearGradient id="server-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,20,40,0.98)" />
            <stop offset="100%" stopColor="rgba(0,10,20,0.95)" />
          </linearGradient>

          {/* Firewall body gradient */}
          <linearGradient id="fw-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,20,35,0.98)" />
            <stop offset="100%" stopColor="rgba(0,10,20,0.95)" />
          </linearGradient>

          {/* Scan line gradient */}
          <linearGradient id="scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,212,255,0)" />
            <stop offset="50%" stopColor="rgba(0,212,255,0.06)" />
            <stop offset="100%" stopColor="rgba(0,212,255,0)" />
          </linearGradient>
        </defs>

        {/* Fine grid */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
          <line key={`vgrid-${i}`} x1={W * (i / 13)} y1={0} x2={W * (i / 13)} y2={H}
            stroke="rgba(0,212,255,0.025)" strokeWidth="1" />
        ))}
        {Array.from({ length: 8 }, (_, i) => i + 1).map(i => (
          <line key={`hgrid-${i}`} x1={0} y1={H * (i / 9)} x2={W} y2={H * (i / 9)}
            stroke="rgba(0,212,255,0.025)" strokeWidth="1" />
        ))}

        {/* Moving scan line */}
        <rect
          x={0}
          y={scanY - 30}
          width={W}
          height={60}
          fill="url(#scan-grad)"
          opacity={0.6}
        />

        {/* Zone labels */}
        <text x={W * 0.08} y={22} textAnchor="middle" fill="rgba(0,212,255,0.2)" fontSize="8"
          fontFamily="IBM Plex Mono" letterSpacing="3" filter="url(#text-glow)">
          {config.isRunning ? 'ATTACKERS' : 'CLIENTS'}
        </text>
        <text x={firewallPos.x} y={22} textAnchor="middle" fill="rgba(0,212,255,0.2)" fontSize="8"
          fontFamily="IBM Plex Mono" letterSpacing="3">
          FIREWALL
        </text>
        <text x={serverPos.x} y={22} textAnchor="middle" fill="rgba(0,212,255,0.2)" fontSize="8"
          fontFamily="IBM Plex Mono" letterSpacing="3">
          TARGET SERVER
        </text>

        {/* Zone dividers */}
        <line x1={W * 0.32} y1={36} x2={W * 0.32} y2={H - 24}
          stroke="rgba(0,212,255,0.06)" strokeWidth="1" strokeDasharray="3 9" />
        <line x1={W * 0.68} y1={36} x2={W * 0.68} y2={H - 24}
          stroke="rgba(0,212,255,0.06)" strokeWidth="1" strokeDasharray="3 9" />

        {/* Connection lines */}
        {config.isRunning
          ? Array.from({ length: config.attackerCount }, (_, i) => i).map(i => {
              const pos = getAttackerPos(i);
              return (
                <line key={`line-atk-${i}`}
                  x1={pos.x + 14} y1={pos.y}
                  x2={firewallPos.x - 24} y2={firewallPos.y}
                  stroke={config.firewallEnabled ? 'rgba(255,45,85,0.1)' : 'rgba(255,45,85,0.18)'}
                  strokeWidth="1" strokeDasharray="3 7"
                />
              );
            })
          : [0, 1, 2].map(i => {
              const pos = getClientPos(i);
              return (
                <line key={`line-legit-${i}`}
                  x1={pos.x + 14} y1={pos.y}
                  x2={firewallPos.x - 24} y2={firewallPos.y}
                  stroke="rgba(0,212,255,0.08)" strokeWidth="1" strokeDasharray="3 7"
                />
              );
            })}

        {/* Firewall → Server line */}
        <line
          x1={firewallPos.x + 24}
          y1={firewallPos.y}
          x2={serverPos.x - 30}
          y2={serverPos.y}
          stroke={simulationState === 'attacking' && !config.firewallEnabled ? 'rgba(255,45,85,0.22)' : 'rgba(0,212,255,0.14)'}
          strokeWidth="1.5"
          strokeDasharray={config.firewallEnabled ? '4 4' : '2 3'}
        />

        {/* Glow halos */}
        <ellipse cx={firewallPos.x} cy={firewallPos.y} rx={70} ry={70} fill="url(#fw-bg-glow)" />
        <ellipse cx={serverPos.x} cy={serverPos.y} rx={80} ry={80} fill="url(#server-bg-glow)" />

        {/* Packets */}
        {packets.map(pkt => {
          if (pkt.phase === 'blocked-explode') {
            return (
              <g key={pkt.id} opacity={pkt.opacity}>
                <circle cx={pkt.x} cy={pkt.y} r={6 + (1 - pkt.opacity) * 14} fill="none" stroke="#ff2d55" strokeWidth="1" opacity={0.6} />
                <circle cx={pkt.x} cy={pkt.y} r={3 + (1 - pkt.opacity) * 6} fill="none" stroke="#ff6b35" strokeWidth="0.5" opacity={0.4} />
                <circle cx={pkt.x} cy={pkt.y} r={2} fill="#ff2d55" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
                  const rad = (angle * Math.PI) / 180;
                  const dist = (1 - pkt.opacity) * 14;
                  return (
                    <circle key={`spark-${pkt.id}-${angle}`}
                      cx={pkt.x + Math.cos(rad) * dist}
                      cy={pkt.y + Math.sin(rad) * dist}
                      r={1.2} fill="#ff2d55" opacity={pkt.opacity * 0.8}
                    />
                  );
                })}
              </g>
            );
          }
          return (
            <g key={pkt.id} filter="url(#packet-glow)">
              <circle cx={pkt.x} cy={pkt.y} r={pkt.size + 2.5} fill={pkt.color} opacity={0.12} />
              <circle cx={pkt.x} cy={pkt.y} r={pkt.size + 1} fill={pkt.color} opacity={0.2} />
              <circle cx={pkt.x} cy={pkt.y} r={pkt.size} fill={pkt.color} opacity={pkt.opacity * 0.95} />
            </g>
          );
        })}

        {/* Attacker / Client nodes */}
        {config.isRunning
          ? Array.from({ length: config.attackerCount }, (_, i) => i).map(i => {
              const pos = getAttackerPos(i);
              return (
                <g key={`attacker-node-${i}`} filter="url(#node-glow)">
                  {/* Outer pulse ring */}
                  <circle cx={pos.x} cy={pos.y} r={14 + glowIntensity * 4} fill="none"
                    stroke="rgba(255,45,85,0.15)" strokeWidth="1" strokeDasharray="2 4" />
                  {/* Glow halo */}
                  <circle cx={pos.x} cy={pos.y} r={11 + glowIntensity * 2} fill="rgba(255,45,85,0.06)" />
                  {/* Main body */}
                  <rect x={pos.x - 11} y={pos.y - 11} width={22} height={22} rx={5}
                    fill="url(#attacker-grad)"
                    stroke="#ff2d55" strokeWidth={1.5}
                  />
                  {/* Inner highlight */}
                  <rect x={pos.x - 9} y={pos.y - 9} width={18} height={4} rx={2}
                    fill="rgba(255,45,85,0.12)" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#ff2d55" fontSize="8"
                    fontFamily="IBM Plex Mono" fontWeight="bold"
                    style={{ textShadow: '0 0 6px rgba(255,45,85,0.8)' }}>
                    {i + 1}
                  </text>
                  {/* Status dot */}
                  <circle cx={pos.x + 9} cy={pos.y - 9} r={3} fill="#ff2d55"
                    opacity={0.8 + glowIntensity * 0.2}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,45,85,0.8))' }}
                  />
                </g>
              );
            })
          : [0, 1, 2].map(i => {
              const pos = getClientPos(i);
              return (
                <g key={`client-node-${i}`} filter="url(#node-glow)">
                  <circle cx={pos.x} cy={pos.y} r={14 + glowIntensity * 2} fill="rgba(0,212,255,0.05)" />
                  <circle cx={pos.x} cy={pos.y} r={13} fill="rgba(4,14,26,0.95)"
                    stroke="#00d4ff" strokeWidth="1.5" />
                  <circle cx={pos.x} cy={pos.y} r={8} fill="rgba(0,212,255,0.06)" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#00d4ff" fontSize="8"
                    fontFamily="IBM Plex Mono" fontWeight="bold">
                    C{i + 1}
                  </text>
                </g>
              );
            })}

        {/* Firewall Node — premium design */}
        <g filter="url(#fw-glow)">
          {/* Outer rotating ring */}
          <circle
            cx={firewallPos.x}
            cy={firewallPos.y}
            r={34 + glowIntensity * 5}
            fill="none"
            stroke={config.firewallEnabled ? 'rgba(0,212,255,0.12)' : 'rgba(74,122,155,0.08)'}
            strokeWidth="1"
            strokeDasharray="3 6"
          />
          {/* Mid ring */}
          <circle
            cx={firewallPos.x}
            cy={firewallPos.y}
            r={26}
            fill="none"
            stroke={config.firewallEnabled ? 'rgba(0,212,255,0.25)' : 'rgba(74,122,155,0.15)'}
            strokeWidth="1"
          />
          {/* Main body */}
          <rect
            x={firewallPos.x - 20}
            y={firewallPos.y - 22}
            width={40}
            height={44}
            rx={8}
            fill="url(#fw-body-grad)"
            stroke={config.firewallEnabled ? '#00d4ff' : '#4a7a9b'}
            strokeWidth={config.firewallEnabled ? 2 : 1}
          />
          {/* Top highlight */}
          <rect
            x={firewallPos.x - 16}
            y={firewallPos.y - 20}
            width={32}
            height={3}
            rx={2}
            fill={config.firewallEnabled ? 'rgba(0,212,255,0.15)' : 'rgba(74,122,155,0.1)'}
          />
          {/* Shield icon */}
          <path
            d={`M ${firewallPos.x} ${firewallPos.y - 13} L ${firewallPos.x + 9} ${firewallPos.y - 7} L ${firewallPos.x + 9} ${firewallPos.y + 4} Q ${firewallPos.x} ${firewallPos.y + 15} ${firewallPos.x - 9} ${firewallPos.y + 4} L ${firewallPos.x - 9} ${firewallPos.y - 7} Z`}
            fill="none"
            stroke={config.firewallEnabled ? '#00d4ff' : '#4a7a9b'}
            strokeWidth="1.5"
          />
          {/* Checkmark in shield */}
          {config.firewallEnabled && (
            <path
              d={`M ${firewallPos.x - 4} ${firewallPos.y} L ${firewallPos.x - 1} ${firewallPos.y + 4} L ${firewallPos.x + 5} ${firewallPos.y - 3}`}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
          {/* Status dot */}
          <circle
            cx={firewallPos.x + 16}
            cy={firewallPos.y - 18}
            r={4.5}
            fill={config.firewallEnabled ? '#00d4ff' : '#4a7a9b'}
            opacity={0.85 + glowIntensity * 0.15}
          />
          <circle
            cx={firewallPos.x + 16}
            cy={firewallPos.y - 18}
            r={2}
            fill="rgba(0,0,0,0.5)"
          />
          {/* Label */}
          <text
            x={firewallPos.x}
            y={firewallPos.y + 35}
            textAnchor="middle"
            fill={config.firewallEnabled ? '#00d4ff' : '#4a7a9b'}
            fontSize="8"
            fontFamily="IBM Plex Mono"
            letterSpacing="2"
            opacity={0.7 + glowIntensity * 0.3}
          >
            {config.firewallEnabled ? 'ACTIVE' : 'OFFLINE'}
          </text>
        </g>

        {/* Server Node — premium design */}
        <g filter="url(#server-glow)">
          {/* Outer pulse rings */}
          <circle
            cx={serverPos.x}
            cy={serverPos.y}
            r={42 + glowIntensity * 7}
            fill="none"
            stroke={serverGlowColor}
            strokeWidth="0.5"
            opacity={0.1 + glowIntensity * 0.08}
          />
          <circle
            cx={serverPos.x}
            cy={serverPos.y}
            r={34}
            fill="none"
            stroke={serverGlowColor}
            strokeWidth="0.8"
            opacity={0.2 + glowIntensity * 0.12}
          />
          {/* Server body */}
          <rect
            x={serverPos.x - 24}
            y={serverPos.y - 30}
            width={48}
            height={60}
            rx={8}
            fill="url(#server-body-grad)"
            stroke={serverGlowColor}
            strokeWidth="2"
          />
          {/* Top highlight */}
          <rect
            x={serverPos.x - 20}
            y={serverPos.y - 28}
            width={40}
            height={3}
            rx={2}
            fill={`${serverGlowColor}20`}
          />
          {/* Server rack units */}
          {[0, 1, 2, 3].map(row => (
            <g key={`srv-rack-${row}`}>
              <rect
                x={serverPos.x - 18}
                y={serverPos.y - 24 + row * 13}
                width={36}
                height={10}
                rx={2}
                fill={`${serverGlowColor}06`}
                stroke={serverGlowColor}
                strokeWidth="0.5"
                opacity="0.7"
              />
              {/* Rack detail lines */}
              <line
                x1={serverPos.x - 14}
                y1={serverPos.y - 19 + row * 13}
                x2={serverPos.x + 4}
                y2={serverPos.y - 19 + row * 13}
                stroke={`${serverGlowColor}30`}
                strokeWidth="0.5"
              />
            </g>
          ))}
          {/* Status LEDs */}
          {[0, 1, 2, 3].map(i => (
            <circle
              key={`led-${i}`}
              cx={serverPos.x + 12}
              cy={serverPos.y - 20 + i * 13}
              r={2.5}
              fill={
                simulationState === 'attacking' && i === 0 ? '#ff2d55' :
                simulationState === 'protected' ? '#00d4ff' : '#00ff88'
              }
              opacity={0.85 + glowIntensity * 0.15}
            />
          ))}
          {/* Load bar */}
          <rect
            x={serverPos.x - 18}
            y={serverPos.y + 24}
            width={36}
            height={5}
            rx={2.5}
            fill="rgba(0,212,255,0.06)"
          />
          <rect
            x={serverPos.x - 18}
            y={serverPos.y + 24}
            width={Math.max(3, 36 * (metrics.serverLoad / 100))}
            height={5}
            rx={2.5}
            fill={
              metrics.serverLoad > 75 ? '#ff2d55' :
              metrics.serverLoad > 45 ? '#ffaa00' : '#00ff88'
            }
            style={{
              filter: `drop-shadow(0 0 4px ${metrics.serverLoad > 75 ? '#ff2d55' : '#00ff88'})`
            }}
          />
          {/* Label */}
          <text
            x={serverPos.x}
            y={serverPos.y + 42}
            textAnchor="middle"
            fill={serverGlowColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
            letterSpacing="1"
            opacity={0.7 + glowIntensity * 0.3}
          >
            {metrics.serverLoad}% LOAD
          </text>
        </g>

        {/* Zone labels bottom */}
        {config.isRunning && (
          <text
            x={W * 0.08}
            y={H - 14}
            textAnchor="middle"
            fill="rgba(255,45,85,0.35)"
            fontSize="8"
            fontFamily="IBM Plex Mono"
            letterSpacing="2"
          >
            {config.attackerCount} BOTS ACTIVE
          </text>
        )}

        {/* Firewall filtering indicator */}
        {simulationState === 'protected' && config.isRunning && (
          <g>
            <text
              x={firewallPos.x}
              y={firewallPos.y - 44}
              textAnchor="middle"
              fill="#00d4ff"
              fontSize="8"
              fontFamily="IBM Plex Mono"
              letterSpacing="2"
              opacity={0.6 + glowIntensity * 0.4}
            >
              FILTERING
            </text>
            {[0, 1, 2].map(i => (
              <rect
                key={`filter-bar-${i}`}
                x={firewallPos.x - 12 + i * 10}
                y={firewallPos.y - 40}
                width={7}
                height={3 + i * 2}
                rx={1}
                fill="#00d4ff"
                opacity={0.35 + i * 0.2}
              />
            ))}
          </g>
        )}

        {/* Attack overload indicator */}
        {simulationState === 'attacking' && !config.firewallEnabled && (
          <text
            x={serverPos.x}
            y={serverPos.y - 50}
            textAnchor="middle"
            fill="#ff2d55"
            fontSize="9"
            fontFamily="IBM Plex Mono"
            fontWeight="bold"
            letterSpacing="1"
            opacity={0.65 + glowIntensity * 0.35}
          >
            ⚠ OVERLOADING
          </text>
        )}
      </svg>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 z-10">
        {[
          { color: '#ff2d55', label: 'Malicious' },
          { color: '#00d4ff', label: 'Legitimate' },
          { color: '#00ff88', label: 'Filtered' },
        ].map(item => (
          <div key={`legend-${item.label}`} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
            <span className="text-[8px] font-mono-data" style={{ color: 'rgba(0,212,255,0.35)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Packet count */}
      <div className="absolute bottom-3 right-3 z-10">
        <span className="text-[8px] font-mono-data" style={{ color: 'rgba(0,212,255,0.25)' }}>
          {packets.length} pkts in transit
        </span>
      </div>
    </div>
  );
}