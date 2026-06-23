import React from "react";
import { DIUEvent, DIURundownItem } from "../types";
import { 
  Calendar, 
  Edit2, 
  X, 
  Plus, 
  Clock, 
  RefreshCw,
  Building,
  Check,
  CheckSquare,
  Square,
  Trash2,
  GripVertical
} from "lucide-react";
import { RundownView } from "./RundownView";

interface ToDoItem {
  id: string;
  text: string;
  done: boolean;
}

function parseToDos(todoStr?: string): ToDoItem[] {
  if (!todoStr) return [];
  try {
    const parsed = JSON.parse(todoStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    if (todoStr.trim()) {
      return todoStr.split(";").filter(val => val.trim()).map((val, idx) => ({
        id: `legacy-${idx}`,
        text: val.trim(),
        done: false
      }));
    }
  }
  return [];
}

function serializeToDos(list: ToDoItem[]): string {
  return JSON.stringify(list);
}

interface FullEventDetailsViewProps {
  activeFullEvent: DIUEvent;
  selectedEvent: DIUEvent | null;
  showSheetInDetails: boolean;
  detailsInnerTab: "details" | "rundown";
  setDetailsInnerTab: (val: "details" | "rundown") => void;
  isRundownsSyncing: boolean;
  rundowns: DIURundownItem[];
  handleEditClick: (event: DIUEvent) => void;
  handleDeleteEvent: (event: DIUEvent) => void;
  onAddRundownClick: () => void;
  onEditRundownClick: (item: DIURundownItem) => void;
  onDeleteRundownClick: (item: DIURundownItem) => void;
  onSaveRundown: (formData: DIURundownItem, isEdit: boolean, originalActivity?: string) => Promise<void>;
}

export function FullEventDetailsView({
  activeFullEvent,
  selectedEvent,
  showSheetInDetails,
  detailsInnerTab,
  setDetailsInnerTab,
  isRundownsSyncing,
  rundowns,
  handleEditClick,
  handleDeleteEvent,
  onAddRundownClick,
  onEditRundownClick,
  onDeleteRundownClick,
  onSaveRundown
}: FullEventDetailsViewProps) {
  return (
    <div id="event-details-full-view" className="bg-white rounded-lg border-0 shadow-none overflow-hidden flex flex-col w-full divide-y divide-slate-100 min-h-full">
      {/* Sleek Program Header Banner with absolute hover-reveal action triggers */}
      <div id="event-details-header-banner" className="relative group bg-gradient-to-br from-emerald-50/50 via-slate-50/70 to-white px-4 py-4 sm:px-5 sm:py-5 shrink-0 flex flex-col justify-end border-b-0 select-none">
        
        {/* Modern Absolute Top-Right corner action buttons - Reveals automatically on hover */}
        {selectedEvent && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 z-10">
            <button
              id="btn-details-edit"
              onClick={() => handleEditClick(selectedEvent)}
              className="bg-white border border-slate-201 hover:bg-slate-50 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded transition-all shadow-3xs cursor-pointer hover:scale-105"
            >
              Edit Specification
            </button>
            <button
              id="btn-details-delete"
              onClick={() => handleDeleteEvent(selectedEvent)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[10px] px-2.5 py-1.5 rounded transition-all cursor-pointer hover:scale-105"
            >
              Delete Event
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider leading-none">
            {activeFullEvent["Event Category"] || "Program"}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider leading-none ${
            activeFullEvent["Event Status"] === "Ongoing" ? "bg-amber-100 text-amber-800 animate-pulse" :
            activeFullEvent["Event Status"] === "Completed" ? "bg-emerald-100 text-emerald-800" :
            activeFullEvent["Event Status"] === "Cancelled" ? "bg-rose-100 text-rose-800" :
            "bg-slate-100 text-slate-700"
          }`}>
            {activeFullEvent["Event Status"] || "Upcoming"}
          </span>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight font-sans mb-4 pr-32" title={activeFullEvent["Event Title"]}>
          {activeFullEvent["Event Title"]}
        </h2>

        {/* Modern Info Grid inside the header strip */}
        <div className="flex flex-wrap gap-y-2 gap-x-5 pt-3 border-t border-slate-200/70 text-slate-600 text-xs font-sans">
          {/* Organizer Info item */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-white border border-slate-100 text-slate-500 shadow-3xs">
              <Building className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div>
              <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Organizer</span>
              <span className="text-[11px] font-semibold text-slate-705 leading-none">{activeFullEvent["Organizer"] || "DIU"}</span>
            </div>
          </div>

          {/* Start Date item */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-white border border-slate-100 text-emerald-600 shadow-3xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Start Date</span>
              <span className="text-[11px] font-semibold text-slate-705 leading-none font-mono">{activeFullEvent["Start Time"] || "N/A"}</span>
            </div>
          </div>

          {/* End Date item (conditional) */}
          {activeFullEvent["End Time"] && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-white border border-slate-100 text-blue-500 shadow-3xs">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">End Date</span>
                <span className="text-[11px] font-semibold text-slate-705 leading-none font-mono">{activeFullEvent["End Time"]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Sheet Direct Iframe - Positioned directly under cover photo banner as requested */}
      {showSheetInDetails ? (
        <div id="full-details-sheet-iframe-container" className="w-full flex-1 min-h-[580px] bg-slate-900 shrink-0 relative border-b border-slate-200 shadow-inner flex flex-col">
          <div className="bg-slate-800 text-[10.5px] text-slate-300 px-5 py-2 flex items-center justify-between border-b border-slate-700 select-none font-sans">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping inline-block"></span>
              Spreadsheet Database Real-time Integration: Live Edit Mode
            </span>
            <a 
              href="https://docs.google.com/spreadsheets/d/1N61w6rEi1f2x6RaZzTO3JHL7ffVbLppT9P8FekVqH30/edit?gid=1368831261" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 hover:underline font-mono text-[10px]"
            >
              Open original Sheet link ↗
            </a>
          </div>
          <iframe 
            src="https://docs.google.com/spreadsheets/d/1N61w6rEi1f2x6RaZzTO3JHL7ffVbLppT9P8FekVqH30/edit?rm=minimal"
            className="w-full flex-1 border-0 select-text bg-white"
            title="Google Sheets Database"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          />
        </div>
       ) : (
        <RundownView
          activeFullEvent={activeFullEvent}
          selectedEvent={selectedEvent}
          isRundownsSyncing={isRundownsSyncing}
          rundowns={rundowns}
          onAddRundownClick={onAddRundownClick}
          onEditRundownClick={onEditRundownClick}
          onDeleteRundownClick={onDeleteRundownClick}
          onSaveRundown={onSaveRundown}
        />
      )}
    </div>
  );
}
