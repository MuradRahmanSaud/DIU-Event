export interface DIUEvent {
  "Event Title": string;
  "Description": string;
  "Objective": string;
  "Expected Outcome": string;
  "Event Category": string;
  "Organizer": string;
  "Start Time": string;
  "End Time": string;
  "Event Status": "Upcoming" | "Ongoing" | "Completed" | "Cancelled" | string;
}

export type ActiveTab = "dashboard" | "eventList" | "eventDetails";

export interface DIURundownItem {
  "Event Title": string;
  "Date": string;
  "Time": string;
  "Activity": string;
  "Key Personnel": string;
  "Status": "Pending" | "Done" | "In Progress" | string;
  "To-Do"?: string;
}
