import React from "react";
import { DIUEvent } from "../types";
import { 
  X, 
  Calendar, 
  Building, 
  Target, 
  Lightbulb, 
  Award
} from "lucide-react";

interface DetailPanelProps {
  event: DIUEvent | null;
  onClose: () => void;
  showSheetInDetails?: boolean;
}

export function DetailPanel({ event, onClose, showSheetInDetails = false }: DetailPanelProps) {
  const activeEvent = event || (showSheetInDetails ? {
    "Event Title": "DIU Events Main Spreadsheet",
    "Description": "This is the active Google Sheet used for real-time synchronization, scheduling, and events management database.",
    "Objective": "To synchronize, manage and track all university events effortlessly inside a centralized collaborative spreadsheet.",
    "Expected Outcome": "Clean real-time workflow across students, faculty and guests.",
    "Event Category": "Google Sheet Database",
    "Organizer": "Daffodil International University",
    "Start Time": "Ongoing",
    "End Time": "",
    "Event Status": "Connected"
  } as DIUEvent : null);

  if (!activeEvent) {
    return (
      <div id="detail-fallback" className="bento-card border-dashed p-4 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[165px]">
        <Award className="w-7 h-7 text-slate-300 mb-1.5" />
        <span className="text-xs font-semibold text-slate-600">No Event Selected</span>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5">Click any row in the Event table to show details.</span>
      </div>
    );
  }

  return (
    <div id="detail-panel" className="bento-card flex flex-col overflow-hidden max-h-[580px] select-none text-sans">
      
      {/* Sleek Light Header Banner with Multi-Meta info - Clean & Compact Layout */}
      <div id="detail-header-container" className="bg-gradient-to-br from-emerald-50/50 via-slate-50/70 to-white p-4 sm:p-5 w-full shrink-0 relative border-b border-slate-200">
        {/* Absolute header buttons */}
        <button 
          id="btn-close-detail-panel"
          onClick={onClose}
          className="absolute top-3 right-3 p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-full transition-all z-10 hover:text-slate-900 shadow-3xs hover:scale-105"
          title="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col select-none pr-6">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="inline-block bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded leading-none uppercase tracking-wider">
              {activeEvent["Event Category"] || "Program"}
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider leading-none ${
              activeEvent["Event Status"] === "Ongoing" ? "bg-amber-100 text-amber-800 animate-pulse" :
              activeEvent["Event Status"] === "Completed" ? "bg-emerald-100 text-emerald-800" :
              activeEvent["Event Status"] === "Cancelled" ? "bg-rose-100 text-rose-800" :
              "bg-slate-100 text-slate-700"
            }`}>
              {activeEvent["Event Status"] || "Upcoming"}
            </span>
          </div>
          
          <h4 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-tight font-sans mb-3.5" title={activeEvent["Event Title"]}>
            {activeEvent["Event Title"]}
          </h4>

          {/* Quick Info details row */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60 text-slate-500 text-[10.5px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider w-16">Organizer:</span>
              <span className="font-semibold text-slate-700">{activeEvent["Organizer"] || "DIU"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider w-16">Start:</span>
              <span className="font-semibold text-slate-700 font-mono">{activeEvent["Start Time"] || "N/A"}</span>
            </div>
            {activeEvent["End Time"] && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider w-16">End Time:</span>
                <span className="font-semibold text-slate-600 font-mono">{activeEvent["End Time"]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Sheet Direct Iframe - Positioned directly under cover photo banner. Hides metadata/details entirely. */}
      {showSheetInDetails ? (
        <div id="detail-sheet-iframe-container" className="flex-1 w-full bg-slate-900 shrink-0 relative border-b border-slate-200 shadow-inner min-h-[380px] flex flex-col animate-fadeIn">
          <div className="bg-slate-800 text-[10px] text-slate-300 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block"></span>
              Live Editable Spreadsheet Mode
            </span>
            <a 
              href="https://docs.google.com/spreadsheets/d/1N61w6rEi1f2x6RaZzTO3JHL7ffVbLppT9P8FekVqH30/edit?gid=1368831261" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-400 hover:underline font-mono text-[9px]"
            >
              Open in new tab ↗
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
        /* Main compact details container - low padding */
        <div id="detail-details-scroller" className="flex-1 overflow-y-auto compact-scrollbar p-3 space-y-3 text-xs bg-slate-50/50 animate-fadeIn">
          
          {/* Core Host Unit & Status */}
          <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-slate-100 shadow-3xs">
            <div className="flex items-start gap-1.5 min-w-0">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Organizer</span>
                <span className="font-semibold text-slate-700 truncate text-[11px] leading-tight" title={activeEvent["Organizer"]}>
                  {activeEvent["Organizer"] || "DIU"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Status Badge</span>
                <span className="font-semibold text-slate-700 text-[11px] leading-tight select-none">
                  {activeEvent["Event Status"] || "Upcoming"}
                </span>
              </div>
            </div>
          </div>

          {/* Timelines block */}
          <div className="bg-white p-2 rounded border border-slate-100 space-y-1 shadow-3xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Start Date:</span>
              <span className="font-mono text-[10px] text-slate-700 font-semibold">{activeEvent["Start Time"] || "N/A"}</span>
            </div>
            {activeEvent["End Time"] && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">End Date:</span>
                <span className="font-mono text-[10px] text-slate-600">{activeEvent["End Time"]}</span>
              </div>
            )}
          </div>

          {/* Description section */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block font-mono">Description</span>
            <div className="bg-white p-2.5 rounded border border-slate-100 text-slate-700 leading-relaxed text-[11px] text-justify font-light select-text">
              {activeEvent["Description"] || <span className="text-slate-400 italic">No description provided.</span>}
            </div>
          </div>

          {/* Objectives / Outcomes */}
          {activeEvent["Objective"] && (
            <div className="space-y-1 bg-teal-50/45 p-2 rounded border border-teal-100">
              <div className="flex items-center gap-1 font-bold text-teal-800 text-[10px]">
                <Target className="w-3.5 h-3.5 text-teal-600" />
                <span>KEY OBJECTIVE</span>
              </div>
              <p className="text-[11px] text-teal-900 leading-tight select-text pl-4.5 font-light">
                {activeEvent["Objective"]}
              </p>
            </div>
          )}

          {activeEvent["Expected Outcome"] && (
            <div className="space-y-1 bg-blue-50/45 p-2 rounded border border-blue-100">
              <div className="flex items-center gap-1 font-bold text-blue-800 text-[10px]">
                <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                <span>EXPECTED OUTCOMES</span>
              </div>
              <p className="text-[11px] text-blue-900 leading-tight select-text pl-4.5 font-light">
                {activeEvent["Expected Outcome"]}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
