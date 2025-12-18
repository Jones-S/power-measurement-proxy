import express from 'express'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Enable CORS for localhost development
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
)

app.use(express.json()) // parse JSON bodies

// Security: allowed domains (whitelist)
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || []

// Helper: validate incoming URL (scheme, length, optional whitelist)
function isValidUrl(str) {
  try {
    const url = new URL(str)

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn(`Invalid protocol: ${url.protocol}`)
      return false
    }

    // Limit URL length to prevent DoS
    if (str.length > 2048) {
      console.warn('URL exceeds maximum length (2048 chars)')
      return false
    }

    // If whitelist is configured, check against it
    if (ALLOWED_DOMAINS.length > 0) {
      const allowed = ALLOWED_DOMAINS.some((domain) =>
        url.hostname.endsWith(domain),
      )
      if (!allowed) {
        console.warn(`Domain not whitelisted: ${url.hostname}`)
        return false
      }
    }

    return true
  } catch (_) {
    return false
  }
}

// POST /run   body: { "url": "https://example.com" }
app.post('/run', async (req, res) => {
  const targetUrl = req.body.url

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid or missing URL' })
  }

  // Build a unique output folder – timestamp + random part
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outDir = path.join(__dirname, 'browsertime-results', `${timestamp}`)

  // Ensure the folder exists
  fs.mkdirSync(outDir, { recursive: true })

  // Construct the command (same as you run manually)
  const cmd = [
    'npx',
    'browsertime',
    '--config',
    path.resolve('power.json'), // adjust if stored elsewhere
    '--firefox.binaryPath',
    '"/Applications/Firefox.app/Contents/MacOS/firefox"',
    '--outputFolder',
    `"${outDir}"`,
    `"${targetUrl}"`,
    '-n 1', // single iteration
  ].join(' ')

  console.log(`Running: ${cmd}`)

  // Track execution time
  const startTime = Date.now()

  // Execute the command with timeout to prevent resource exhaustion
  exec(
    cmd,
    { maxBuffer: 1024 * 1024 * 10, timeout: 120000 },
    (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime
      console.log(
        `Browsertime execution time: ${executionTime}ms (${(executionTime / 1000).toFixed(2)}s)`,
      )

      if (error) {
        console.error('Browsertime error:', error)
        return res.status(500).json({
          error: 'Browsertime failed',
          details: stderr,
          executionTime: `${executionTime}ms`,
        })
      }

      // Extract domain and path from URL and build folder name
      // e.g., https://wearelucid.ch/projects -> wearelucid.ch-projects
      const urlObj = new URL(targetUrl)
      let folderName = urlObj.hostname

      if (urlObj.pathname && urlObj.pathname !== '/') {
        // Convert pathname to folder format: /projects -> -projects, /projekte/sateco -> -projekte-sateco
        const pathPart = urlObj.pathname
          .replace(/^\/+|\/+$/g, '')
          .replace(/\//g, '-')
        folderName = folderName + '-' + pathPart
      }

      const domainDir = path.join(__dirname, 'browsertime-results', folderName)

      // Find the latest timestamp folder
      let latestFolder = null
      let latestTime = 0

      try {
        if (fs.existsSync(domainDir)) {
          const folders = fs.readdirSync(domainDir)
          for (const folder of folders) {
            const folderPath = path.join(domainDir, folder)
            const stat = fs.statSync(folderPath)
            if (stat.isDirectory() && stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs
              latestFolder = folderPath
            }
          }
        }
      } catch (err) {
        console.error('Error reading domain directory:', err)
      }

      // Build path to browsertime.json
      const resultFile = latestFolder
        ? path.join(latestFolder, 'browsertime.json')
        : null

      // If the file is not there, something went wrong
      if (!resultFile || !fs.existsSync(resultFile)) {
        return res
          .status(500)
          .json({ error: 'Result file not found', domainDir, latestFolder })
      }

      // Read the full browsertime result
      const fullJson = JSON.parse(fs.readFileSync(resultFile, 'utf8'))

      // Extract only the required fields
      const result = {
        executionTime: `${executionTime}ms`,
        powerConsumption: fullJson[0]?.powerConsumption?.[0],
        statistics: {
          powerConsumption: {
            median: fullJson[0]?.statistics?.powerConsumption?.median,
            mean: fullJson[0]?.statistics?.powerConsumption?.mean,
          },
        },
        cpuTime: fullJson[0]?.cpu ? `${fullJson[0].cpu} ms` : null,
        googleWebVitals: {
          firstContentfulPaint:
            fullJson[0]?.googleWebVitals?.[0]?.firstContentfulPaint,
        },
        browserScripts: {
          browser: fullJson[0]?.browserScripts?.[0]?.browser,
        },
        info: {
          browser: fullJson[0]?.info?.browser,
        },
      }

      res.setHeader('Content-Type', 'application/json')
      res.json(result)
    },
  )
})

// Simple health check
app.get('/', (_, res) => res.send('Browsertime service is alive'))

// Restrict access to localhost only (127.0.0.1) for security
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.BROWSERTIME_PORT || 3001
app.listen(PORT, HOST, () =>
  console.log(`🚀 Service listening on http://${HOST}:${PORT}`),
)
