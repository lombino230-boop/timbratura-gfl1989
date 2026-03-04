import express from "express";

import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "geoclock-secret-key-123";
const db = new Database("geoclock.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'employee')) DEFAULT 'employee'
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    radius_meters INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    in_lat REAL,
    in_lon REAL,
    out_time DATETIME,
    out_lat REAL,
    out_lon REAL,
    location_id INTEGER,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('holiday', 'sick', 'permit')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

console.log("Database initialized successfully");

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
    "Amministratore",
    "admin@geoclock.it",
    hash,
    "admin"
  );

  // Seed a test employee
  const empHash = bcrypt.hashSync("user123", 10);
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
    "Mario Rossi",
    "mario@geoclock.it",
    empHash,
    "employee"
  );

  // Seed a test location (Rome Colosseum area)
  db.prepare("INSERT INTO locations (name, lat, lon, radius_meters) VALUES (?, ?, ?, ?)").run(
    "Sede Centrale",
    41.8902,
    12.4922,
    500
  );
}

const app = express();
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.warn(`Unauthorized access attempt to ${req.url}`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    console.error(`Invalid token for ${req.url}`);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Distance Helper (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

// API Routes
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`>>> LOGIN ATTEMPT: ${email}`);

  if (!email || !password) {
    console.error("Login attempt with missing email or password");
    return res.status(400).json({ error: "Email e password richiesti" });
  }

  try {
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      console.warn(`User not found: ${email}`);
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      console.warn(`Password mismatch for: ${email}`);
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    console.log(`Login successful for: ${user.name} (${user.role})`);
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Login error in DB:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
});


// Ensure columns exist (Migration)
try {
  db.exec("ALTER TABLE work_sessions ADD COLUMN notes TEXT");
} catch (e) { /* column already exists */ }

app.post("/api/clock-in", authenticate, (req: any, res) => {
  try {
    const { lat, lon, notes } = req.body;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: "Coordinate non valide" });
    }

    const openSession = db.prepare("SELECT * FROM work_sessions WHERE user_id = ? AND out_time IS NULL").get(req.user.id);
    if (openSession) return res.status(400).json({ error: "Hai già una sessione aperta" });

    const locations: any[] = db.prepare("SELECT * FROM locations").all();
    let nearestLocation = null;
    for (const loc of locations) {
      const dist = getDistance(lat, lon, loc.lat, loc.lon);
      if (dist <= loc.radius_meters) {
        nearestLocation = loc;
        break;
      }
    }

    db.prepare("INSERT INTO work_sessions (user_id, in_lat, in_lon, location_id, notes) VALUES (?, ?, ?, ?, ?)").run(
      req.user.id, lat, lon, nearestLocation?.id || null, notes || null
    );
    res.json({ success: true, message: "Entrata registrata correttamente" });
  } catch (error) {
    console.error("Clock-in error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

app.post("/api/clock-out", authenticate, (req: any, res) => {
  try {
    const { lat, lon, notes } = req.body;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: "Coordinate non valide" });
    }

    const openSession: any = db.prepare("SELECT * FROM work_sessions WHERE user_id = ? AND out_time IS NULL").get(req.user.id);
    if (!openSession) return res.status(400).json({ error: "Nessuna sessione aperta da chiudere" });

    // Update notes if provided at clock-out, or keep existing
    const finalNotes = notes ? (openSession.notes ? `${openSession.notes}\n---\n${notes}` : notes) : openSession.notes;

    db.prepare("UPDATE work_sessions SET out_time = CURRENT_TIMESTAMP, out_lat = ?, out_lon = ?, notes = ? WHERE id = ?").run(
      lat, lon, finalNotes, openSession.id
    );
    res.json({ success: true, message: "Uscita registrata correttamente" });
  } catch (error) {
    console.error("Clock-out error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

app.get("/api/history", authenticate, (req: any, res) => {
  const history = db.prepare(`
    SELECT ws.*, l.name as location_name 
    FROM work_sessions ws 
    LEFT JOIN locations l ON ws.location_id = l.id 
    WHERE ws.user_id = ? 
    ORDER BY ws.in_time DESC
  `).all(req.user.id);
  res.json(history);
});

// Holiday Routes
app.get("/api/holidays", authenticate, (req: any, res) => {
  const holidays = db.prepare("SELECT * FROM holidays WHERE user_id = ? ORDER BY start_date DESC").all(req.user.id);
  res.json(holidays);
});

app.post("/api/holidays", authenticate, (req: any, res) => {
  const { type, start_date, end_date, notes } = req.body;
  db.prepare("INSERT INTO holidays (user_id, type, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id, type, start_date, end_date, notes
  );
  res.json({ success: true, message: "Richiesta inviata" });
});

app.get("/api/admin/holidays", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const holidays = db.prepare(`
    SELECT h.*, u.name as user_name 
    FROM holidays h 
    JOIN users u ON h.user_id = u.id 
    ORDER BY h.start_date DESC
  `).all();
  res.json(holidays);
});

app.post("/api/admin/holidays/status", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { id, status } = req.body;
  db.prepare("UPDATE holidays SET status = ? WHERE id = ?").run(status, id);
  res.json({ success: true });
});


// Admin Routes
app.get("/api/admin/records", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const records = db.prepare(`
    SELECT ws.*, u.name as user_name, l.name as location_name 
    FROM work_sessions ws 
    JOIN users u ON ws.user_id = u.id 
    LEFT JOIN locations l ON ws.location_id = l.id 
    ORDER BY ws.in_time DESC
  `).all();
  res.json(records);
});

