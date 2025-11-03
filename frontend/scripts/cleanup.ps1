# Cleanup script for Next.js development server
# This script kills any existing Node.js processes and removes lock files

Write-Host "Cleaning up Next.js development environment..." -ForegroundColor Yellow

# Kill Node.js processes running on ports 3000 and 3001
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "Killed process $pid on port $port" -ForegroundColor Green
            } catch {
                Write-Host "Could not kill process $pid" -ForegroundColor Red
            }
        }
    }
}

# Remove lock files
$lockFile = ".next/dev/lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "Removed lock file" -ForegroundColor Green
}

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 1

Write-Host "Cleanup complete!" -ForegroundColor Green

