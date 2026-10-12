$htmlFile = "index.html"
$jsFolder = "."

# 1. Read HTML and find all inline function calls
$htmlText = Get-Content $htmlFile -Raw -Encoding UTF8
$htmlRegex = [regex]'on\w+=\"\s*(?:event\.preventDefault\(\);\s*)?(\w+)\s*\('
$htmlMatches = $htmlRegex.Matches($htmlText)
$calledFunctions = @{}
foreach ($m in $htmlMatches) {
    $calledFunctions[$m.Groups[1].Value] = $true
}

# Remove JS global / built-in helpers
$ignored = @('alert', 'confirm', 'console', 'event', 'this', 'document', 'localStorage', 'sessionStorage', 'autoFillQuickAdd', 'gcSubmitQuickAdd')
foreach ($i in $ignored) {
    if ($calledFunctions.ContainsKey($i)) {
        $calledFunctions.Remove($i)
    }
}

# 2. Scan JS files for defined functions
$definedFunctions = @{}
$jsFiles = Get-ChildItem -Path $jsFolder -Filter *.js -Recurse | Where-Object { $_.FullName -notlike '*backup*' -and $_.FullName -notlike '*node_modules*' }
foreach ($file in $jsFiles) {
    $text = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Match: function funcName(
    $regex1 = [regex]'function\s+(\w+)\s*\('
    foreach ($m in $regex1.Matches($text)) {
        $definedFunctions[$m.Groups[1].Value] = $file.Name
    }
    
    # Match: const funcName = ( or let funcName = (
    $regex2 = [regex]'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\('
    foreach ($m in $regex2.Matches($text)) {
        $definedFunctions[$m.Groups[1].Value] = $file.Name
    }
    
    # Match: window.funcName =
    $regex3 = [regex]'window\.(\w+)\s*='
    foreach ($m in $regex3.Matches($text)) {
        $definedFunctions[$m.Groups[1].Value] = $file.Name
    }
}

Write-Host '=== MISSING FUNCTIONS IN JS ==='
foreach ($func in $calledFunctions.Keys | Sort-Object) {
    if (-not $definedFunctions.ContainsKey($func)) {
        Write-Host "- HTML calls $func() but it is not defined in any JS file!"
    }
}

Write-Host ""
Write-Host '=== DUPLICATE DEFINITIONS ==='
$allFuncs = @()
foreach ($file in $jsFiles) {
    $text = Get-Content $file.FullName -Raw -Encoding UTF8
    $regex1 = [regex]'function\s+(\w+)\s*\('
    foreach ($m in $regex1.Matches($text)) {
        $allFuncs += [PSCustomObject]@{ Func = $m.Groups[1].Value; File = $file.Name }
    }
}
$allFuncs | Group-Object Func | Where-Object { $_.Count -gt 1 } | ForEach-Object {
    $files = $_.Group | ForEach-Object { $_.File }
    Write-Host "- $($_.Name) is defined in multiple files: $($files -join ', ')"
}
