import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const SPREADSHEET_ID = "1N61w6rEi1f2x6RaZzTO3JHL7ffVbLppT9P8FekVqH30";
const GID = "1368831261";
const GAS_URL = "https://script.google.com/macros/s/AKfycbwYHjpYpCjJGwhYiQXPcLFLaQ2D_oI7TuAxunLjFx6iH8__wOMthCkM4eAYs6uUjLE-lw/exec";

// CSV custom parser (high-performance & standard-compliant) to avoid extra dependencies or offset mismatches
function parseCSV(csvText: string): any[] {
  const result: any[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  
  // Normalize line endings to LF only
  const normalizedText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText[i];
    const nextChar = normalizedText[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote inside quotes
        currentField += '"';
        i++; // Skip the next quote character
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentLine.push(currentField);
      currentField = "";
    } else if (char === '\n' && !insideQuotes) {
      currentLine.push(currentField);
      result.push(currentLine);
      currentLine = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  
  // Push remaining field and line if any
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    result.push(currentLine);
  }
  
  if (result.length === 0) return [];
  
  const headers = result[0].map((h: string) => h.trim().replace(/^\uFEFF/, ""));
  const dataRows = result.slice(1);
  
  return dataRows.map(rowFields => {
    const obj: any = {};
    headers.forEach((h, index) => {
      let val = rowFields[index] !== undefined ? rowFields[index].trim() : "";
      obj[h] = val;
    });
    return obj;
  }).filter(row => Object.values(row).some(val => val !== ""));
}

// 1. GET Events list from Google Sheets (cached or dynamic)
app.get("/api/events", async (req, res) => {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}&t=${Date.now()}`;
    const response = await fetch(csvUrl, {
      headers: {
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet. Status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const dataObj = parseCSV(csvText);
    res.json({ status: "success", data: dataObj });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Helper function to send requests to Google Apps Script Web App
async function executeGASAction(payload: any) {
  const response = await fetch(GAS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // GAS doPost receives JSON inside e.postData.contents of text/plain
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gas Action failed with server status ${response.status}`);
  }

  const result = await response.json();
  return result;
}

