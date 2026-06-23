import React, { useState, useEffect } from "react";
import { DIUEvent } from "../types";
import { X, Save, AlertCircle, Sparkles } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DIUEvent, isEdit: boolean, originalTitle?: string) => Promise<void>;
  eventToEdit: DIUEvent | null;
}

const CATEGORIES = [
  "Workshop",
  "Seminar",
  "Hackathon",
  "Programming Contest",
  "Conference",
  "Cultural Program",
  "Career Fair",
  "Club Orientation",
  "Sports Meet",
  "Webinar"
];

const ORGANIZERS = [
  "DIU Computer Programming Club (CPC)",
  "DIU Software Engineering Club",
  "Department of CSE",
  "DIU Cultural Club",
  "DIU Sports Club",
  "Daffodil International University",
  "DIU Career Development Center (CDC)"
];

// Helper to convert arbitrary date string to YYYY-MM-DD for standard calendar inputs
function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  
  // 1. If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Try parsing DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or MM/DD/YYYY
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    let part1 = parts[0].trim();
    let part2 = parts[1].trim();
    let part3 = parts[2].trim();
    
    // Check if parts[2] is a 4-digit year, or if parts[0] is
    if (part3.length === 4) {
      const p1 = parseInt(part1, 10);
      const p2 = parseInt(part2, 10);
      
      let day = part1;
      let month = part2;
      let year = part3;

      if (!isNaN(p1) && !isNaN(p2)) {
        if (p1 > 12) {
          day = String(p1).padStart(2, "0");
          month = String(p2).padStart(2, "0");
        } else if (p2 > 12) {
          day = String(p2).padStart(2, "0");
          month = String(p1).padStart(2, "0");
        } else {
          // Default to MM-DD-YYYY or DD-MM-YYYY (let's assume month/day as in sheets standard)
          day = String(p2).padStart(2, "0");
          month = String(p1).padStart(2, "0");
        }
      }
      return `${year}-${month}-${day}`;
    } else if (part1.length === 4) {
      // YYYY/MM/DD or YYYY-MM-DD but month/day aren't padded
      const p2 = parseInt(part2, 10);
      const p3 = parseInt(part3, 10);
      if (!isNaN(p2) && !isNaN(p3)) {
        return `${part1}-${String(p2).padStart(2, "0")}-${String(p3).padStart(2, "0")}`;
      }
    }
  }

  // 3. Try standard JS Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

// Case-insensitive, space-insensitive, and symbol-insensitive utility to extract database fields safely
function getPropertyValueInsensitive(obj: any, targetKey: string): string {
  if (!obj) return "";
  
  // 1. Direct case-sensitive match
  if (obj[targetKey] !== undefined && obj[targetKey] !== null) {
    return String(obj[targetKey]).trim();
  }
  
  // 2. Exact match with trimmed keys
  for (const key of Object.keys(obj)) {
    if (key.trim() === targetKey.trim()) {
      return String(obj[key]).trim();
    }
  }

  // 3. Extremely robust alphanumeric normalization
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedTarget = normalize(targetKey);
  
  for (const key of Object.keys(obj)) {
    if (normalize(key) === normalizedTarget) {
      if (obj[key] !== undefined && obj[key] !== null) {
        return String(obj[key]).trim();
      }
    }
  }
  return "";
}

