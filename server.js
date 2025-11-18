// server.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // parse JSON bodies

// Helper: sanitize incoming URL (basic check)
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

// POST /run   body: { "url": "https://example.com" }
app.post('/run', async (req, res) => {
  const targetUrl = req.body.url;

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  // Build a unique output folder – timestamp + random part
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, 'browsertime-results', `${timestamp}`);

  // Ensure the folder exists
  fs.mkdirSync(outDir, { recursive: true });

  // Construct the command (same as you run manually)
  const cmd = [
    'npx',
    'browsertime',
    '--config',
    path.resolve('power.json'),   // adjust if stored elsewhere
    '--outputFolder',
    `"${outDir}"`,
    `"${targetUrl}"`,
    '-n 1'               // single iteration
  ].join(' ');

  console.log(`Running: ${cmd}`);

  // Execute the command; we wait for it to finish
   exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Browsertime error:', error);
      return res.status(500).json({ error: 'Browsertime failed', details: stderr });
    }

    // Extract domain and path from URL and build folder name
    // e.g., https://wearelucid.ch/projects -> wearelucid.ch-projects
    const urlObj = new URL(targetUrl);
    let folderName = urlObj.hostname;
    
    if (urlObj.pathname && urlObj.pathname !== '/') {
      // Convert pathname to folder format: /projects -> -projects, /projekte/sateco -> -projekte-sateco
      const pathPart = urlObj.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
      folderName = folderName + '-' + pathPart;
    }

    const domainDir = path.join(__dirname, 'browsertime-results', folderName);

    // Find the latest timestamp folder
    let latestFolder = null;
    let latestTime = 0;

    try {
      if (fs.existsSync(domainDir)) {
        const folders = fs.readdirSync(domainDir);
        for (const folder of folders) {
          const folderPath = path.join(domainDir, folder);
          const stat = fs.statSync(folderPath);
          if (stat.isDirectory() && stat.mtimeMs > latestTime) {
            latestTime = stat.mtimeMs;
            latestFolder = folderPath;
          }
        }
      }
    } catch (err) {
      console.error('Error reading domain directory:', err);
    }

    // Build path to browsertime.json
    const resultFile = latestFolder ? path.join(latestFolder, 'browsertime.json') : null;

    // If the file is not there, something went wrong
    if (!resultFile || !fs.existsSync(resultFile)) {
      return res.status(500).json({ error: 'Result file not found', domainDir, latestFolder });
    }

    // Read and send the JSON back
    const json = fs.readFileSync(resultFile, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(json);
  });
});

// Simple health check
app.get('/', (_, res) => res.send('Browsertime service is alive'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Service listening on http://localhost:${PORT}`));