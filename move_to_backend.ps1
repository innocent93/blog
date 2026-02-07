$items = @('package.json','package-lock.json','README.md','.env.example','.gitignore','src')
if (-not (Test-Path 'backend')) { New-Item -ItemType Directory -Path 'backend' | Out-Null }
foreach ($i in $items) {
  if (Test-Path $i) {
    try {
      Move-Item -Force -LiteralPath $i -Destination '.\backend' -ErrorAction Stop
      Write-Output "Moved $i"
    } catch {
      Write-Output "Failed to move $i: $_"
    }
  } else {
    Write-Output "Not found: $i"
  }
}
