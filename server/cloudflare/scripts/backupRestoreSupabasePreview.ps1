# codeguard:components:start
# Source: server/cloudflare/scripts/backupRestoreSupabasePreview.ps1
# Declarations and references retain their native language names and order.
# codeguard:components:end
$ErrorActionPreference = 'Stop'

$secret = Read-Host 'Supabase secret key' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)

try {
  $env:MEDIA_PROVIDER = 'supabase'
  $env:SUPABASE_URL = 'https://kghmejpjvbmcivnlnkgf.supabase.co'
  $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)

  $repository = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
  $tool = Join-Path $PSScriptRoot 'supabaseMediaTools.js'
  $backupDirectory = Join-Path $repository '.superpowers\supabase-preview-backup-20261013'

  $env:SUPABASE_STORAGE_BUCKET = 'ahmad-makatreh-media-preview'
  & node $tool backup --project-ref kghmejpjvbmcivnlnkgf --bucket ahmad-makatreh-media-preview --directory $backupDirectory
  if ($LASTEXITCODE -ne 0) { throw 'Supabase preview backup failed or was unconfirmed.' }

  $env:SUPABASE_STORAGE_BUCKET = 'ahmad-makatreh-media-restore-preview'
  & node $tool restore --project-ref kghmejpjvbmcivnlnkgf --bucket ahmad-makatreh-media-restore-preview --directory $backupDirectory
  if ($LASTEXITCODE -ne 0) { throw 'Supabase preview restore failed or was unconfirmed. Inspect retained evidence before another attempt.' }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
}
