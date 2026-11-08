# PowerShell helper to set up and run the FleetFlow backend
# ----------------------------------------------------------
# 1️⃣ Verify Node.js installation
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not found on PATH. Please install Node.js LTS from https://nodejs.org/en/download/ and ensure 'Add to PATH' is selected."
    exit 1
}

# Show versions for sanity
Write-Host "Node version:" (node -v)
Write-Host "npm version:" (npm -v)

# 2️⃣ Install backend dependencies (exact lockfile versions)
$serverDir = "${PSScriptRoot}\..\server"
Set-Location $serverDir
Write-Host "📦 Installing npm dependencies in $serverDir..."
# Use npm ci for deterministic install
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm ci failed. Check the error above."
    exit $LASTEXITCODE
}

# 3️⃣ Start the Express server (development mode)
Write-Host "🚀 Starting the backend in development mode..."
# Use ts-node-dev if available (defined in package.json scripts)
npm run dev
# The script will keep running; when you want to stop, press Ctrl+C.

# ----------------------------------------------------------
# After the server is up, you can test the API with curl:
#   curl -X POST http://localhost:5000/api/auth/register ...
#   curl -X POST http://localhost:5000/api/auth/login ...
#   curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/support/chat ...
# ----------------------------------------------------------
