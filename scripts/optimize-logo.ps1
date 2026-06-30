# Lender Trust Hub — production logo pipeline (true transparency, no checkerboard)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/optimize-logo.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Michael.Savitsky\logos\LenderTH.png"
if (-not (Test-Path $src)) {
    $src = Join-Path $PSScriptRoot "..\LenderTH.png"
}
$outDir = Join-Path $PSScriptRoot "..\public\brand"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-TransparentBitmap([int]$width, [int]$height) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $g.Dispose()
    return $bmp
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

function Save-Png($bitmap, $path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  $path ($($bitmap.Width)x$($bitmap.Height))"
}

function To-ArgbBitmap($image) {
    if ($image.PixelFormat -eq [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) {
        return $image
    }
    $bmp = New-TransparentBitmap $image.Width $image.Height
    $g = New-Graphics $bmp
    $g.DrawImage($image, 0, 0, $image.Width, $image.Height)
    $g.Dispose()
    return $bmp
}

function Resize-Bitmap($source, $width) {
    $src = To-ArgbBitmap $source
    $ratio = $width / $src.Width
    $height = [int]($src.Height * $ratio)
    $bmp = New-TransparentBitmap $width $height
    $g = New-Graphics $bmp
    $g.DrawImage($src, 0, 0, $width, $height)
    $g.Dispose()
    if ($src -ne $source) { $src.Dispose() }
    return $bmp
}

function Crop-Bitmap($source, $x, $y, $w, $h) {
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $cropped = $source.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    return $cropped
}

function Trim-Transparent($bitmap) {
    $bmp = To-ArgbBitmap $bitmap
    $w = $bmp.Width; $h = $bmp.Height
    $minX = $w; $minY = $h; $maxX = 0; $maxY = 0
    $data = $bmp.LockBits(
        (New-Object System.Drawing.Rectangle 0, 0, $w, $h),
        [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $stride = $data.Stride
    $bytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $bmp.UnlockBits($data)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $i = $y * $stride + $x * 4
            if ($bytes[$i + 3] -gt 20) {
                if ($x -lt $minX) { $minX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($maxX -le $minX) { return $bmp }
    return Crop-Bitmap $bmp $minX $minY ($maxX - $minX + 1) ($maxY - $minY + 1)
}

# Remove baked-in checkerboard / gray-white preview pixels (not brand navy)
function Remove-CheckerboardArtifacts($bitmap) {
    $bmp = To-ArgbBitmap $bitmap
    $w = $bmp.Width; $h = $bmp.Height
    $data = $bmp.LockBits(
        (New-Object System.Drawing.Rectangle 0, 0, $w, $h),
        [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $stride = $data.Stride
    $bytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $i = $y * $stride + $x * 4
            $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]; $a = $bytes[$i + 3]
            if ($a -lt 10) { continue }
            # Keep brand navy/teal pixels (blue-dominant or dark)
            $isBrandBlue = ($b -gt $r + 8) -and ($r -lt 80)
            $isDark = ($r -lt 90) -and ($g -lt 90) -and ($b -lt 120)
            if ($isBrandBlue -or $isDark) { continue }
            # Neutral light gray / white checkerboard cells
            $isNeutral = ([Math]::Abs($r - $g) -lt 12) -and ([Math]::Abs($g - $b) -lt 12)
            $isLight = ($r -gt 160) -and ($g -gt 160) -and ($b -gt 160)
            if ($isNeutral -and $isLight) {
                $bytes[$i] = 0; $bytes[$i + 1] = 0; $bytes[$i + 2] = 0; $bytes[$i + 3] = 0
            }
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
    $bmp.UnlockBits($data)
    return $bmp
}

function Pad-Square($bitmap, $size) {
    $bmp = Trim-Transparent $bitmap
    $side = [Math]::Max($bmp.Width, $bmp.Height)
    $scale = ($size * 0.86) / $side
    $nw = [int]($bmp.Width * $scale)
    $nh = [int]($bmp.Height * $scale)
    $scaled = Resize-Bitmap $bmp $nw
    $square = New-TransparentBitmap $size $size
    $g = New-Graphics $square
    $g.DrawImage($scaled, [int](($size - $nw) / 2), [int](($size - $nh) / 2), $nw, $nh)
    $g.Dispose()
    $scaled.Dispose()
    return (Remove-CheckerboardArtifacts $square)
}

function Compose-Horizontal($icon, $text, [int]$iconHeight) {
    $icon = Trim-Transparent $icon
    $text = Trim-Transparent $text
    $iconScale = $iconHeight / $icon.Height
    $iconW = [int]($icon.Width * $iconScale)
    $iconResized = Resize-Bitmap $icon $iconW

    $textHeight = [int]($iconHeight * 0.78)
    $textScale = $textHeight / $text.Height
    $textW = [int]($text.Width * $textScale)
    $textResized = Resize-Bitmap $text $textW

    $gap = [int]($iconHeight * 0.12)
    $pad = [int]($iconHeight * 0.06)
    $cw = $pad + $iconW + $gap + $textW + $pad
    $ch = $iconHeight + ($pad * 2)
    $canvas = New-TransparentBitmap $cw $ch
    $g = New-Graphics $canvas
    $g.DrawImage($iconResized, $pad, $pad, $iconW, $iconHeight)
    $textY = [int]($pad + ($iconHeight - $textHeight) / 2)
    $g.DrawImage($textResized, $pad + $iconW + $gap, $textY, $textW, $textHeight)
    $g.Dispose()
    $iconResized.Dispose(); $textResized.Dispose()
    return (Remove-CheckerboardArtifacts $canvas)
}

# ── Load source ──────────────────────────────────────────────────────────────
$original = To-ArgbBitmap ([System.Drawing.Image]::FromFile($src))
$w = $original.Width; $h = $original.Height
Write-Host "Source: $w x $h"

# ── Stacked (compact / favicon base) ─────────────────────────────────────────
$stackedClean = Remove-CheckerboardArtifacts $original
Save-Png $stackedClean (Join-Path $outDir "lender-trust-hub-logo-stacked@2x.png")
$stacked1200 = Remove-CheckerboardArtifacts (Resize-Bitmap $stackedClean 1200)
Save-Png $stacked1200 (Join-Path $outDir "lender-trust-hub-logo-stacked.png")
$stacked600 = Remove-CheckerboardArtifacts (Resize-Bitmap $stackedClean 600)
Save-Png $stacked600 (Join-Path $outDir "lender-trust-hub-logo-stacked-sm.png")

# ── Icon emblem ────────────────────────────────────────────────────────────────
$iconRaw = Crop-Bitmap $original ([int]($w * 0.10)) ([int]($h * 0.04)) ([int]($w * 0.80)) ([int]($h * 0.56))
$icon = Remove-CheckerboardArtifacts (Trim-Transparent $iconRaw)

$icon512 = Pad-Square $icon 512
Save-Png $icon512 (Join-Path $outDir "lender-trust-hub-icon.png")
$icon192 = Pad-Square $icon 192
Save-Png $icon192 (Join-Path $outDir "lender-trust-hub-icon-192.png")
$icon32 = Pad-Square $icon 32
Save-Png $icon32 (Join-Path $outDir "lender-trust-hub-favicon-32.png")

# ── Wordmark crop ──────────────────────────────────────────────────────────────
$textRaw = Crop-Bitmap $original ([int]($w * 0.08)) ([int]($h * 0.63)) ([int]($w * 0.84)) ([int]($h * 0.30))
$text = Remove-CheckerboardArtifacts (Trim-Transparent $textRaw)

# ── Horizontal nav logo ────────────────────────────────────────────────────────
$horizontal = Compose-Horizontal $icon $text 240
$horizontal1200 = Resize-Bitmap $horizontal 1200
$horizontal1200 = Remove-CheckerboardArtifacts $horizontal1200
Save-Png $horizontal1200 (Join-Path $outDir "lender-trust-hub-logo-horizontal.png")
$horizontal600 = Resize-Bitmap $horizontal 600
$horizontal600 = Remove-CheckerboardArtifacts $horizontal600
Save-Png $horizontal600 (Join-Path $outDir "lender-trust-hub-logo-horizontal-sm.png")

# Wordmark-only strip (optional nav fallback — pure text, no composite)
$wordmark1200 = Resize-Bitmap $text 900
Save-Png (Remove-CheckerboardArtifacts $wordmark1200) (Join-Path $outDir "lender-trust-hub-wordmark.png")

# Next.js metadata icons
$icon512.Save((Join-Path $PSScriptRoot "..\app\icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Save((Join-Path $PSScriptRoot "..\app\apple-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "  app/icon.png + app/apple-icon.png"

# Cleanup
$original.Dispose()
$stackedClean.Dispose(); $stacked1200.Dispose(); $stacked600.Dispose()
$iconRaw.Dispose(); $icon.Dispose()
$icon512.Dispose(); $icon192.Dispose(); $icon32.Dispose()
$textRaw.Dispose(); $text.Dispose()
$horizontal.Dispose(); $horizontal1200.Dispose(); $horizontal600.Dispose()
$wordmark1200.Dispose()

Write-Host "Done - all assets use Format32bppArgb with checkerboard stripped."