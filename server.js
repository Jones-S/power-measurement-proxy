// server.js
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // parse JSON bodies

// Security: allowed domains (whitelist)
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || [];

// Helper: validate incoming URL (scheme, length, optional whitelist)
function isValidUrl(str) {
  try {
    const url = new URL(str);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn(`Invalid protocol: ${url.protocol}`);
      return false;
    }
    
    // Limit URL length to prevent DoS
    if (str.length > 2048) {
      console.warn('URL exceeds maximum length (2048 chars)');
      return false;
    }
    
    // If whitelist is configured, check against it
    if (ALLOWED_DOMAINS.length > 0) {
      const allowed = ALLOWED_DOMAINS.some(domain => url.hostname.endsWith(domain));
      if (!allowed) {
        console.warn(`Domain not whitelisted: ${url.hostname}`);
        return false;
      }
    }
    
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

  // Execute the command with timeout to prevent resource exhaustion
  exec(cmd, { maxBuffer: 1024 * 1024 * 10, timeout: 120000 }, (error, stdout, stderr) => {
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

    // Read the full browsertime result
    const fullJson = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    
    // Extract only the required fields
    const result = {
      powerConsumption: fullJson[0]?.powerConsumption?.[0],
      statistics: {
        powerConsumption: {
          median: fullJson[0]?.statistics?.powerConsumption?.median,
          mean: fullJson[0]?.statistics?.powerConsumption?.mean
        }
      },
      cpu: fullJson[0]?.cpu ? `${fullJson[0].cpu} µWh` : null,
      googleWebVitals: {
        firstContentfulPaint: fullJson[0]?.googleWebVitals?.[0]?.firstContentfulPaint
      },
      browserScripts: {
        browser: fullJson[0]?.browserScripts?.[0]?.browser
      },
      info: {
        browser: fullJson[0]?.info?.browser
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.json(result);
  });
});

// Simple health check
app.get('/', (_, res) => res.send('Browsertime service is alive'));

// Restrict access to localhost only (127.0.0.1) for security
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;
app.listen(PORT, HOST, () => console.log(`🚀 Service listening on http://${HOST}:${PORT}`));