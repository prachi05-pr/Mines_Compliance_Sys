import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'compliance' | 'inspection' | 'violation' | 'operational';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'compliance' }) => {
  const s = (status || '').toUpperCase();

  let style = 'bg-slate-100 text-slate-700 border-slate-300';

  if (s === 'COMPLIANT' || s === 'COMPLETED' || s === 'ACTIVE') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium';
  } else if (s === 'PARTIALLY_COMPLIANT' || s === 'UNDER_REVIEW' || s === 'AI_ANALYZED') {
    style = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
  } else if (s === 'NON_COMPLIANT' || s === 'OVERDUE' || s === 'CONFIRMED' || s === 'CRITICAL') {
    style = 'bg-red-50 text-red-800 border-red-300 font-semibold';
  } else if (s === 'AI_SUGGESTED') {
    style = 'bg-purple-50 text-purple-800 border-purple-300 font-medium';
  } else if (s === 'REJECTED' || s === 'INACTIVE') {
    style = 'bg-slate-100 text-slate-600 border-slate-300';
  } else if (s === 'DRAFT') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const label = s.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border tracking-tight ${style}`}>
      {label}
    </span>
  );
};
