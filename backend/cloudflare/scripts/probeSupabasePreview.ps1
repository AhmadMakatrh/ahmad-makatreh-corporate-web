# codeguard:components:start
# Source: backend/cloudflare/scripts/probeSupabasePreview.ps1
# Declarations and references retain their native language names and order.
# codeguard:components:end
$ErrorActionPreference = 'Stop'

$secret = Read-Host 'Supabase secret key' -AsSecureString
$publishable = Read-Host 'Supabase publishable key' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
$publishablePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($publishable)

try {
  $env:MEDIA_PROVIDER = 'supabase'
  $env:SUPABASE_URL = 'https://kghmejpjvbmcivnlnkgf.supabase.co'
  $env:SUPABASE_STORAGE_BUCKET = 'ahmad-makatreh-media-preview'
  $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
  $env:SUPABASE_PUBLISHABLE_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($publishablePointer)

  $repository = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
  $probeDirectory = Join-Path $repository '.superpowers\supabase-preview-probe-20261013'
  & node (Join-Path $PSScriptRoot 'supabaseMediaTools.js') probe --project-ref kghmejpjvbmcivnlnkgf --bucket ahmad-makatreh-media-preview --directory $probeDirectory
  if ($LASTEXITCODE -ne 0) { throw 'Supabase preview probe failed or was unconfirmed.' }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($publishablePointer)
  Remove-Item Env:SUPABASE_SECRET_KEY, Env:SUPABASE_PUBLISHABLE_KEY -ErrorAction SilentlyContinue
}
