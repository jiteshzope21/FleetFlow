
# FleetFlow – One‑click setup & start script

# This script makes sure the Node.js/npm installation is on the PATH,
# installs exact dependencies, and launches the Express API.
# Run it from a *new* PowerShell window after installing Node.js.


# 1️⃣ Verify Node is present
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js not found. Please install it from https://nodejs.org/en/download/ and ensure ‘Add to PATH’ is checked."
    exit 1
}

# Show version for sanity
Write-Host "✅ Node version:" (node -v)

# 2️⃣ Ensure npm is also on the PATH
$npmExists = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmExists) {
    # Try to add the default Node installation folder to the user PATH
    $defaultNodeDir = "C:\Program Files\nodejs"
    if (Test-Path "$defaultNodeDir\npm.cmd") {
        Write-Host "🔧 npm not on PATH – adding $defaultNodeDir to user PATH for this session"
        $env:PATH = "$defaultNodeDir;$env:PATH"
        # Persist for future PowerShell sessions (User‑level env var)
        [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$defaultNodeDir", "User")
        # Verify again
        $npmExists = Get-Command npm -ErrorAction SilentlyContinue
        if (-not $npmExists) {
            Write-Error "❌ Failed to make npm available even after adjusting PATH. Restart PowerShell and try again."
            exit 1
        }
    } else {
        Write-Error "❌ npm.exe not found in $defaultNodeDir. Re‑run the Node installer and make sure the ‘Add to PATH’ option is selected."
        exit 1
    }
}

Write-Host "✅ npm version:" (npm -v)

# 3️⃣ Install exact dependencies using npm ci
$serverDir = Join-Path $PSScriptRoot "..\server"
Set-Location $serverDir
Write-Host "📦 Installing dependencies (npm ci) in $serverDir ..."
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ npm ci failed. Check the console output above for details."
    exit $LASTEXITCODE
}

# 4️⃣ Start the backend (development mode) – this will keep running
Write-Host "🚀 Starting the backend (npm run dev). Press Ctrl+C to stop."
# Use a new process so the script can exit while the server stays alive
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
Write-Host "✅ Backend launch command issued. Verify the server logs appear in the console or in the 'npm run dev' terminal."

# -------------------------------------------------
# After this script finishes, open a *second* PowerShell window to run API checks.
# -------------------------------------------------
