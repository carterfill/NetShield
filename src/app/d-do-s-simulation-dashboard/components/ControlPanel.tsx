'use client';

import React, { useState } from 'react';
import { Play, Square, Shield, ShieldOff, Zap, Settings, Users, AlertTriangle, ChevronDown, RotateCcw, Target, Radio, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import type { SimulationConfig, SimulationState, AttackType } from './SimulationDashboard';

interface ControlPanelProps {
  config: SimulationConfig;
  simulationState: SimulationState;
  onStartAttack: () => void;
  onStopAttack: () => void;
  onToggleFirewall: (enabled: boolean) => void;
  onUpdateConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
}

const attackTypes: { value: AttackType; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { value: 'syn-flood', label: 'SYN Flood', desc: 'TCP handshake exhaustion', color: 'text-neon-red', bg: 'rgba(255,45,85,0.08)', border: 'rgba(255,45,85,0.25)' },
  { value: 'udp-flood', label: 'UDP Flood', desc: 'Connectionless packet storm', color: 'text-neon-amber', bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.25)' },
  { value: 'http-flood', label: 'HTTP Flood', desc: 'Layer 7 request saturation', color: 'text-neon-blue', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)' },
  { value: 'icmp-flood', label: 'ICMP Flood', desc: 'Ping of death variant', color: 'text-neon-purple', bg: 'rgba(191,95,255,0.08)', border: 'rgba(191,95,255,0.25)' },
];

const attackerCounts = [3, 5, 8, 12, 20];

export default function ControlPanel({
  config,
  simulationState,
  onStartAttack,
  onStopAttack,
  onToggleFirewall,
  onUpdateConfig,
}: ControlPanelProps) {
  const [attackTypeOpen, setAttackTypeOpen] = useState(false);

  const handleStartStop = () => {
    if (config.isRunning) {
      onStopAttack();
      toast.info('Simulation stopped — network returning to baseline');
    } else {
      onStartAttack();
      toast.error(`Attack launched: ${config.attackType.toUpperCase()} at ${config.attackIntensity}% intensity`);
    }
  };

  const handleFirewallToggle = () => {
    const newState = !config.firewallEnabled;
    onToggleFirewall(newState);
    if (newState) {
      toast.success('Firewall ENABLED — traffic filtering active');
    } else {
      toast.warning('Firewall DISABLED — network exposed');
    }
  };

  const handleReset = () => {
    if (config.isRunning) {
      onStopAttack();
    }
    onUpdateConfig({
      attackIntensity: 50,
      firewallEnabled: true,
      attackType: 'syn-flood',
      attackerCount: 5,
      isRunning: false,
    });
    toast.info('Simulation reset to defaults');
  };

  const selectedAttack = attackTypes.find(a => a.value === config.attackType) || attackTypes[0];

  const intensityColor = config.attackIntensity >= 80 ? '#ff2d55' : config.attackIntensity >= 50 ? '#ffaa00' : '#00d4ff';
  const intensityGlow = config.attackIntensity >= 80 ? 'rgba(255,45,85,0.4)' : config.attackIntensity >= 50 ? 'rgba(255,170,0,0.3)' : 'rgba(0,212,255,0.3)';

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Panel header */}
      <div
        className="holo-panel rounded-xl p-3 flex items-center gap-2"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)]">
          <Settings size={12} className="text-neon-blue" />
        </div>
        <span className="text-[10px] font-mono-data font-semibold tracking-[0.2em] text-neon-blue uppercase text-glow-blue">
          Simulation Controls
        </span>
        <button
          onClick={handleReset}
          className="ml-auto p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition-all duration-200 group border border-transparent hover:border-[rgba(0,212,255,0.2)]"
          title="Reset to defaults"
        >
          <RotateCcw size={11} className="text-[#4a7a9b] group-hover:text-neon-blue transition-colors" />
        </button>
      </div>

      {/* Attack Type Selector */}
      <div
        className={`holo-panel rounded-xl p-3 flex flex-col gap-2 relative ${
          attackTypeOpen ? 'z-40' : ''
        }`}
        style={{
          overflow: attackTypeOpen ? 'visible' : 'hidden',
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <Target size={10} className="text-neon-red" />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Attack Vector</span>
        </div>
        <div className="relative z-10">
          <button
            onClick={() => setAttackTypeOpen(p => !p)}
            disabled={config.isRunning}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 ${
              config.isRunning
                ? 'opacity-50 cursor-not-allowed' :'cursor-pointer hover:scale-[1.01]'
            }`}
            style={{
              background: config.isRunning ? 'rgba(0,212,255,0.03)' : selectedAttack.bg,
              borderColor: config.isRunning ? 'rgba(0,212,255,0.08)' : selectedAttack.border,
              boxShadow: config.isRunning ? 'none' : `0 0 12px ${selectedAttack.border}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: intensityColor, boxShadow: `0 0 6px ${intensityColor}` }}
              />
              <div className="flex flex-col items-start">
                <span className={`text-xs font-semibold ${selectedAttack.color}`}>{selectedAttack.label}</span>
                <span className="text-[8px] font-mono-data text-[#4a7a9b]">{selectedAttack.desc}</span>
              </div>
            </div>
            <ChevronDown size={11} className={`text-[#4a7a9b] transition-transform duration-200 ${attackTypeOpen ? 'rotate-180' : ''}`} />
          </button>

          {attackTypeOpen && !config.isRunning && (
            <div
              className="absolute top-full left-0 right-0 mt-1 z-[80] rounded-xl overflow-hidden border"
              style={{
                background: 'rgba(4, 12, 22, 0.98)',
                backdropFilter: 'blur(24px)',
                borderColor: 'rgba(0,212,255,0.15)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)',
              }}
            >
              {attackTypes.map((at, idx) => (
                <button
                  key={`attack-type-${at.value}`}
                  onClick={() => {
                    onUpdateConfig(prev => ({ ...prev, attackType: at.value }));
                    setAttackTypeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all duration-150 ${
                    idx < attackTypes.length - 1 ? 'border-b border-[rgba(0,212,255,0.06)]' : ''
                  }`}
                  style={{
                    background: config.attackType === at.value ? at.bg : 'transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = at.bg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = config.attackType === at.value ? at.bg : 'transparent'; }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full" style={{ background: at.color.replace('text-neon-', '#').replace('text-', '') === at.color ? '#00d4ff' : 'currentColor', backgroundColor: at.value === 'syn-flood' ? '#ff2d55' : at.value === 'udp-flood' ? '#ffaa00' : at.value === 'http-flood' ? '#00d4ff' : '#bf5fff' }} />
                    <div className="flex flex-col items-start">
                      <span className={`text-xs font-semibold ${at.color}`}>{at.label}</span>
                      <span className="text-[8px] font-mono-data text-[#4a7a9b]">{at.desc}</span>
                    </div>
                  </div>
                  {config.attackType === at.value && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: at.value === 'syn-flood' ? '#ff2d55' : at.value === 'udp-flood' ? '#ffaa00' : at.value === 'http-flood' ? '#00d4ff' : '#bf5fff', boxShadow: `0 0 6px currentColor` }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attack Intensity */}
      <div className="holo-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-neon-amber" />
            <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Intensity</span>
          </div>
          <div
            className="px-2 py-0.5 rounded-md font-mono-data font-bold text-sm"
            style={{
              color: intensityColor,
              background: `${intensityColor}15`,
              border: `1px solid ${intensityColor}40`,
              textShadow: `0 0 8px ${intensityColor}`,
              boxShadow: `0 0 8px ${intensityGlow}`,
            }}
          >
            {config.attackIntensity}%
          </div>
        </div>

        <div className="flex justify-between text-[7px] font-mono-data text-[#2a4a6b] mb-0.5">
          <span>LOW</span><span>MED</span><span>HIGH</span><span>CRIT</span>
        </div>

        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={config.attackIntensity}
          onChange={e => onUpdateConfig(prev => ({ ...prev, attackIntensity: Number(e.target.value) }))}
          className={`intensity-track w-full ${config.isRunning ? 'intensity-track-attack' : ''}`}
          style={{
            background: `linear-gradient(to right, ${intensityColor} ${config.attackIntensity}%, rgba(0,212,255,0.08) ${config.attackIntensity}%)`,
            boxShadow: `0 0 6px ${intensityGlow}`,
          }}
        />

        {/* Intensity tier badges */}
        <div className="grid grid-cols-4 gap-1 mt-0.5">
          {[
            { label: 'Low', range: '≤30%', color: '#00ff88', active: config.attackIntensity <= 30 },
            { label: 'Med', range: '≤60%', color: '#ffaa00', active: config.attackIntensity > 30 && config.attackIntensity <= 60 },
            { label: 'High', range: '≤85%', color: '#ff6b35', active: config.attackIntensity > 60 && config.attackIntensity <= 85 },
            { label: 'Crit', range: '>85%', color: '#ff2d55', active: config.attackIntensity > 85 },
          ].map(tier => (
            <div
              key={`tier-${tier.label}`}
              className="rounded-lg px-1 py-1 text-center transition-all duration-300"
              style={{
                background: tier.active ? `${tier.color}12` : 'transparent',
                border: `1px solid ${tier.active ? `${tier.color}35` : 'rgba(0,212,255,0.06)'}`,
                boxShadow: tier.active ? `0 0 8px ${tier.color}25` : 'none',
              }}
            >
              <div
                className="text-[8px] font-mono-data font-bold"
                style={{
                  color: tier.active ? tier.color : '#2a4a6b',
                  textShadow: tier.active ? `0 0 6px ${tier.color}` : 'none',
                }}
              >
                {tier.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attacker Count */}
      <div className="holo-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Users size={10} className="text-neon-red" />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Attacker Nodes</span>
          <span
            className="ml-auto text-sm font-mono-data font-bold text-neon-red"
            style={{ textShadow: '0 0 8px rgba(255,45,85,0.6)' }}
          >
            {config.attackerCount}
          </span>
        </div>
        <div className="flex gap-1.5">
          {attackerCounts.map(count => (
            <button
              key={`attacker-count-${count}`}
              onClick={() => onUpdateConfig(prev => ({ ...prev, attackerCount: count }))}
              disabled={config.isRunning}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono-data font-bold transition-all duration-200 active:scale-95 ${
                config.isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
              }`}
              style={{
                background: config.attackerCount === count ? 'rgba(255,45,85,0.18)' : 'rgba(255,45,85,0.04)',
                border: `1px solid ${config.attackerCount === count ? 'rgba(255,45,85,0.5)' : 'rgba(255,45,85,0.1)'}`,
                color: config.attackerCount === count ? '#ff2d55' : '#4a7a9b',
                boxShadow: config.attackerCount === count ? '0 0 10px rgba(255,45,85,0.3), inset 0 1px 0 rgba(255,45,85,0.1)' : 'none',
                textShadow: config.attackerCount === count ? '0 0 8px rgba(255,45,85,0.8)' : 'none',
              }}
            >
              {count}
            </button>
          ))}
        </div>
        {/* Animated bot dots */}
        <div className="flex gap-1 mt-0.5">
          {Array.from({ length: config.attackerCount }, (_, i) => i).map(i => (
            <div
              key={`dot-attacker-${i}`}
              className="flex-1 h-1 rounded-full"
              style={{
                background: config.isRunning
                  ? `linear-gradient(90deg, #ff2d55, #ff6b35)`
                  : 'rgba(255,45,85,0.3)',
                opacity: config.isRunning ? 0.9 : 0.4,
                animation: config.isRunning ? `pulseRed ${0.7 + i * 0.04}s ease-in-out infinite` : 'none',
                boxShadow: config.isRunning ? '0 0 4px rgba(255,45,85,0.7)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Firewall Toggle */}
      <div
        className="rounded-xl p-3 flex flex-col gap-2 border transition-all duration-500"
        style={{
          background: config.firewallEnabled
            ? 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,212,255,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(255,45,85,0.07) 0%, rgba(255,45,85,0.03) 100%)',
          borderColor: config.firewallEnabled ? 'rgba(0,212,255,0.2)' : 'rgba(255,45,85,0.2)',
          boxShadow: config.firewallEnabled
            ? '0 0 16px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.08)'
            : '0 0 16px rgba(255,45,85,0.08), inset 0 1px 0 rgba(255,45,85,0.06)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {config.firewallEnabled ? (
              <Shield size={12} className="text-neon-blue" style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.6))' }} />
            ) : (
              <ShieldOff size={12} className="text-neon-red" style={{ filter: 'drop-shadow(0 0 4px rgba(255,45,85,0.6))' }} />
            )}
            <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Firewall</span>
          </div>
          {/* Premium toggle */}
          <button
            onClick={handleFirewallToggle}
            className="relative w-12 h-6 rounded-full border transition-all duration-400 focus:outline-none"
            style={{
              background: config.firewallEnabled
                ? 'linear-gradient(90deg, rgba(0,212,255,0.15), rgba(0,212,255,0.25))'
                : 'linear-gradient(90deg, rgba(255,45,85,0.1), rgba(255,45,85,0.18))',
              borderColor: config.firewallEnabled ? 'rgba(0,212,255,0.5)' : 'rgba(255,45,85,0.4)',
              boxShadow: config.firewallEnabled
                ? '0 0 12px rgba(0,212,255,0.3), inset 0 1px 0 rgba(0,212,255,0.15)'
                : '0 0 12px rgba(255,45,85,0.25)',
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
              style={{
                left: config.firewallEnabled ? '26px' : '2px',
                background: config.firewallEnabled
                  ? 'radial-gradient(circle, #00d4ff, #0088aa)'
                  : 'radial-gradient(circle, #ff2d55, #aa0022)',
                boxShadow: config.firewallEnabled
                  ? '0 0 10px rgba(0,212,255,0.8), 0 0 20px rgba(0,212,255,0.4)'
                  : '0 0 10px rgba(255,45,85,0.8), 0 0 20px rgba(255,45,85,0.4)',
              }}
            />
          </button>
        </div>

        <div
          className="text-[9px] font-mono-data font-semibold tracking-wider flex items-center gap-1.5"
          style={{
            color: config.firewallEnabled ? '#00d4ff' : '#ff2d55',
            textShadow: config.firewallEnabled ? '0 0 8px rgba(0,212,255,0.5)' : '0 0 8px rgba(255,45,85,0.5)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: config.firewallEnabled ? '#00d4ff' : '#ff2d55',
              boxShadow: config.firewallEnabled ? '0 0 6px rgba(0,212,255,0.8)' : '0 0 6px rgba(255,45,85,0.8)',
              animation: config.firewallEnabled ? 'pulseBlue 2s ease-in-out infinite' : 'pulseRed 1s ease-in-out infinite',
            }}
          />
          {config.firewallEnabled ? 'ACTIVE — Traffic filtering ON' : 'DISABLED — Network exposed'}
        </div>

        {config.firewallEnabled && (
          <div className="grid grid-cols-2 gap-1 mt-0.5">
            {[
              { label: 'Rate Limiting', active: true },
              { label: 'IP Blacklist', active: true },
              { label: 'Deep Packet Inspect', active: config.attackIntensity > 30 },
              { label: 'GeoBlock', active: config.attackIntensity > 60 },
            ].map(rule => (
              <div
                key={`fw-rule-${rule.label}`}
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[7px] font-mono-data transition-all duration-300"
                style={{
                  background: rule.active ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.02)',
                  border: `1px solid ${rule.active ? 'rgba(0,212,255,0.18)' : 'rgba(0,212,255,0.05)'}`,
                  color: rule.active ? '#00d4ff' : '#2a4a6b',
                }}
              >
                <div
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{
                    background: rule.active ? '#00d4ff' : '#2a4a6b',
                    boxShadow: rule.active ? '0 0 4px rgba(0,212,255,0.6)' : 'none',
                  }}
                />
                {rule.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protocol Info */}
      <div className="holo-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Radio size={10} className="text-neon-purple" />
          <span className="text-[9px] font-mono-data tracking-[0.15em] text-[#4a7a9b] uppercase">Protocol Info</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Target IP', value: '192.168.1.100' },
            { label: 'Port', value: '443 / HTTPS' },
            { label: 'Protocol', value: config.attackType === 'syn-flood' ? 'TCP' : config.attackType === 'udp-flood' ? 'UDP' : config.attackType === 'icmp-flood' ? 'ICMP' : 'HTTP' },
            { label: 'Botnet', value: `${config.attackerCount} nodes` },
          ].map(item => (
            <div
              key={`proto-${item.label}`}
              className="flex flex-col px-2 py-1.5 rounded-lg"
              style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.07)' }}
            >
              <span className="text-[7px] font-mono-data tracking-widest" style={{ color: 'rgba(0,212,255,0.3)' }}>{item.label}</span>
              <span className="text-[9px] font-mono-data font-semibold text-[#4a7a9b]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start / Stop Button */}
      <div className="mt-auto">
        <button
          onClick={handleStartStop}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm tracking-[0.15em] transition-all duration-200 active:scale-[0.98] border relative overflow-hidden ${
            config.isRunning ? 'btn-attack' : 'btn-launch'
          }`}
          style={{
            background: config.isRunning
              ? 'linear-gradient(135deg, rgba(255,45,85,0.15) 0%, rgba(255,45,85,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.06) 100%)',
            borderColor: config.isRunning ? 'rgba(255,45,85,0.5)' : 'rgba(0,212,255,0.4)',
            color: config.isRunning ? '#ff2d55' : '#00d4ff',
            boxShadow: config.isRunning
              ? '0 0 20px rgba(255,45,85,0.3), 0 0 40px rgba(255,45,85,0.1), inset 0 1px 0 rgba(255,45,85,0.15)'
              : '0 0 20px rgba(0,212,255,0.2), 0 0 40px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.12)',
            textShadow: config.isRunning ? '0 0 10px rgba(255,45,85,0.8)' : '0 0 10px rgba(0,212,255,0.8)',
            animation: config.isRunning ? 'attackPulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: config.isRunning ? 'rgba(255,45,85,0.5)' : 'rgba(0,212,255,0.5)' }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: config.isRunning ? 'rgba(255,45,85,0.5)' : 'rgba(0,212,255,0.5)' }} />

          {config.isRunning ? (
            <>
              <Square size={13} fill="currentColor" />
              STOP SIMULATION
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              LAUNCH ATTACK
            </>
          )}
        </button>

        {config.isRunning && (
          <div className="mt-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.15)' }}
          >
            <AlertTriangle size={9} className="text-neon-amber animate-blink" />
            <span className="text-[8px] font-mono-data font-bold text-neon-amber tracking-[0.15em] animate-blink"
              style={{ textShadow: '0 0 8px rgba(255,170,0,0.6)' }}
            >
              SIMULATION ACTIVE
            </span>
            <Cpu size={9} className="text-neon-amber animate-spin-slow" />
          </div>
        )}
      </div>
    </div>
  );
}
