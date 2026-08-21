# Store Finder Shutdown Script
$ports = 5199, 8000
$pids = Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids) {
    if ($p -and $p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "[OK] Store Finder services stopped."