export function EventModal({ isOpen, onClose, onSave, eventToEdit }: EventModalProps) {
  const [formData, setFormData] = useState<DIUEvent>({
    "Event Title": "",
    "Description": "",
    "Objective": "",
    "Expected Outcome": "",
    "Event Category": "Seminar",
    "Organizer": "Department of CSE",
    "Start Time": "",
    "End Time": "",
    "Event Status": "Upcoming"
  });

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (eventToEdit) {
      const extractedTitle = getPropertyValueInsensitive(eventToEdit, "Event Title") || getPropertyValueInsensitive(eventToEdit, "Title") || "";
      const extractedDesc = getPropertyValueInsensitive(eventToEdit, "Description") || "";
      const extractedObjective = getPropertyValueInsensitive(eventToEdit, "Objective") || "";
      const extractedOutcome = getPropertyValueInsensitive(eventToEdit, "Expected Outcome") || "";
      const extractedCategory = getPropertyValueInsensitive(eventToEdit, "Event Category") || getPropertyValueInsensitive(eventToEdit, "Category") || "Seminar";
      const extractedOrganizer = getPropertyValueInsensitive(eventToEdit, "Organizer") || getPropertyValueInsensitive(eventToEdit, "Organizer Host Unit") || "Department of CSE";
      const extractedStart = getPropertyValueInsensitive(eventToEdit, "Start Time") || getPropertyValueInsensitive(eventToEdit, "Start Date") || "";
      const extractedEnd = getPropertyValueInsensitive(eventToEdit, "End Time") || getPropertyValueInsensitive(eventToEdit, "End Date") || "";
      const extractedStatus = getPropertyValueInsensitive(eventToEdit, "Event Status") || getPropertyValueInsensitive(eventToEdit, "Status") || "Upcoming";

      setFormData({
        "Event Title": extractedTitle,
        "Description": extractedDesc,
        "Objective": extractedObjective,
        "Expected Outcome": extractedOutcome,
        "Event Category": extractedCategory || "Seminar",
        "Organizer": extractedOrganizer || "Department of CSE",
        "Start Time": extractedStart,
        "End Time": extractedEnd,
        "Event Status": extractedStatus || "Upcoming"
      });
    } else {
      setFormData({
        "Event Title": "",
        "Description": "",
        "Objective": "",
        "Expected Outcome": "",
        "Event Category": "Seminar",
        "Organizer": "Department of CSE",
        "Start Time": "",
        "End Time": "",
        "Event Status": "Upcoming"
      });
    }
    setErrorText("");
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof DIUEvent, val: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData["Event Title"].trim()) {
      setErrorText("Event Title is required.");
      return;
    }
    setErrorText("");
    
    // Trigger parent save Handler (which immediately applies Optimistic State updates)
    onSave(
      formData, 
      !!eventToEdit, 
      eventToEdit ? eventToEdit["Event Title"] : undefined
    ).catch(err => {
      console.error("Background event sync failure:", err);
    });

    // Close the modal instantly
    onClose();
  };

  return (
    <div id="modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
      
      {/* Container - simple, compact scrollable card */}
      <div id="modal-card" className="bg-white rounded border border-slate-200 shadow-lg w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div id="modal-header" className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider">
              {eventToEdit ? "Edit Existing DIU Event" : "Create New DIU Educational Program"}
            </h3>
          </div>
          <button 
            id="btn-close-modal"
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body - Compact layout (decreased vertical paddings) */}
        <form id="modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto compact-scrollbar p-3 space-y-2.5 text-xs">
          
          {errorText && (
            <div id="form-error-panel" className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-medium">{errorText}</p>
            </div>
          )}

          {/* Row 1: Event Title (Column 1) */}
          <div className="flex flex-col">
            <label className="font-bold text-slate-700 mb-0.5">Event Title *</label>
            <input
              id="form-title"
              type="text"
              value={formData["Event Title"]}
              onChange={(e) => handleChange("Event Title", e.target.value)}
              placeholder="e.g. CSE Hackathon 2026"
              className="p-1.5 px-2.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white"
              required
              disabled={loading}
            />
          </div>

          {/* Row 2: Description (Column 2) */}
          <div className="flex flex-col">
            <label className="font-bold text-slate-700 mb-0.5">Description</label>
            <textarea
              id="form-desc"
              rows={2}
              value={formData["Description"]}
              onChange={(e) => handleChange("Description", e.target.value)}
              placeholder="Provide a comprehensive introduction to this university gathering..."
              className="p-1 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
              disabled={loading}
            />
          </div>

          {/* Row 3: Objective (Column 3) & Expected Outcome (Column 4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">Objective</label>
              <textarea
                id="form-obj"
                rows={2}
                value={formData["Objective"]}
                onChange={(e) => handleChange("Objective", e.target.value)}
                placeholder="What is the key goal/target?"
                className="p-1 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">Expected Outcome</label>
              <textarea
                id="form-outcome"
                rows={2}
                value={formData["Expected Outcome"]}
                onChange={(e) => handleChange("Expected Outcome", e.target.value)}
                placeholder="What will students learn or achieve?"
                className="p-1 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
                disabled={loading}
              />
            </div>
          </div>

          {/* Row 4: Event Category (Column 5) & Organizer Host Unit (Column 6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">Event Category</label>
              <select
                id="form-category"
                value={formData["Event Category"]}
                onChange={(e) => handleChange("Event Category", e.target.value)}
                className="p-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
                disabled={loading}
              >
                {(!CATEGORIES.includes(formData["Event Category"]) ? [...CATEGORIES, formData["Event Category"]].filter(Boolean) : CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">Organizer Host Unit</label>
              <input
                id="form-organizer"
                type="text"
                list="organizer-presets"
                value={formData["Organizer"]}
                onChange={(e) => handleChange("Organizer", e.target.value)}
                placeholder="e.g. Department of CSE"
                className="p-1.5 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
                disabled={loading}
              />
              <datalist id="organizer-presets">
                {ORGANIZERS.map(org => (
                  <option key={org} value={org} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 5: Start Time / Start Date (Column 7) & End Time / End Date (Column 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">Start Date</label>
              <input
                id="form-start-time"
                type="date"
                value={toInputDate(formData["Start Time"])}
                onChange={(e) => handleChange("Start Time", e.target.value)}
                className="p-1.5 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs cursor-pointer"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-slate-700 mb-0.5">End Date</label>
              <input
                id="form-end-time"
                type="date"
                value={toInputDate(formData["End Time"])}
                onChange={(e) => handleChange("End Time", e.target.value)}
                className="p-1.5 px-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs cursor-pointer"
                disabled={loading}
              />
            </div>
          </div>

          {/* Row 6: Event Status (Column 9) */}
          <div className="flex flex-col">
            <label className="font-bold text-slate-700 mb-0.5">Event Status</label>
            <select
              id="form-status"
              value={formData["Event Status"]}
              onChange={(e) => handleChange("Event Status", e.target.value)}
              className="p-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 bg-white text-xs"
              disabled={loading}
            >
              {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Footer Save and cancel triggers */}
          <div id="modal-footer" className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
            <button
              id="btn-form-cancel"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 font-semibold rounded text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              id="btn-form-save"
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 font-semibold text-white rounded hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
              disabled={loading}
            >
              <Save className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Writing to Sheets..." : (eventToEdit ? "Update Event" : "Create & Deploy")}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
