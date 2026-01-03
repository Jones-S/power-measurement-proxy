import express from 'express'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import PQueue from 'p-queue'
import crypto from 'crypto'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Security: allowed origins/referrers (whitelist)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',')
console.log('📋 Configured allowed origins: ', ALLOWED_ORIGINS)

// Enable CORS
app.use((req, res, next) => {
  const origin = req.headers.origin

  // Parse allowed origins from env variable
  const allowedDomains =
    process.env.ALLOWED_ORIGINS?.split(',').map((d) => d.trim()) || []

  // Build full list of allowed origins
  const allowedOrigins = allowedDomains.flatMap((domain) => {
    if (domain === 'localhost') {
      return ['http://localhost:3000', 'http://127.0.0.1:3000']
    }
    // For other domains, only support https
    return `https://${domain}`
  })

  console.log('Request origin:', origin)
  console.log('Allowed origins:', allowedOrigins)

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Origin, Accept',
  )

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())

// Queue with concurrency of 1 (only one browsertime test at a time)
const queue = new PQueue({ concurrency: 1 })

// Map to store job status and results
const jobs = new Map() // jobId -> { status, result, position, url, error }

const isValidUrl = (str) => {
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

    return true
  } catch (error) {
    console.warn('URL validation error:', error)
    return false
  }
}

const runBrowsertimeTest = (targetUrl) => {
  return new Promise((resolve, reject) => {
    // Build a unique output folder – timestamp + random part
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outDir = path.join(__dirname, 'browsertime-results', `${timestamp}`)

    // Ensure the folder exists
    fs.mkdirSync(outDir, { recursive: true })

    // Construct the command
    const cmd = [
      'npx',
      'browsertime',
      '--config',
      path.resolve('power.json'),
      // '--firefox.binaryPath',
      // '"/Applications/Firefox.app/Contents/MacOS/firefox"',
      '--outputFolder',
      `"${outDir}"`,
      `"${targetUrl}"`,
      '-n 1',
    ].join(' ')

    console.log(`Running: ${cmd}`)

    const startTime = Date.now()

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
          reject({
            error: 'Browsertime failed',
            details: stderr,
            executionTime: `${executionTime}ms`,
          })
          return
        }

        // Extract domain and path from URL
        const urlObj = new URL(targetUrl)
        let folderName = urlObj.hostname

        if (urlObj.pathname && urlObj.pathname !== '/') {
          const pathPart = urlObj.pathname
            .replace(/^\/+|\/+$/g, '')
            .replace(/\//g, '-')
          folderName = folderName + '-' + pathPart
        }

        const domainDir = path.join(
          __dirname,
          'browsertime-results',
          folderName,
        )

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

        const resultFile = latestFolder
          ? path.join(latestFolder, 'browsertime.json')
          : null

        if (!resultFile || !fs.existsSync(resultFile)) {
          reject({
            error: 'Result file not found',
            domainDir,
            latestFolder,
          })
          return
        }

        const fullJson = JSON.parse(fs.readFileSync(resultFile, 'utf8'))

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

        resolve(result)
      },
    )
  })
}

app.post('/measure', async (req, res) => {
  const targetUrl = req.body.url

  if (!targetUrl || !isValidUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid or missing URL' })
  }

  // Generate unique job ID
  const jobId = crypto.randomUUID()

  // Calculate current position in queue
  const position = queue.size + queue.pending

  // Store job with initial status
  jobs.set(jobId, {
    status: 'queued',
    position,
    url: targetUrl,
    createdAt: new Date().toISOString(),
  })

  console.log(`Job ${jobId} queued for ${targetUrl} at position ${position}`)

  // Add job to queue
  queue.add(async () => {
    console.log(`Job ${jobId} starting...`)

    // Update status to running
    const job = jobs.get(jobId)
    job.status = 'running'
    job.startedAt = new Date().toISOString()

    try {
      const result = await runBrowsertimeTest(targetUrl)

      // Update job with results
      job.status = 'complete'
      job.result = result
      job.completedAt = new Date().toISOString()

      console.log(`Job ${jobId} completed successfully`)
    } catch (error) {
      // Update job with error
      job.status = 'failed'
      job.error = error
      job.completedAt = new Date().toISOString()

      console.error(`Job ${jobId} failed:`, error)
    }
  })

  // Return job ID and position immediately
  res.json({
    jobId,
    position,
    status: 'queued',
    message: 'Test queued successfully',
  })
})

app.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params

  const job = jobs.get(jobId)

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'This job ID does not exist or has expired',
    })
  }

  res.json({
    jobId,
    status: job.status,
    url: job.url,
    position: job.status === 'queued' ? job.position : undefined,
    result: job.status === 'complete' ? job.result : undefined,
    error: job.status === 'failed' ? job.error : undefined,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  })
})

// Optional: Clean up old jobs periodically (keep only last 5 hours)
setInterval(
  () => {
    const timeThreshold = Date.now() - 5 * 60 * 60 * 1000 // 5h

    for (const [jobId, job] of jobs.entries()) {
      const createdAt = new Date(job.createdAt).getTime()
      if (createdAt < timeThreshold) {
        jobs.delete(jobId)
        console.log(`Cleaned up old job: ${jobId}`)
      }
    }
  },
  60 * 60 * 1000, // Run every hour
)

// Simple health check
app.get('/', (_, res) => res.send('Browsertime service is alive'))

// Restrict access to localhost only (127.0.0.1) for security
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.BROWSERTIME_PORT || 3001
app.listen(PORT, HOST, () =>
  console.log(`🚀 Service listening on http://${HOST}:${PORT}`),
)
