import React, { useState, useMemo } from "react";
import { DIUEvent } from "../types";
import { 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  Filter, 
  ExternalLink,
  ChevronDown,
  Clock,
  Briefcase,
  AlertCircle
} from "lucide-react";

interface CompactTableProps {
  events: DIUEvent[];
  onSelectEvent: (event: DIUEvent) => void;
  onEditEvent: (event: DIUEvent) => void;
  onDeleteEvent: (event: DIUEvent) => void;
  selectedEvent: DIUEvent | null;
}

export function CompactTable({ 
  events, 
  onSelectEvent, 
  onEditEvent, 
  onDeleteEvent,
  selectedEvent
}: CompactTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dynamically extract categories for filter dropdown
  const categories = useMemo(() => {
    const list = new Set(events.map(e => e["Event Category"]).filter(Boolean));
    return ["All", ...Array.from(list)];
  }, [events]);

  // Dynamically extract statuses for filter dropdown
  const statuses = useMemo(() => {
    const list = new Set(events.map(e => e["Event Status"]).filter(Boolean));
    return ["All", ...Array.from(list)];
  }, [events]);

  // Client-side quick filter logic
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const title = (e["Event Title"] || "").toLowerCase();
      const desc = (e["Description"] || "").toLowerCase();
      const cat = (e["Event Category"] || "").toLowerCase();
      const org = (e["Organizer"] || "").toLowerCase();
      
      const matchesSearch = 
        title.includes(searchTerm.toLowerCase()) ||
        desc.includes(searchTerm.toLowerCase()) ||
        cat.includes(searchTerm.toLowerCase()) ||
        org.includes(searchTerm.toLowerCase());

      const matchesCategory = 
        categoryFilter === "All" || 
        e["Event Category"] === categoryFilter;

      const matchesStatus = 
        statusFilter === "All" || 
        e["Event Status"] === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [events, searchTerm, categoryFilter, statusFilter]);

  // Helper color logic for status badges based on Bento Grid guidelines
  const getStatusBadgeStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "ongoing":
      case "active":
      case "running":
        return "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]";
      case "upcoming":
        return "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]";
      case "completed":
        return "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-250";
      default:
        return "bg-slate-100 text-slate-700 border-slate-250";
    }
  };

  return (
    <div id="compact-table-panel" className="bento-card flex flex-col overflow-hidden max-h-[580px]">
      
      {/* Filtering and search inputs - Extremely compact padding */}
      <div id="filter-controls" className="p-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="input-quick-search"
            type="text"
            placeholder="Quick search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-white rounded border border-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-400 text-slate-800"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-medium">Category:</span>
            <select
              id="select-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs px-1.5 py-0.5 focus:outline-none focus:border-emerald-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-medium">Status:</span>
            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs px-1.5 py-0.5 focus:outline-none focus:border-emerald-500"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st === "All" ? "All Statuses" : st}</option>
              ))}
            </select>
          </div>

          {/* Quick Counter */}
          <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
            Found: {filteredEvents.length}
          </span>
        </div>
      </div>

      {/* Main compact data table container */}
      <div id="events-table-wrapper" className="overflow-x-auto overflow-y-auto compact-scrollbar max-h-[480px]">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-1">
            <AlertCircle className="w-6 h-6 text-slate-300" />
            <p className="text-xs font-semibold">No events matching your search filters.</p>
            <p className="text-[10px] text-slate-400 font-mono">Try adjusting terms or import more records.</p>
          </div>
        ) : (
          <table id="diu-compact-table" className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-100/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 select-none">
                <th className="px-2 py-1 font-semibold">Event info</th>
                <th className="px-2 py-1 font-semibold hidden md:table-cell">Category</th>
                <th className="px-2 py-1 font-semibold hidden sm:table-cell">Organizer</th>
                <th className="px-2 py-1 font-semibold">Dates & Times</th>
                <th className="px-2 py-1 font-semibold text-center">Status</th>
                <th className="px-2 py-1 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-800 bg-white">
              {filteredEvents.map((e, index) => {
                const isSelected = selectedEvent && selectedEvent["Event Title"] === e["Event Title"];
                return (
                  <tr 
                    key={`${e["Event Title"] || "untitled"}-${index}`}
                    onClick={() => onSelectEvent(e)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                      isSelected ? "bg-emerald-50/40 border-l-2 border-emerald-500" : ""
                    }`}
                  >
                    {/* Event Info Column */}
                    <td className="px-2 py-1 min-w-[140px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 font-sans tracking-tight">
                          {e["Event Title"] || "Untitled Program"}
                        </span>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-2 py-1 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-slate-100 text-slate-600 px-1 py-0.5 rounded leading-none">
                        {e["Event Category"] || "General"}
                      </span>
                    </td>

                    {/* Organizer host Column */}
                    <td className="px-2 py-1 hidden sm:table-cell">
                      <span className="text-slate-500 font-medium truncate max-w-[110px] inline-block" title={e["Organizer"]}>
                        {e["Organizer"] || "DIU"}
                      </span>
                    </td>

                    {/* Dates Column */}
                    <td className="px-2 py-1">
                      <div className="flex flex-col text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 text-slate-700">
                          <span className="text-[8px] bg-slate-200 text-slate-600 px-0.5 rounded-xs font-semibold">START</span> {e["Start Time"] || "N/A"}
                        </span>
                        {e["End Time"] && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <span className="text-[8px] bg-slate-105 text-slate-400 px-0.5 rounded-xs font-semibold">END</span> {e["End Time"]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status badge Column */}
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-block text-[10px] font-bold border px-1.5 py-0.5 rounded-full uppercase scale-95 ${getStatusBadgeStyle(e["Event Status"])}`}>
                        {e["Event Status"] || "Upcoming"}
                      </span>
                    </td>

                    {/* Handcrafted action buttons */}
                    <td className="px-2 py-1 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          id={`btn-view-${index}`}
                          onClick={() => onSelectEvent(e)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          title="View Full details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-edit-${index}`}
                          onClick={() => onEditEvent(e)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                          title="Update Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-${index}`}
                          onClick={() => onDeleteEvent(e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sheet Source indicator - Humility and zero fluff */}
      <div id="sheet-indicator" className="bg-slate-50 p-2 text-[10px] text-slate-400 border-t border-slate-200 flex items-center justify-between">
        <span className="truncate">
          Connected Sheet GID: <code className="bg-slate-200 px-1 rounded text-slate-600 font-mono">1368831261</code>
        </span>
        <a 
          href="https://docs.google.com/spreadsheets/d/1N61w6rEi1f2x6RaZzTO3JHL7ffVbLppT9P8FekVqH30/edit?gid=1368831261" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 text-emerald-600 hover:underline font-semibold"
        >
          Open Sheet <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

    </div>
  );
}
