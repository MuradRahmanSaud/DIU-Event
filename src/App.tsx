import React, { useState, useEffect } from "react";
import { DIUEvent, ActiveTab, DIURundownItem } from "./types";
import { Sidebar } from "./components/Sidebar";
import { StatsGrid } from "./components/StatsGrid";
import { CompactTable } from "./components/CompactTable";
import { DetailPanel } from "./components/DetailPanel";
import { EventModal } from "./components/EventModal";
import { RundownModal } from "./components/RundownModal";
import { FullEventDetailsView } from "./components/FullEventDetailsView";
import { getFriendlyImageUrl } from "./utils";
import { 
  Calendar, 
  CheckCircle, 
  X, 
  Plus,
  AlertCircle
} from "lucide-react";

export default function App() {
  const [events, setEvents] = useState<DIUEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DIUEvent | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("eventDetails");
  const [showSheetInDetails, setShowSheetInDetails] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"connected" | "syncing" | "error">("syncing");
  const [showModal, setShowModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<DIUEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<DIUEvent | null>(null);
  const [rundownToDelete, setRundownToDelete] = useState<DIURundownItem | null>(null);
  const [detailsInnerTab, setDetailsInnerTab] = useState<"details" | "rundown">("details");
  const [rundowns, setRundowns] = useState<DIURundownItem[]>([]);
  const [isRundownsSyncing, setIsRundownsSyncing] = useState(false);
  const [showRundownModal, setShowRundownModal] = useState(false);
  const [rundownToEdit, setRundownToEdit] = useState<DIURundownItem | null>(null);
  
  const activeFullEvent = selectedEvent || (showSheetInDetails ? {
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
  
  // Visual alerts
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Auto-fetch spreadsheet on mount
  useEffect(() => {
    fetchEvents();
    fetchRundowns();
  }, []);

  // Ensure first event is selected initially
  useEffect(() => {
    if (events && events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0]);
    }
  }, [events, selectedEvent]);

  // Reset editing mode when switching events
  useEffect(() => {
  }, [selectedEvent]);

  const triggerAlert = (type: "success" | "error" | "info", text: string) => {
    setAlertMessage({ type, text });
    // Automatically auto-dismiss after 5 seconds to keep design extremely clean
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
  };

  const fetchEvents = async () => {
    setSyncStatus("syncing");
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error(`Server returned error code ${response.status}`);
      }
      const json = await response.json();
      if (json.status === "success") {
        setEvents(json.data);
        setSyncStatus("connected");
        // Auto-select first event if none selected
        if (json.data && json.data.length > 0 && !selectedEvent) {
          setSelectedEvent(json.data[0]);
        }
      } else {
        throw new Error(json.message || "Failed to parse Google Sheets records");
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      triggerAlert("error", `Could not synchronize data with Sheets: ${err.message || err}`);
    }
  };

  const fetchRundowns = async () => {
    setIsRundownsSyncing(true);
    try {
      const response = await fetch("/api/rundowns");
      if (!response.ok) {
        throw new Error(`Server returned error code ${response.status}`);
      }
      const json = await response.json();
      if (json.status === "success") {
        setRundowns(json.data);
      } else {
        throw new Error(json.message || "Failed to parse Google Sheets rundown records");
      }
    } catch (err: any) {
      console.error(err);
      triggerAlert("error", `Could not synchronize rundown with Sheets: ${err.message || err}`);
    } finally {
      setIsRundownsSyncing(false);
    }
  };

  const handleSaveRundown = async (formData: DIURundownItem, isEdit: boolean, originalActivity?: string) => {
    // Keep backup to rollback on failure
    const backupRundowns = [...rundowns];

    // Instantly apply optimistic UI state update
    if (isEdit && originalActivity) {
      setRundowns(prev => prev.map(item => {
        if (
          item["Event Title"]?.trim().toLowerCase() === formData["Event Title"]?.trim().toLowerCase() &&
          item["Activity"]?.trim().toLowerCase() === originalActivity?.trim().toLowerCase()
        ) {
          return formData;
        }
        return item;
      }));
    } else {
      setRundowns(prev => [formData, ...prev]);
    }

    try {
      const url = isEdit ? "/api/rundowns/update" : "/api/rundowns/add";
      const body = isEdit
        ? { originalActivity, eventTitle: formData["Event Title"], data: formData }
        : { data: formData };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Server returned error code ${response.status}`);
      }

      const json = await response.json();
      if (json.status !== "success") {
        throw new Error(json.message || "Failed to commit record to Google Sheets");
      }

      fetchRundowns();
    } catch (err: any) {
      console.error(err);
      // rollback
      setRundowns(backupRundowns);
      triggerAlert("error", `Could not save rundown: ${err.message || err}`);
      throw err;
    }
  };

  const handleDeleteRundown = (item: DIURundownItem) => {
    setRundownToDelete(item);
  };

  const executeRundownDeletion = async (item: DIURundownItem) => {
    const backupRundowns = [...rundowns];
    setRundowns(prev => prev.filter(x => !(
      x["Event Title"]?.trim().toLowerCase() === item["Event Title"]?.trim().toLowerCase() &&
      x["Activity"]?.trim().toLowerCase() === item["Activity"]?.trim().toLowerCase()
    )));

    try {
      const response = await fetch("/api/rundowns/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: item["Activity"],
          eventTitle: item["Event Title"]
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error code ${response.status}`);
      }

      const json = await response.json();
      if (json.status !== "success") {
        throw new Error(json.message || "Failed to remove item from Google Sheets");
      }

      fetchRundowns();
    } catch (err: any) {
      console.error(err);
      setRundowns(backupRundowns);
      triggerAlert("error", `Could not delete rundown: ${err.message || err}`);
    }
  };

  // Add / Edit Trigger with lightning fast Optimistic UI Updates
  const handleSaveEvent = async (formData: DIUEvent, isEdit: boolean, originalTitle?: string) => {
    // Keep backups to roll back if the network request fails
    const originalEvents = [...events];
    const prevSelectedEvent = selectedEvent;

    // Immediately update local UI state optimistically
    if (isEdit && originalTitle) {
      setEvents(prev => prev.map(e => e["Event Title"] === originalTitle ? formData : e));
      if (selectedEvent && selectedEvent["Event Title"] === originalTitle) {
        setSelectedEvent(formData);
      }
    } else {
      setEvents(prev => [formData, ...prev]);
      setSelectedEvent(formData);
    }

    setSyncStatus("syncing");

    try {
      let endpoint = "/api/events/add";
      let payload: any = { data: formData };

      if (isEdit && originalTitle) {
        endpoint = "/api/events/update";
        payload = { originalTitle, data: formData };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Operation failed. Status code ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.status === "success" || resJson.message?.includes("successfully")) {
        if (!isEdit) {
          triggerAlert("success", "Event created successfully!");
        }
        setSyncStatus("connected");

        // Quietly refresh the list in the background to ensure absolute sync with backend order
        try {
          const syncRes = await fetch("/api/events");
          if (syncRes.ok) {
            const syncJson = await syncRes.json();
            if (syncJson.status === "success") {
              setEvents(syncJson.data);
            }
          }
        } catch (silentErr) {
          console.warn("Silent background fetch failed, preserving fast local changes:", silentErr);
        }
      } else {
        throw new Error(resJson.message || "Spreadsheet write rejected by Google service");
      }
    } catch (err: any) {
      console.error(err);
      // Revert state due to failure
      setEvents(originalEvents);
      setSelectedEvent(prevSelectedEvent);
      setSyncStatus("error");
      triggerAlert("error", `Failed updating spreadsheet: ${err.message || err}. Local state rolled back.`);
      throw err;
    }
  };

  // Trigger Delete Confirmation dialog
  const handleDeleteEvent = (event: DIUEvent) => {
    setEventToDelete(event);
  };

  // Real Delete Execution with lightning fast Optimistic UI Updates
  const executeEventDeletion = async (event: DIUEvent) => {
    const titleToDelete = event["Event Title"];
    if (!titleToDelete) return;

    // Keep backups to roll back if the network request fails
    const originalEvents = [...events];
    const prevSelectedEvent = selectedEvent;

    // Immediately remove from UI list state optimistically
    setEvents(prev => prev.filter(e => e["Event Title"] !== titleToDelete));
    if (selectedEvent && selectedEvent["Event Title"] === titleToDelete) {
      setSelectedEvent(null);
    }

    setSyncStatus("syncing");
    try {
      const response = await fetch("/api/events/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventTitle: titleToDelete })
      });

      if (!response.ok) {
        throw new Error(`Delete failed. Server response code ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.status === "success" || resJson.message?.includes("successfully")) {
        triggerAlert("success", "Event deleted successfully!");
        setSyncStatus("connected");

        // Quietly refresh the list in the background to ensure absolute sync with backend order
        try {
          const syncRes = await fetch("/api/events");
          if (syncRes.ok) {
            const syncJson = await syncRes.json();
            if (syncJson.status === "success") {
              setEvents(syncJson.data);
            }
          }
        } catch (silentErr) {
          console.warn("Silent background fetch failed, preserving fast local changes:", silentErr);
        }
      } else {
        throw new Error(resJson.message || "Spreadsheet deletion rejected by Google Apps Script");
      }
    } catch (err: any) {
      console.error(err);
      // Revert state due to failure
      setEvents(originalEvents);
      setSelectedEvent(prevSelectedEvent);
      setSyncStatus("error");
      triggerAlert("error", `Deletion failed: ${err.message || err}. Local state rolled back.`);
    }
  };

  const handleEditClick = (event: DIUEvent) => {
    setEventToEdit(event);
    setShowModal(true);
  };

  const handleAddNewClick = () => {
    setEventToEdit(null);
    setShowModal(true);
  };

  return (
    <div id="full-app-shell" className="min-h-screen flex text-slate-800 bg-slate-50 font-sans antialiased overflow-hidden">
      
      {/* Sidebar - strict styling */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        syncStatus={syncStatus}
        onSync={fetchEvents}
        onAddNewClick={handleAddNewClick}
        showSheetInDetails={showSheetInDetails}
        onToggleSheetInDetails={() => setShowSheetInDetails(prev => !prev)}
      />

      {/* Main Workspace Frame */}
      <main id="main-workspace" className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Workspace body - compact scrollable content */}
        <div 
          id="workspace-scroller" 
          className={`flex-1 overflow-y-auto compact-scrollbar ${
            activeTab === "eventDetails" ? "p-0" : "p-4 space-y-4"
          }`}
        >
          
          {/* Global Event Trigger Alert notifications Banner */}
          {alertMessage && (
            <div 
              id="global-alert"
              className={`p-2 text-xs border rounded flex items-center justify-between shadow-3xs transition-all ${
                activeTab === "eventDetails" ? "m-4" : ""
              } ${
                alertMessage.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : alertMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {alertMessage.type === "success" ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span className="font-medium">{alertMessage.text}</span>
              </div>
              <button 
                id="btn-dismiss-alert"
                onClick={() => setAlertMessage(null)} 
                className="hover:opacity-80 p-0.5 text-slate-500 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Tab Routing View */}
          {activeTab === "dashboard" ? (
            <StatsGrid 
              events={events} 
              onTabChange={setActiveTab}
            />
          ) : activeTab === "eventDetails" ? (
            activeFullEvent ? (
              <FullEventDetailsView
                activeFullEvent={activeFullEvent}
                selectedEvent={selectedEvent}
                showSheetInDetails={showSheetInDetails}
                detailsInnerTab={detailsInnerTab}
                setDetailsInnerTab={setDetailsInnerTab}
                isRundownsSyncing={isRundownsSyncing}
                rundowns={rundowns}
                handleEditClick={handleEditClick}
                handleDeleteEvent={handleDeleteEvent}
                onAddRundownClick={() => {
                  setRundownToEdit(null);
                  setShowRundownModal(true);
                }}
                onEditRundownClick={(item) => {
                  setRundownToEdit(item);
                  setShowRundownModal(true);
                }}
                onDeleteRundownClick={handleDeleteRundown}
                onSaveRundown={handleSaveRundown}
              />
            ) : (
              <div id="no-event-selected" className="bg-white rounded border border-dashed border-slate-205 p-8 text-center text-slate-400 flex flex-col items-center justify-center h-44 select-none max-w-sm mx-auto mt-8">
                <Calendar className="w-8 h-8 text-slate-300 mb-1.5" />
                <span className="text-xs font-semibold text-slate-600">No Event Selected</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Select an event from the sidebar list to inspect details.
                </span>
              </div>
            )
          ) : (
            /* Compact twin panels: Left Table (7/12 area), Right Detail (5/12 area) */
            <div id="twin-viewport" className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              
              {/* Event Table (Left 7 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-2">
                <div className="flex items-center justify-between select-none">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-700">Events Registry Data</h3>
                    <p className="text-[10px] text-slate-400">Low-padding, high density grid optimized for swift browsing.</p>
                  </div>
                  <button
                    id="btn-table-add-new"
                    onClick={handleAddNewClick}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] px-2 py-1 rounded flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                </div>

                <CompactTable 
                  events={events}
                  onSelectEvent={setSelectedEvent}
                  onEditEvent={handleEditClick}
                  onDeleteEvent={handleDeleteEvent}
                  selectedEvent={selectedEvent}
                />
              </div>

              {/* Detail Panel Previewer (Right 4 Columns) */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                <div className="flex flex-col select-none">
                  <h3 className="text-xs font-bold text-slate-700">Detailed Inspector</h3>
                  <p className="text-[10px] text-slate-400">All 11 spreadsheet columns rendered dynamically.</p>
                </div>

                <DetailPanel 
                  event={selectedEvent}
                  onClose={() => setSelectedEvent(null)}
                  showSheetInDetails={showSheetInDetails}
                />
              </div>

            </div>
          )}

        </div>

        {/* Compact Footer */}
        <footer id="app-fine-footer" className="bg-white border-t border-slate-200 px-3.5 py-1 text-[10px] text-slate-400 flex items-center justify-between select-none shrink-0 font-light">
          <span>
            DIU Event Management Hub © 2026 • Realtime Google Sheet Synchronization API
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px]">
            {syncStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                ● ACTIVE CONNECTION
              </span>
            ) : syncStatus === 'syncing' ? (
              <span className="text-amber-500 animate-pulse">
                ● SYNCING DATABASE...
              </span>
            ) : (
              <span className="text-rose-500">
                ● OFFLINE WARNING
              </span>
            )}
          </span>
        </footer>

      </main>

      {/* Insert or Update Modal Dialog Box container */}
      <EventModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
      />

      {/* Rundown row Creation or Revision Modal container */}
      <RundownModal
        isOpen={showRundownModal}
        onClose={() => {
          setShowRundownModal(false);
          setRundownToEdit(null);
        }}
        onSave={handleSaveRundown}
        rundownToEdit={rundownToEdit}
        currentEventTitle={selectedEvent ? selectedEvent["Event Title"] : ""}
      />

      {/* Custom Delete Confirmation Modal */}
      {eventToDelete && (
        <div id="delete-confirmation-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div id="delete-confirmation-card" className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-display">
                  Confirm Deletion
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                  Are you sure you want to permanently delete event <span className="font-semibold text-slate-700">"{eventToDelete["Event Title"]}"</span> from Google Sheets? This action is irreversible.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 text-[11px] font-sans pt-1">
              <button
                id="btn-confirm-delete-cancel"
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors font-semibold"
              >
                No, Keep It
              </button>
              <button
                id="btn-confirm-delete-apply"
                type="button"
                onClick={() => {
                  executeEventDeletion(eventToDelete);
                  setEventToDelete(null);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded shadow-xs transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Rundown Row Delete Confirmation Modal */}
      {rundownToDelete && (
        <div id="rundown-delete-confirmation-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div id="rundown-delete-confirmation-card" className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 font-display">
                  Remove Slot Row
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                  Are you sure you want to remove rundown item <span className="font-semibold text-slate-700">"{rundownToDelete["Activity"]}"</span> from this schedule? This will pull it directly from the live spreadsheet records.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 text-[11px] font-sans pt-1">
              <button
                id="btn-confirm-rundown-delete-cancel"
                type="button"
                onClick={() => setRundownToDelete(null)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-rundown-delete-apply"
                type="button"
                onClick={() => {
                  executeRundownDeletion(rundownToDelete);
                  setRundownToDelete(null);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded shadow-xs transition-colors"
              >
                Delete Slot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