app.get("/api/admin/users", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const users = db.prepare("SELECT id, name, email, role FROM users").all();
  res.json(users);
});

app.get("/api/admin/locations", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const locations = db.prepare("SELECT * FROM locations").all();
  res.json(locations);
});

app.post("/api/admin/users", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  const { name, email, password, role } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      name, email, hash, role
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Email già esistente" });
  }
});

app.post("/api/admin/locations", authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
  try {
    const { name, lat, lon, radius_meters } = req.body;
    if (!name || typeof lat !== 'number' || typeof lon !== 'number' || typeof radius_meters !== 'number') {
      return res.status(400).json({ error: "Dati sede non validi" });
    }
    db.prepare("INSERT INTO locations (name, lat, lon, radius_meters) VALUES (?, ?, ?, ?)").run(
      name, lat, lon, radius_meters
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Admin locations error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

app.get("/api/download-project", (req, res) => {
  try {
    const zip = new AdmZip();
    const rootPath = __dirname;

    // Add files to zip, excluding node_modules, dist, .git, and the database
    const filesToInclude = [
      "src",
      "public",
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "server.ts",
      "README.md",
      "index.html",
      ".env.example",
      "metadata.json",
      "dist"
    ];

    filesToInclude.forEach(file => {
      const fullPath = path.join(rootPath, file);
      // Check if file exists before adding
      try {
        const stats = path.resolve(fullPath);
        if (path.extname(file) === "" && !file.includes(".")) {
          // It's likely a directory
          zip.addLocalFolder(fullPath, file);
        } else {
          // It's a file
          zip.addLocalFile(fullPath);
        }
      } catch (e) {
        console.warn(`Could not add ${file} to zip:`, e);
      }
    });

    const zipBuffer = zip.toBuffer();

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="geoclock-project.zip"',
      "Content-Length": zipBuffer.length
    });

    res.send(zipBuffer);
  } catch (error) {
    console.error("Download project error:", error);
    res.status(500).json({ error: "Errore durante la creazione dello ZIP" });
  }
});

// Serve static files
app.use(express.static(path.resolve(__dirname)));

app.get("*", (req, res) => {
  if (req.url.startsWith('/api')) {
    console.warn(`[404] API route not found: ${req.url}`);
    return res.status(404).json({ error: "API non trovata" });
  }
  console.log(`Serving index.html for: ${req.url}`);
  res.sendFile(path.join(path.resolve(__dirname), "index.html"));
});


app.listen(3000, "0.0.0.0", () => {
  console.log("Server GeoClock attivo su http://localhost:3000");
});

