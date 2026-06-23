import React, { useState, useEffect } from "react";
import { DIURundownItem } from "../types";
import { X, Save, AlertCircle, Clock, Calendar, User, Activity } from "lucide-react";

interface RundownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DIURundownItem, isEdit: boolean, originalActivity?: string) => Promise<void>;
  rundownToEdit: DIURundownItem | null;
  currentEventTitle: string;
}

// Date formatter helpers
function toMMM_DD_YYYY(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return isoDateStr;
  const monthName = months[monthNum - 1];
  return `${monthName} ${day < 10 ? '0' + day : day}, ${year}`;
}

function toISO(formattedStr: string): string {
  if (!formattedStr) return "";
  const clean = formattedStr.replace(",", "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length !== 3) return "";
  const monthStr = parts[0].substring(0, 3).toLowerCase();
  const dayStr = parts[1];
  const yearStr = parts[2];
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIndex = months.indexOf(monthStr);
  if (monthIndex === -1) return "";
  const yNum = parseInt(yearStr, 10);
  const mNum = monthIndex + 1;
  const dNum = parseInt(dayStr, 10);
  if (isNaN(yNum) || isNaN(mNum) || isNaN(dNum)) return "";
  const mm = mNum < 10 ? `0${mNum}` : `${mNum}`;
  const dd = dNum < 10 ? `0${dNum}` : `${dNum}`;
  return `${yNum}-${mm}-${dd}`;
}

// Time range formatter helpers
function convert24hToAMPM(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return "";
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // first hour is 12
  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hoursStr}:${minutes} ${ampm}`;
}

function parseAMPMTo24h(ampmStr: string): string {
  if (!ampmStr) return "";
  const match = ampmStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours < 12) {
    hours += 12;
  }
  if (ampm === "AM" && hours === 12) {
    hours = 0;
  }
  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hoursStr}:${minutes}`;
}

export function RundownModal({ isOpen, onClose, onSave, rundownToEdit, currentEventTitle }: RundownModalProps) {
  const [formData, setFormData] = useState<DIURundownItem>({
    "Event Title": currentEventTitle,
    "Date": "",
    "Time": "",
    "Activity": "",
    "Key Personnel": "",
    "Status": "Pending"
  });

  const [isoDate, setIsoDate] = useState("");
  const [startTime24, setStartTime24] = useState("");
  const [endTime24, setEndTime24] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (rundownToEdit) {
      const rawDate = rundownToEdit["Date"] || "";
      const parsedIso = toISO(rawDate);
      setIsoDate(parsedIso);

      const timeStr = rundownToEdit["Time"] || "";
      const timeParts = timeStr.split(/\s*-\s*/);
      const start24 = timeParts[0] ? parseAMPMTo24h(timeParts[0]) : "";
      const end24 = timeParts[1] ? parseAMPMTo24h(timeParts[1]) : "";
      setStartTime24(start24);
      setEndTime24(end24);

      setFormData({
        "Event Title": rundownToEdit["Event Title"] || currentEventTitle,
        "Date": rawDate,
        "Time": timeStr,
        "Activity": rundownToEdit["Activity"] || "",
        "Key Personnel": rundownToEdit["Key Personnel"] || "",
        "Status": rundownToEdit["Status"] || "Pending"
      });
    } else {
      setIsoDate("");
      setStartTime24("");
      setEndTime24("");
      setFormData({
        "Event Title": currentEventTitle,
        "Date": "",
        "Time": "",
        "Activity": "",
        "Key Personnel": "",
        "Status": "Pending"
      });
    }
    setErrorText("");
  }, [rundownToEdit, currentEventTitle, isOpen]);

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    setIsoDate(newIso);
    const formatted = toMMM_DD_YYYY(newIso);
    setFormData(prev => ({ ...prev, "Date": formatted }));
  };

  const updateTimeRange = (start: string, end: string) => {
    const startFormatted = convert24hToAMPM(start);
    const endFormatted = convert24hToAMPM(end);
    let finalTimeRange = "";
    if (startFormatted && endFormatted) {
      finalTimeRange = `${startFormatted} - ${endFormatted}`;
    } else if (startFormatted) {
      finalTimeRange = startFormatted;
    } else if (endFormatted) {
      finalTimeRange = endFormatted;
    }
    setFormData(prev => ({ ...prev, "Time": finalTimeRange }));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartTime24(newStart);
    updateTimeRange(newStart, endTime24);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEndTime24(newEnd);
    updateTimeRange(startTime24, newEnd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData["Activity"].trim()) {
      setErrorText("Activity name/description refers to a necessary plan item.");
      return;
    }
    setErrorText("");
    
    const payload: DIURundownItem = {
      ...formData,
      "Event Title": currentEventTitle
    };

    // Trigger onSave on the parent (runs in background with optimistic state updates)
    onSave(payload, !!rundownToEdit, rundownToEdit?.["Activity"]).catch(err => {
      console.error("Background rundown sync failure:", err);
    });

    onClose();
  };

  return (
    <div id="rundown-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div 
        id="rundown-modal-panel" 
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                {rundownToEdit ? "Edit Rundown Segment" : "New Rundown Slot"}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                {currentEventTitle}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorText && (
            <div className="p-3 rounded bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-[11px] text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Activity Description */}
          <div className="space-y-1">
            <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Activity Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Activity className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData["Activity"]}
                onChange={(e) => setFormData({ ...formData, "Activity": e.target.value })}
                placeholder="e.g. Opening Remarks, Technical Presentation, Lunch"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Date Pick calendar - narrower at Col Span 5 */}
            <div className="space-y-1 sm:col-span-5">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                Select Date <span className="text-slate-400 font-normal">(Calendar)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={isoDate}
                  onChange={handleDateChange}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-805 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              {formData["Date"] && (
                <div className="text-[10px] text-emerald-600 font-bold font-mono pl-1">
                  Format: {formData["Date"]}
                </div>
              )}
            </div>

            {/* Time slot pickers - wider at Col Span 7 */}
            <div className="space-y-1 sm:col-span-7">
              <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                Time Range <span className="text-slate-400 font-normal">(Clock-Picker)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={startTime24}
                    onChange={handleStartTimeChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-1 py-2 text-xs text-slate-805 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    title="Start time selection"
                    required
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={endTime24}
                    onChange={handleEndTimeChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-8 pr-1 py-2 text-xs text-slate-805 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                    title="End time selection"
                    required
                  />
                </div>
              </div>
              {formData["Time"] && (
                <div className="text-[10px] text-emerald-600 font-bold font-mono pl-1 truncate">
                  {formData["Time"]}
                </div>
              )}
            </div>
          </div>

          {/* Key Personnel */}
          <div className="space-y-1">
            <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Key Personnel / Responsible Party
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData["Key Personnel"]}
                onChange={(e) => setFormData({ ...formData, "Key Personnel": e.target.value })}
                placeholder="e.g. Prof. Dr. Imran, Dr. Shehab"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
              Status Flag
            </label>
            <select
              value={formData["Status"]}
              onChange={(e) => setFormData({ ...formData, "Status": e.target.value })}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans cursor-pointer"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Saving..." : "Save Row"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
