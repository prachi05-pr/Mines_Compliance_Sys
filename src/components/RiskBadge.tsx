import React from 'react';
import { RiskLevel } from '../types/index.js';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const normalized = (level || 'LOW').toUpperCase();

  let colors = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let dotColor = 'bg-emerald-500';

  if (normalized === 'MEDIUM') {
    colors = 'bg-amber-100 text-amber-900 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'HIGH') {
    colors = 'bg-orange-100 text-orange-900 border-orange-300';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'CRITICAL') {
    colors = 'bg-red-100 text-red-900 border-red-300';
    dotColor = 'bg-red-600 animate-pulse';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors} ${sizeClasses[size]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span>{normalized} RISK</span>
      {score !== undefined && (
        <span className="ml-1 opacity-75 font-mono text-[11px]">({score})</span>
      )}
    </span>
  );
};
