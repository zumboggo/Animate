param(
  [string]$Workspace = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$characters = @('anna', 'sarah', 'grace', 'elliott')
$slots = @{
  'torso'          = @{ Width = 350; Height = 512; Source = 'torso.png' }
  'pelvis'         = @{ Width = 538; Height = 512; Source = 'pelvis.png' }
  'left-upper-arm' = @{ Width = 174; Height = 512; Source = 'left-upper-arm.png' }
  'left-forearm'   = @{ Width = 159; Height = 512; Source = 'left-forearm.png' }
  'right-upper-arm'= @{ Width = 174; Height = 512; Source = 'right-upper-arm.png' }
  'right-forearm'  = @{ Width = 159; Height = 512; Source = 'right-forearm.png' }
  'left-thigh'     = @{ Width = 197; Height = 512; Source = 'left-thigh.png' }
  'left-shin'      = @{ Width = 225; Height = 512; Source = 'left-shin.png' }
  'right-thigh'    = @{ Width = 197; Height = 512; Source = 'right-thigh.png' }
  'right-shin'     = @{ Width = 225; Height = 512; Source = 'right-shin.png' }
}

function Get-AlphaBounds([System.Drawing.Bitmap]$Bitmap) {
  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      if ($Bitmap.GetPixel($x, $y).A -le 8) { continue }
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
  if ($maxX -lt 0) { throw 'Source image has no visible pixels.' }
  return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
}

foreach ($character in $characters) {
  $parts = Join-Path $Workspace "public/assets/characters/$character/parts"
  $output = Join-Path $parts 'standard'
  [System.IO.Directory]::CreateDirectory($output) | Out-Null

  foreach ($slotName in $slots.Keys) {
    $slot = $slots[$slotName]
    $sourceName = $slot.Source
    if ($character -in @('sarah', 'grace') -and $slotName -eq 'torso') {
      $sourceName = 'torso-clean-v2.png'
    }
    $sourcePath = Join-Path $parts $sourceName
    $source = [System.Drawing.Bitmap]::FromFile($sourcePath)
    try {
      $bounds = Get-AlphaBounds $source
      $canvas = [System.Drawing.Bitmap]::new($slot.Width, $slot.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb)
      try {
        $graphics = [System.Drawing.Graphics]::FromImage($canvas)
        try {
          $graphics.Clear([System.Drawing.Color]::Transparent)
          $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
          $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::GammaCorrected
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $padX = [Math]::Max(4, [Math]::Round($slot.Width * 0.035))
          $padY = [Math]::Max(6, [Math]::Round($slot.Height * 0.025))
          $destination = [System.Drawing.Rectangle]::new(
            $padX,
            $padY,
            $slot.Width - (2 * $padX),
            $slot.Height - (2 * $padY)
          )
          $graphics.DrawImage($source, $destination, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
        } finally {
          $graphics.Dispose()
        }
        $outputPath = Join-Path $output "$slotName.png"
        $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

        $check = [System.Drawing.Bitmap]::FromFile($outputPath)
        try {
          $corners = @(
            $check.GetPixel(0, 0),
            $check.GetPixel($check.Width - 1, 0),
            $check.GetPixel(0, $check.Height - 1),
            $check.GetPixel($check.Width - 1, $check.Height - 1)
          )
          if (($corners | Where-Object { $_.A -ne 0 }).Count -ne 0) {
            throw "$character/$slotName does not have transparent corners."
          }
        } finally {
          $check.Dispose()
        }
      } finally {
        $canvas.Dispose()
      }
    } finally {
      $source.Dispose()
    }
  }
}

Write-Output "Built $($characters.Count * $slots.Count) standardized child skin assets with transparent padding."
