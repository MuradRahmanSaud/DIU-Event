import React from "react";
import { DIUEvent, ActiveTab } from "../types";
import { 
  CalendarDays, 
  Flame, 
  CheckCircle2, 
  Layers, 
  Users 
} from "lucide-react";

interface StatsGridProps {
  events: DIUEvent[];
  onTabChange: (tab: ActiveTab) => void;
}

export function StatsGrid({ events, onTabChange }: StatsGridProps) {
  // Compute metrics dynamically
  const total = events.length;
  
  const ongoing = events.filter(e => {
    const status = (e["Event Status"] || "").toLowerCase();
    return status === "ongoing" || status === "active" || status === "running";
  }).length;

  const upcoming = events.filter(e => {
    const status = (e["Event Status"] || "").toLowerCase();
    return status === "upcoming" || status === "yet to start";
  }).length;

  const completed = events.filter(e => {
    const status = (e["Event Status"] || "").toLowerCase();
    return status === "completed" || status === "done" || status === "finished";
  }).length;

  // Group by category helper
  const categoryCounts = events.reduce((acc: { [key: string]: number }, e) => {
    const cat = e["Event Category"] || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Group by organizer helper
  const organizerCounts = events.reduce((acc: { [key: string]: number }, e) => {
    const org = e["Organizer"] || "General";
    acc[org] = (acc[org] || 0) + 1;
    return acc;
  }, {});

  return (
    <div id="stats-container" className="space-y-4">
      {/* Short and elegant welcome panel */}
      <div id="welcome-card" className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-3.5 rounded border border-teal-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold font-display tracking-tight text-white">
            Welcome to Daffodil International University (DIU) Events Suite
          </h2>
          <p className="text-[11px] text-teal-200 mt-0.5 max-w-xl">
            A high-performance compact event administration hub synced directly to the official Google Sheet database. Edit, insert, and update your educational programs seamlessly inside a single optimized workspace.
          </p>
        </div>
        <button
          id="btn-quick-manage"
          onClick={() => onTabChange("eventList")}
          className="shrink-0 bg-emerald-500 text-slate-950 font-medium px-2.5 py-1 text-xs rounded hover:bg-emerald-400 transition-colors"
        >
          Manage All Events
        </button>
      </div>

      {/* Main KPI Row */}
      <div id="stats-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* KPI: Total */}
        <div className="bento-card p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Events</span>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 leading-tight">{total}</span>
          </div>
        </div>

        {/* KPI: Ongoing */}
        <div className="bento-card p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <Flame className="w-4 h-4 animate-pulse text-teal-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-teal-600 font-mono uppercase tracking-wider font-bold">Ongoing</span>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 leading-tight">{ongoing}</span>
          </div>
        </div>

        {/* KPI: Upcoming */}
        <div className="bento-card p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-blue-600 font-mono uppercase tracking-wider font-bold">Upcoming</span>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 leading-tight">{upcoming}</span>
          </div>
        </div>

        {/* KPI: Completed */}
        <div className="bento-card p-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-wider font-bold">Completed</span>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 leading-tight">{completed}</span>
          </div>
        </div>

      </div>

      {/* Two Columns details - Category Breakdown & Organizer Statistics */}
      <div id="stats-breakdowns" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Category breakdown (compact) */}
        <div className="bento-card p-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <span className="text-xs font-bold text-slate-800">Event Categories</span>
            <span className="text-[9px] font-mono text-slate-400 font-semibold">{Object.keys(categoryCounts).length} Distinct</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto compact-scrollbar pr-1">
            {Object.keys(categoryCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No categories found in current sheet.</p>
            ) : (
              Object.entries(categoryCounts)
                .sort((a,b) => b[1] - a[1])
                .map(([category, count]) => {
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate font-medium text-slate-700" title={category}>{category}</span>
                      <div className="flex-1 bg-slate-100 h-2 rounded overflow-hidden">
                        <div 
                          className="bg-teal-600 h-full rounded" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-slate-500 w-8 text-right font-semibold">
                        {count} ({percentage}%)
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Organizer counts (compact) */}
        <div className="bento-card p-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <span className="text-xs font-bold text-slate-800">Organizing Clubs & Units</span>
            <span className="text-[9px] font-mono text-slate-400 font-semibold">Active Hosts</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto compact-scrollbar pr-1">
            {Object.keys(organizerCounts).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hosts recorded yet.</p>
            ) : (
              Object.entries(organizerCounts)
                .sort((a,b) => b[1] - a[1])
                .map(([organizer, count]) => {
                  return (
                    <div key={organizer} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold text-slate-700" title={organizer}>{organizer}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {count} {count === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
