import React, { useState, useEffect, useRef } from "react";
import { DIUEvent, DIURundownItem } from "../types";
import { 
  Edit2, 
  X, 
  Plus, 
  Clock, 
  RefreshCw,
  Check,
  CheckSquare,
  Square,
  Trash2,
  GripVertical,
  Calendar
} from "lucide-react";

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

interface RundownViewProps {
  activeFullEvent: DIUEvent;
  selectedEvent: DIUEvent | null;
  isRundownsSyncing: boolean;
  rundowns: DIURundownItem[];
  onAddRundownClick: () => void;
  onEditRundownClick: (item: DIURundownItem) => void;
  onDeleteRundownClick: (item: DIURundownItem) => void;
  onSaveRundown: (formData: DIURundownItem, isEdit: boolean, originalActivity?: string) => Promise<void>;
}

export function RundownView({
  activeFullEvent,
  selectedEvent,
  isRundownsSyncing,
  rundowns,
  onAddRundownClick,
  onEditRundownClick,
  onDeleteRundownClick,
  onSaveRundown
}: RundownViewProps) {
  const rawEventRundowns = rundowns.filter(
    r => r && r["Event Title"] && r["Event Title"].trim().toLowerCase() === activeFullEvent["Event Title"]?.trim().toLowerCase()
  );

  // Parse helper for sorting dates
  const parseRundownDate = (dateStr: string): Date => {
    const trimmed = (dateStr || "").trim();
    if (!trimmed) return new Date(8640000000000000); // Put items without dates at the end

    let d = null;
    let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    } else {
      match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (match) {
        d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
      } else {
        match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
        }
      }
    }
    if (!d || isNaN(d.getTime())) {
      d = new Date(trimmed);
    }
    if (isNaN(d.getTime())) {
      return new Date(8640000000000000); // Invalid dates at the end
    }
    return d;
  };

  // Parse helper for sorting times (minutes from midnight)
  const parseRundownTime = (timeStr: string): number => {
    const trimmed = (timeStr || "").trim();
    if (!trimmed) return 9999; // Put items without times at the end
    
    const startPart = trimmed.split("-")[0].trim().toLowerCase();
    const match = startPart.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const pm = match[3];
      if (pm === "pm" && hours < 12) {
        hours += 12;
      } else if (pm === "am" && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    }
    
    const hourMatch = startPart.match(/(\d{1,2})\s*(am|pm)/);
    if (hourMatch) {
      let hours = parseInt(hourMatch[1], 10);
      const pm = hourMatch[2];
      if (pm === "pm" && hours < 12) {
        hours += 12;
      } else if (pm === "am" && hours === 12) {
        hours = 0;
      }
      return hours * 60;
    }

    return 9999; // Put unrecognized time formats at the end
  };

  // Chronologically sorted list of rundown items
  const eventRundowns = [...rawEventRundowns].sort((a, b) => {
    const d1 = parseRundownDate(a["Date"]);
    const d2 = parseRundownDate(b["Date"]);
    const dateDiff = d1.getTime() - d2.getTime();
    if (dateDiff !== 0) return dateDiff;
    
    return parseRundownTime(a["Time"]) - parseRundownTime(b["Time"]);
  });

  // Group by date, keeping them in sorted insertion order
  const groupedRundowns = eventRundowns.reduce((acc, curr) => {
    const date = curr["Date"] || "No Date";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, DIURundownItem[]>);

  // Sort grouped dates chronologically
  const sortedDates = Object.keys(groupedRundowns).sort((a, b) => {
    return parseRundownDate(a).getTime() - parseRundownDate(b).getTime();
  });

  const [selectedRundownActivity, setSelectedRundownActivity] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Operation Queue
  const operationQueue = useRef<Promise<void>>(Promise.resolve());

  const enqueueOperation = (operation: () => Promise<void>) => {
    setIsSaving(true);
    operationQueue.current = operationQueue.current
      .then(async () => {
        await operation();
      })
      .catch(e => console.error("Op failed", e))
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    if (eventRundowns.length > 0) {
      const stillExists = eventRundowns.some(r => r["Activity"] === selectedRundownActivity);
      if (!stillExists || !selectedRundownActivity) {
        setSelectedRundownActivity(eventRundowns[0]["Activity"]);
      }
    } else {
      setSelectedRundownActivity(null);
    }
  }, [activeFullEvent, rundowns, selectedRundownActivity]);

  const selectedRundown = eventRundowns.find(r => r["Activity"] === selectedRundownActivity) || eventRundowns[0] || null;
  const currentToDos = parseToDos(selectedRundown?.["To-Do"]);

  const saveToDosForCurrentRundown = async (updatedList: ToDoItem[]) => {
    if (!selectedRundown) return;
    const updatedRundown: DIURundownItem = {
      ...selectedRundown,
      "To-Do": serializeToDos(updatedList)
    };
    await onSaveRundown(updatedRundown, true, selectedRundown["Activity"]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setHoveredIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null);
      setHoveredIndex(null);
      return;
    }

    const updated = [...currentToDos];
    const [movedItem] = updated.splice(draggingIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setDraggingIndex(null);
    setHoveredIndex(null);

    enqueueOperation(() => saveToDosForCurrentRundown(updated));
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || !selectedRundown) return;
    const newTodo: ToDoItem = {
      id: "todo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: newTodoText.trim(),
      done: false
    };
    const updated = [...currentToDos, newTodo];
    setNewTodoText("");
    enqueueOperation(() => saveToDosForCurrentRundown(updated));
  };

  const handleToggleTodo = async (todoId: string) => {
    const updated = currentToDos.map(t => t.id === todoId ? { ...t, done: !t.done } : t);
    enqueueOperation(() => saveToDosForCurrentRundown(updated));
  };

  const handleStartEditTodo = (todo: ToDoItem) => {
    setEditingTodoId(todo.id);
    setEditingTodoText(todo.text);
  };

  const handleSaveEditTodo = async (todoId: string) => {
    if (!editingTodoText.trim()) return;
    const updated = currentToDos.map(t => t.id === todoId ? { ...t, text: editingTodoText.trim() } : t);
    setEditingTodoId(null);
    setEditingTodoText("");
    enqueueOperation(() => saveToDosForCurrentRundown(updated));
  };

  const handleDeleteTodo = async (todoId: string) => {
    const updated = currentToDos.filter(t => t.id !== todoId);
    enqueueOperation(() => saveToDosForCurrentRundown(updated));
  };

  return (
    /* Dynamic Stack layout with live event timeline directly structured without tabs */
    <div className="flex-1 overflow-y-auto compact-scrollbar p-3.5 space-y-3.5">
      {/* Event Live Timeline - Rundown directly embedded below Details specifications */}
      <div className="space-y-3 font-sans select-text">
        {/* Header bar within tab */}
        <div className="flex items-center justify-between border-b border-slate-150 pb-2 select-none">
          <div className="flex flex-col">
            <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-widest font-sans flex items-center gap-1.5">
              Event Live Timeline
            </span>
            <p className="text-[10px] text-slate-400">Direct real-time synchronized rundown table read/write with Google Sheets. Click a row to configure task checklists.</p>
          </div>
        </div>

        {isRundownsSyncing && eventRundowns.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-[10px] flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            Fetching Rundown rows...
          </div>
        ) : eventRundowns.length === 0 ? (
          <div className="p-8 text-center select-none bg-slate-50 border border-dashed border-slate-200 rounded-lg max-w-sm mx-auto space-y-2">
            <Clock className="w-6 h-6 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700">Empty Rundown list</h4>
              <p className="text-[10px] text-slate-400 font-light">No rundown plans or sequences are declared for this event yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* Left Column: Live Timeline Table */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col relative">
              <div className="overflow-both overflow-x-auto overflow-y-auto compact-scrollbar max-h-[calc(100vh-230px)] min-h-[400px] border border-slate-200 rounded-lg bg-white shadow-3xs relative pb-14">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-500 select-none">
                      <th className="sticky top-0 bg-slate-100 px-2 py-2 w-[15%] z-20 shadow-[0_1.5px_0_0_rgba(226,232,240,1)] border-b border-slate-200">Time & Date</th>
                      <th className="sticky top-0 bg-slate-100 px-2 py-2 w-[75%] z-20 shadow-[0_1.5px_0_0_rgba(226,232,240,1)] border-b border-slate-200">Activity Plan Details</th>
                      <th className="sticky top-0 bg-slate-100 px-2 py-2 w-[10%] text-center z-20 shadow-[0_1.5px_0_0_rgba(226,232,240,1)] border-b border-slate-200">Status</th>
                      {selectedEvent && <th className="sticky top-0 bg-slate-100 px-2 py-2 w-[10%] text-center z-20 shadow-[0_1.5px_0_0_rgba(226,232,240,1)] border-b border-slate-200">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-705 font-sans">
                    {sortedDates.map((date) => (
                      <React.Fragment key={date}>
                        {/* Date Header Row */}
                        <tr className="bg-slate-100 select-none">
                            <td colSpan={selectedEvent ? 4 : 3} className="px-3 py-2 font-bold text-[11px] text-emerald-800 uppercase tracking-wider">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  {(() => {
                                    const trimmed = date.trim();
                                    let d = null;
                                    let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                    if (match) {
                                      d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
                                    } else {
                                      match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                                      if (match) {
                                        d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
                                      } else {
                                        match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                                        if (match) {
                                          d = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
                                        }
                                      }
                                    }
                                    if (!d || isNaN(d.getTime())) {
                                      d = new Date(trimmed);
                                    }
                                    if (isNaN(d.getTime())) return date;
                                    
                                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                    
                                    const monthStr = months[d.getMonth()];
                                    const dayStr = String(d.getDate()).padStart(2, "0");
                                    const yearStr = d.getFullYear();
                                    const weekdayStr = weekdays[d.getDay()];
                                    
                                    return `${monthStr} ${dayStr}, ${yearStr} (${weekdayStr})`;
                                  })()}
                                </span>
                              </div>
                            </td>
                        </tr>
                        {groupedRundowns[date].map((item, index) => {
                          const itemStatus = item["Status"] || "Pending";
                          const isDone = itemStatus.trim().toLowerCase() === "done";
                          const isInProgress = itemStatus.trim().toLowerCase() === "in progress" || itemStatus.trim().toLowerCase() === "ongoing";
                          const isRowSelected = selectedRundownActivity?.trim().toLowerCase() === item["Activity"]?.trim().toLowerCase();
                          
                          // Completion percentage
                          const todoList = parseToDos(item["To-Do"]);
                          const doneTodos = todoList.filter(t => t.done).length;
                          const completionPercentage = todoList.length > 0 ? Math.round((doneTodos / todoList.length) * 100) : 0;
                          
                          return (
                            <tr 
                              key={`${date}-${index}`} 
                              onClick={() => setSelectedRundownActivity(item["Activity"])}
                              className={`transition-all divide-x divide-slate-100 cursor-pointer ${
                                isRowSelected 
                                  ? "bg-emerald-50/20 font-medium border-l-2 border-l-emerald-500" 
                                  : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="px-2 py-1.5 font-mono text-center">
                                {item["Time"] ? (
                                  <div className="font-semibold text-slate-600 text-[12px] leading-tight flex flex-col gap-0.5">
                                    {item["Time"].split("-").map((t, i) => (
                                      <div key={i}>{t.trim()}</div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">No time</span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 leading-relaxed font-sans text-slate-800">
                                <div className="font-semibold text-[11.5px] break-words">{item["Activity"]}</div>
                              </td>
                              <td className="px-2 py-1.5 text-center select-none">
                                <div className="text-[12px] font-bold text-slate-700 tracking-tight">
                                  {completionPercentage}%
                                </div>
                              </td>
                              {selectedEvent && (
                                <td className="px-2 py-1.5 text-center select-none" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => onEditRundownClick(item)}
                                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Edit Slot"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteRundownClick(item)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete Slot"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={onAddRundownClick}
                  className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-[11px] px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-1.5 transition-all cursor-pointer z-30 border border-emerald-400/25"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            {/* Right Column: To-Do Checklist */}
            <div className="lg:col-span-5 xl:col-span-4 bg-slate-50/55 rounded-lg border border-slate-200 p-3.5 space-y-3.5">
              <div className="border-b border-slate-200 pb-2 select-none">
                <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">
                  Active Row Checklist
                </span>
                <p className="text-[12px] font-bold text-slate-800 leading-snug break-words">
                  {selectedRundown ? selectedRundown["Activity"] : "Select a rundown row"}
                </p>
                {selectedRundown?.["Key Personnel"] && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-1 truncate">
                    Lead: {selectedRundown["Key Personnel"]}
                  </p>
                )}
                {selectedRundown && (
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-1 leading-none">
                    <span>{selectedRundown["Time"] || "No specified schedule"}</span>
                    {selectedRundown["Date"] && <span>• {selectedRundown["Date"]}</span>}
                  </div>
                )}
              </div>

              {selectedRundown ? (
                <div className="space-y-3.5">
                  <form onSubmit={handleAddTodo} className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      placeholder="Add slot task checklist..."
                      className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-920 text-white text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>

                  {/* Loading status bar */}
                  <div className="h-0.5 w-full bg-slate-100 relative overflow-hidden rounded-full">
                    {isSaving && <div className="absolute top-0 left-0 h-full bg-emerald-500 animate-loading-bar" />}
                  </div>

                  {/* Checklist items list */}
                  {currentToDos.length === 0 ? (
                    <div className="py-7 text-center text-slate-400 text-[10px] select-none bg-white rounded border border-dashed border-slate-200/80 p-4">
                      No checkbox to-do tasks declared for this activity slot yet. Build some above!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[calc(100vh-320px)] min-h-[320px] overflow-y-auto compact-scrollbar pr-0.5 select-text">
                      {currentToDos.map((todo, index) => {
                        const isEditing = editingTodoId === todo.id;
                        const isDragged = draggingIndex === index;
                        const isHovered = hoveredIndex === index;
                        return (
                          <div
                            key={todo.id}
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`flex items-start justify-between gap-1.5 p-2 bg-white rounded border transition-all ${
                              isDragged ? "opacity-30 border-dashed border-emerald-300 scale-95" :
                              isHovered ? "border-emerald-300 bg-emerald-50/70 translate-y-0.5" :
                              todo.done ? "border-emerald-100 bg-emerald-50/10 shadow-3xs" : 
                              "border-slate-100 animate-in fade-in-20 duration-100"
                            }`}
                          >
                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 shrink-0 mt-1" />
                              <button
                                type="button"
                                onClick={() => handleToggleTodo(todo.id)}
                                className="text-slate-400 hover:text-emerald-600 mt-0.5 cursor-pointer shrink-0 transition-colors"
                                title={todo.done ? "Mark undone" : "Mark done"}
                              >
                                {todo.done ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 " />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </button>

                              {isEditing ? (
                                <div className="flex-1 flex gap-1 items-center">
                                  <input
                                    type="text"
                                    value={editingTodoText}
                                    onChange={(e) => setEditingTodoText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEditTodo(todo.id);
                                      if (e.key === "Escape") setEditingTodoId(null);
                                    }}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditTodo(todo.id)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="Save task"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`text-[11px] leading-tight select-text break-words pr-1 flex-1 cursor-text ${
                                    todo.done ? "line-through text-slate-400 font-light" : "text-slate-700 font-normal"
                                  }`}
                                  onClick={() => handleStartEditTodo(todo)}
                                  title="Click to edit task text"
                                >
                                  {todo.text}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0">
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTodo(todo)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                  title="Edit text"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-[10px] select-none">
                  Please construct activities in the timeline table to start cataloging checklists.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