// 2. ADD Event (Row Append)
app.post("/api/events/add", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data["Event Title"]) {
      return res.status(400).json({ status: "error", message: "Event Title is required" });
    }
    
    const payload = {
      action: "ADD",
      gid: GID,
      spreadsheetId: SPREADSHEET_ID,
      data: data
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error adding event:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Helper to resolve exact sheet title matching the trimmed input title (to mitigate trailing/leading space mismatches in the Spreadsheet)
async function findExactSheetTitle(searchTitle: string): Promise<string> {
  const target = searchTitle.trim().toLowerCase();
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}&t=${Date.now()}`;
    const response = await fetch(csvUrl, {
      headers: {
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return searchTitle;
    const csvText = await response.text();
    
    // Split into CSV lines safely
    const lines = csvText.split(/\r?\n/);
    if (lines.length <= 1) return searchTitle;
    
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(field);
          field = "";
        } else {
          field += char;
        }
      }
      result.push(field);
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ""));
    const titleIndex = headers.indexOf("Event Title");
    if (titleIndex === -1) return searchTitle;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const fields = parseCSVLine(line);
      const rawVal = fields[titleIndex];
      if (rawVal !== undefined) {
        let cleanVal = rawVal;
        if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
          cleanVal = cleanVal.substring(1, cleanVal.length - 1);
        }
        if (cleanVal.trim().toLowerCase() === target) {
          return cleanVal; // Exact string with trailing/leading spaces preserved
        }
      }
    }
  } catch (error) {
    console.error("Error resolving exact title from sheet:", error);
  }
  return searchTitle;
}

// 3. UPDATE Event (Row Edit)
app.post("/api/events/update", async (req, res) => {
  try {
    const { originalTitle, data } = req.body;
    if (!originalTitle) {
      return res.status(400).json({ status: "error", message: "originalTitle is required to update a record" });
    }

    const exactTitle = await findExactSheetTitle(originalTitle);

    const payload = {
      action: "UPDATE",
      gid: GID,
      spreadsheetId: SPREADSHEET_ID,
      idKey: "Event Title",
      idValue: exactTitle,
      data: data
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error updating event:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 4. DELETE Event (Row Delete)
app.post("/api/events/delete", async (req, res) => {
  try {
    const { eventTitle } = req.body;
    if (!eventTitle) {
      return res.status(400).json({ status: "error", message: "eventTitle is required to delete a record" });
    }

    const exactTitle = await findExactSheetTitle(eventTitle);

    const payload = {
      action: "DELETE",
      gid: GID,
      spreadsheetId: SPREADSHEET_ID,
      idKey: "Event Title",
      idValue: exactTitle,
      data: {}
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error deleting event:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

const RUNDOWN_GID = "1191914832";

// Helper to resolve exact rundown activity matching in spreadsheets GID 1191914832
async function findExactRundownActivity(searchActivity: string, eventTitle: string): Promise<string> {
  const targetAct = searchActivity.trim().toLowerCase();
  const targetEv = eventTitle.trim().toLowerCase();
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${RUNDOWN_GID}&t=${Date.now()}`;
    const response = await fetch(csvUrl, {
      headers: {
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return searchActivity;
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    for (const row of rows) {
      const actVal = row["Activity"] || "";
      const evVal = row["Event Title"] || "";
      if (actVal.trim().toLowerCase() === targetAct && evVal.trim().toLowerCase() === targetEv) {
        return actVal;
      }
    }
  } catch (error) {
    console.error("Error resolving exact rundown activity from sheet:", error);
  }
  return searchActivity;
}

// 1. GET Rundowns
app.get("/api/rundowns", async (req, res) => {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${RUNDOWN_GID}&t=${Date.now()}`;
    const response = await fetch(csvUrl, {
      headers: {
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rundown spreadsheet. Status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const dataObj = parseCSV(csvText);
    res.json({ status: "success", data: dataObj });
  } catch (error: any) {
    console.error("Error fetching rundowns:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2. ADD Rundown Row
app.post("/api/rundowns/add", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data["Event Title"] || !data["Activity"]) {
      return res.status(400).json({ status: "error", message: "Event Title and Activity are required" });
    }
    
    const payload = {
      action: "ADD",
      gid: RUNDOWN_GID,
      spreadsheetId: SPREADSHEET_ID,
      data: data
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error adding rundown:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. UPDATE Rundown Row
app.post("/api/rundowns/update", async (req, res) => {
  try {
    const { originalActivity, eventTitle, data } = req.body;
    if (!originalActivity) {
      return res.status(400).json({ status: "error", message: "originalActivity is required to update a rundown row" });
    }

    const exactActivity = await findExactRundownActivity(originalActivity, eventTitle || "");

    const payload = {
      action: "UPDATE",
      gid: RUNDOWN_GID,
      spreadsheetId: SPREADSHEET_ID,
      idKey: "Activity",
      idValue: exactActivity,
      data: data
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error updating rundown:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 4. DELETE Rundown Row
app.post("/api/rundowns/delete", async (req, res) => {
  try {
    const { activity, eventTitle } = req.body;
    if (!activity) {
      return res.status(400).json({ status: "error", message: "activity is required to delete a rundown row" });
    }

    const exactActivity = await findExactRundownActivity(activity, eventTitle || "");

    const payload = {
      action: "DELETE",
      gid: RUNDOWN_GID,
      spreadsheetId: SPREADSHEET_ID,
      idKey: "Activity",
      idValue: exactActivity,
      data: {}
    };

    const gasRes = await executeGASAction(payload);
    res.json(gasRes);
  } catch (error: any) {
    console.error("Error deleting rundown:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Vite Middleware for integration dev-server or serving production built SPA assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
