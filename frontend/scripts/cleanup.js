// Cleanup script for Next.js development server
// This script kills any existing Node.js processes and removes lock files

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Cleaning up Next.js development environment...");

// Add error handling to ensure script completes
process.on("uncaughtException", (err) => {
  console.error("Cleanup error:", err.message);
  process.exit(0); // Exit successfully even on error
});

// Kill Node.js processes on ports 3000 and 3001
try {
  // Windows PowerShell command
  if (process.platform === "win32") {
    const pids = new Set();

    // Get processes on port 3000
    try {
      const port3000 = execSync(`netstat -ano | findstr :3000`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      const lines = port3000
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      });
    } catch (error) {
      // Port 3000 might not be in use
    }

    // Get processes on port 3001
    try {
      const port3001 = execSync(`netstat -ano | findstr :3001`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      const lines = port3001
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      });
    } catch (error) {
      // Port 3001 might not be in use
    }

    // Kill all found processes
    if (pids.size > 0) {
      pids.forEach((pid) => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`Killed process ${pid}`);
        } catch (error) {
          // Process might already be killed
        }
      });
    } else {
      console.log("No processes found on ports 3000 or 3001");
    }
  } else {
    // Linux/Mac
    try {
      execSync("lsof -ti:3000,3001 | xargs kill -9", { stdio: "ignore" });
      console.log("Killed processes on ports 3000 and 3001");
    } catch (error) {
      console.log("No processes found on ports 3000 or 3001");
    }
  }
} catch (error) {
  console.log("Cleanup process check completed");
}

// Remove lock file
const lockFile = path.join(".next", "dev", "lock");
try {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log("Removed lock file");
  } else {
    console.log("No lock file found");
  }
} catch (error) {
  console.log("Lock file cleanup skipped");
}

console.log("Cleanup complete!");

// Ensure script exits successfully
process.exit(0);
