import React from 'react';

const statusClasses = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Under Review': 'bg-blue-50 text-blue-700 ring-blue-200',
  Assigned: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'In Progress': 'bg-violet-50 text-violet-700 ring-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const priorityClasses = {
  High: 'bg-red-50 text-red-700 ring-red-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function ComplaintStatusBadge({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusClasses[status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{status || 'Unknown'}</span>;
}

export function ComplaintPriorityBadge({ priority }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${priorityClasses[priority] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{priority || 'Unrated'}</span>;
}
