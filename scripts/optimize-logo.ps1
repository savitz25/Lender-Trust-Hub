# Optimize Lender Trust Hub logo assets from source PNG
# Usage: powershell -ExecutionPolicy Bypass -File scripts/optimize-logo.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Michael.Savitsky\logos\LenderTH.png"
$outDir = Join-Path $PSScriptRoot "..\public\brand"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Save-Png($bitmap, $path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  $path ($($bitmap.Width)x$($bitmap.Height))"
}

function New-Graphics($bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    return $g
}

function Resize-Bitmap($source, $width) {
    $ratio = $width / $source.Width
    $height = [int]($source.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = New-Graphics $bmp
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()
    return $bmp
}

function Crop-Bitmap($source, $x, $y, $w, $h) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    return $source.Clone($rect, $source.PixelFormat)
}

function Trim-Transparent($bitmap) {
    $w = $bitmap.Width
    $h = $bitmap.Height
    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
    $bmpData = $bitmap.LockBits(
        (New-Object System.Drawing.Rectangle 0, 0, $w, $h),
        [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $stride = $bmpData.Stride
    $bytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $bytes.Length)
    $bitmap.UnlockBits($bmpData)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $i = $y * $stride + $x * 4
            $alpha = $bytes[$i + 3]
            if ($alpha -gt 16) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -le $minX) { return $bitmap }
    $tw = $maxX - $minX + 1
    $th = $maxY - $minY + 1
    return Crop-Bitmap $bitmap $minX $minY $tw $th
}

$original = [System.Drawing.Image]::FromFile($src)
$w = $original.Width
$h = $original.Height

# ── Stacked (primary / mobile) ─────────────────────────────────────────────
Save-Png $original (Join-Path $outDir "lender-trust-hub-logo-stacked@2x.png")
$stacked1200 = Resize-Bitmap $original 1200
Save-Png $stacked1200 (Join-Path $outDir "lender-trust-hub-logo-stacked.png")
$stacked600 = Resize-Bitmap $original 600
Save-Png $stacked600 (Join-Path $outDir "lender-trust-hub-logo-stacked-sm.png")

# ── Icon only (emblem) ───────────────────────────────────────────────────────
$iconRaw = Crop-Bitmap $original ([int]($w * 0.08)) ([int]($h * 0.02)) ([int]($w * 0.84)) ([int]($h * 0.58))
$icon = Trim-Transparent $iconRaw
function Pad-Square($bitmap, $size) {
    $side = [Math]::Max($bitmap.Width, $bitmap.Height)
    $scale = ($size * 0.88) / $side
    $nw = [int]($bitmap.Width * $scale)
    $nh = [int]($bitmap.Height * $scale)
    $scaled = Resize-Bitmap $bitmap $nw
    $square = New-Object System.Drawing.Bitmap $size, $size
    $g = New-Graphics $square
    $g.Clear([System.Drawing.Color]::Transparent)
    $x = [int](($size - $nw) / 2)
    $y = [int](($size - $nh) / 2)
    $g.DrawImage($scaled, $x, $y, $nw, $nh)
    $g.Dispose()
    $scaled.Dispose()
    return $square
}

$icon512 = Pad-Square $icon 512
Save-Png $icon512 (Join-Path $outDir "lender-trust-hub-icon.png")
$icon192 = Pad-Square $icon 192
Save-Png $icon192 (Join-Path $outDir "lender-trust-hub-icon-192.png")
$icon32 = Pad-Square $icon 32
Save-Png $icon32 (Join-Path $outDir "lender-trust-hub-favicon-32.png")

# ── Wordmark only ────────────────────────────────────────────────────────────
$textRaw = Crop-Bitmap $original ([int]($w * 0.05)) ([int]($h * 0.64)) ([int]($w * 0.90)) ([int]($h * 0.32))
$text = Trim-Transparent $textRaw

# ── Horizontal: trimmed icon + wordmark ────────────────────────────────────────
$iconTargetH = 220
$iconScale = $iconTargetH / $icon.Height
$iconW = [int]($icon.Width * $iconScale)
$iconH = Resize-Bitmap $icon $iconW

$textTargetH = [int]($iconTargetH * 0.82)
$textScale = $textTargetH / $text.Height
$textW = [int]($text.Width * $textScale)
$textScaled = Resize-Bitmap $text $textW

$gap = 28
$padX = 12
$canvasW = $padX + $iconW + $gap + $textW + $padX
$canvasH = $iconTargetH + 16
$horizontal = New-Object System.Drawing.Bitmap $canvasW, $canvasH
$hg = New-Graphics $horizontal
$hg.Clear([System.Drawing.Color]::Transparent)

$iconY = [int](($canvasH - $iconTargetH) / 2)
$textY = [int](($canvasH - $textTargetH) / 2)
$hg.DrawImage($iconH, $padX, $iconY, $iconW, $iconTargetH)
$hg.DrawImage($textScaled, $padX + $iconW + $gap, $textY, $textW, $textTargetH)
$hg.Dispose()

$horizontal1200 = Resize-Bitmap $horizontal 1200
Save-Png $horizontal1200 (Join-Path $outDir "lender-trust-hub-logo-horizontal.png")
$horizontal600 = Resize-Bitmap $horizontal 600
Save-Png $horizontal600 (Join-Path $outDir "lender-trust-hub-logo-horizontal-sm.png")

# Next.js app icons
$icon512.Save((Join-Path $PSScriptRoot "..\app\icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Save((Join-Path $PSScriptRoot "..\app\apple-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "  app/icon.png + app/apple-icon.png"

# Cleanup
$original.Dispose()
$stacked1200.Dispose(); $stacked600.Dispose()
$iconRaw.Dispose(); $icon.Dispose()
$icon512.Dispose(); $icon192.Dispose(); $icon32.Dispose()
$textRaw.Dispose(); $text.Dispose()
$iconH.Dispose(); $textScaled.Dispose()
$horizontal.Dispose(); $horizontal1200.Dispose(); $horizontal600.Dispose()

Write-Host "Logo optimization complete."