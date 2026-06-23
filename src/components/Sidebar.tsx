import React, { useState } from "react";
import { 
  Calendar, 
  Grid, 
  ListChecks, 
  RefreshCw, 
  Plus, 
  FolderHeart,
  Database,
  Search,
  X,
  Users,
  FileSpreadsheet
} from "lucide-react";
import { ActiveTab, DIUEvent } from "../types";

// Helper function to format arbitrary Date strings into MMM DD, YYYY format
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  
  // 1. Try parsing YYYY-MM-DD
  let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }

  // 2. Try parsing DD-MM-YYYY
  match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }

  // 3. Try parsing DD/MM/YYYY
  match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const dateObj = new Date(year, month, day);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }

  // 4. Fallback to standard JS Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return dateStr;
}

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  events: DIUEvent[];
  selectedEvent: DIUEvent | null;
  onSelectEvent: (event: DIUEvent) => void;
  syncStatus: "connected" | "syncing" | "error";
  onSync: () => void;
  onAddNewClick: () => void;
  showSheetInDetails?: boolean;
  onToggleSheetInDetails?: () => void;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  events,
  selectedEvent,
  onSelectEvent,
  syncStatus, 
  onSync,
  onAddNewClick,
  showSheetInDetails = false,
  onToggleSheetInDetails
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter events based on search query
  const filteredEvents = events.filter((e) => {
    const title = e["Event Title"] || "";
    const category = e["Event Category"] || "";
    const organizer = e["Organizer"] || "";
    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      organizer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <aside id="sidebar-container" className="w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 h-screen select-none">
      {/* Header / Brand */}
      <div id="sidebar-logo-area" className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center text-slate-950 font-bold font-display text-sm">
            D
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold font-display tracking-tight text-white leading-tight">
              DIU Events
            </span>
            <span className="text-[9px] text-emerald-400 font-mono tracking-wider">
              MANAGEMENT HUB
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Compact margins/paddings */}
      <nav id="sidebar-nav" className="flex-1 px-2 py-3 space-y-1 overflow-y-auto compact-scrollbar">
        <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 px-2.5 mb-2">
          General
        </div>
        
        <button
          id="btn-nav-dashboard"
          onClick={() => setActiveTab("dashboard")}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded transition-colors mb-3 ${
            activeTab === "dashboard"
              ? "bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500 font-semibold"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          <Grid className="w-4 h-4 shrink-0" />
          Dashboard Overview
        </button>

        <div className="pt-2 text-[9px] uppercase font-bold tracking-widest text-slate-500 px-2.5 mb-2">
          University Events
        </div>

        {/* Search Bar */}
        <div className="px-1 mb-2">
          <div className="relative flex items-center bg-slate-950 px-2 py-1 rounded border border-slate-800 shadow-3xs hover:border-slate-700 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-slate-200 outline-none pl-1.5 pr-0.5 focus:ring-0 placeholder-slate-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="hover:text-amber-400 text-slate-500 cursor-pointer pl-1"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 px-1 pb-4">
          {filteredEvents.length === 0 ? (
            <div className="text-[10px] text-slate-500 px-2.5 py-1.5 italic">
              {searchQuery ? "No matching events" : "No events found"}
            </div>
          ) : (
            filteredEvents.map((e, index) => {
              const isSelected = selectedEvent && selectedEvent["Event Title"] === e["Event Title"];
              const isActive = isSelected && activeTab === "eventDetails";
              
              // Map state into a visual color indicator
              let statusDotColor = "bg-sky-450";
              const statusText = e["Event Status"] || "Upcoming";
              if (e["Event Status"] === "Ongoing") statusDotColor = "bg-amber-400 animate-pulse";
              else if (e["Event Status"] === "Completed") statusDotColor = "bg-emerald-400";
              else if (e["Event Status"] === "Cancelled") statusDotColor = "bg-rose-450";

              return (
                <button
                  key={`${e["Event Title"] || "event"}-${index}`}
                  onClick={() => {
                    onSelectEvent(e);
                    setActiveTab("eventDetails");
                  }}
                  className={`w-full text-left flex flex-col gap-1.5 p-2.5 rounded transition-all border text-xs cursor-pointer ${
                    isActive
                      ? "bg-slate-800/90 border-slate-700/50 text-emerald-400 font-medium shadow-xs"
                      : "text-slate-400 hover:bg-slate-850 hover:text-slate-200 border-transparent"
                  }`}
                  title={e["Event Title"]}
                >
                  {/* Category + Status */}
                  <div className="flex items-center justify-between gap-2 w-full select-none">
                    <span className={`text-[9px] uppercase font-extrabold tracking-wider font-mono truncate ${isActive ? 'text-emerald-400/90 font-black' : 'text-slate-500'}`}>
                      {e["Event Category"] || "Program"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-800/60">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300">{statusText}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className={`font-bold text-[11px] leading-tight line-clamp-2 pr-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {e["Event Title"] || "Untitled Event"}
                  </h4>

                  {/* Dates right under title in MMM DD, YYYY format */}
                  {(e["Start Time"] || e["End Time"]) && (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9.5px] font-medium text-slate-400 font-mono mt-0.5">
                      {e["Start Time"] && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{formatDisplayDate(e["Start Time"])}</span>
                        </span>
                      )}
                      {e["End Time"] && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="shrink-0">{formatDisplayDate(e["End Time"])}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Sponsor/Organizer metadata */}
                  {e["Organizer"] && (
                    <div className="flex items-center gap-1.5 pt-1 mt-0.5 border-t border-slate-800/35 text-[8.5px] text-slate-500 font-mono w-full shrink-0 min-w-0">
                      <Users className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      <span className="truncate uppercase font-bold text-slate-400">{e["Organizer"]}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

      </nav>

      {/* Connection Service Status Area - Humility and zero fluff */}
      <div id="sidebar-footer-area" className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2">
        <button
          id="btn-sidebar-add-new"
          onClick={onAddNewClick}
          className="flex-1 flex items-center justify-center gap-2 px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Create Event
        </button>

        <button 
          id="btn-sync-refresh"
          onClick={onSync} 
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors flex items-center justify-center border border-slate-750 cursor-pointer shadow-xs"
          title="Refresh Data from Google Sheets"
        >
          <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        <button 
          id="btn-toggle-sheet-details"
          onClick={onToggleSheetInDetails} 
          className={`p-1.5 rounded transition-all flex items-center justify-center border cursor-pointer shadow-xs ${
            showSheetInDetails 
              ? 'bg-emerald-600 border-emerald-500 text-white font-bold' 
              : 'bg-slate-800 border-slate-750 text-slate-300 hover:bg-slate-700 hover:text-emerald-400'
          }`}
          title={showSheetInDetails ? "Hide Google Sheet Frame" : "Show Google Sheet Frame under Cover"}
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
