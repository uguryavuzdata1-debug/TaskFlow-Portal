$headers = @{
    'apikey' = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH'
    'Authorization' = 'Bearer sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH'
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}

$payload = @{
    'CRM TICKET' = 'test'
    'INV NO' = 'test'
    'COMPANY' = 'test'
    'POSTCODE' = 'test'
    'USER' = 'test'
    'MAIN SERVICE' = 'test'
    'SUB SERVICE' = 'test'
    'START TIME' = '12:00'
    'END TIME' = '13:00'
    'DURATION' = 60
    'PRICE' = 100
    'PAYMENT STATUS' = 'test'
    'DESCRIPTION' = 'test'
    'STATUS' = 'test'
    'invoiced' = $false
}

while ($true) {
    $body = $payload | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri 'https://ekjhhjrhfkoiklyxjfpu.supabase.co/rest/v1/records' -Method Post -Headers $headers -Body $body
        Write-Host "SUCCESS! Payload accepted."
        break
    } catch {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        
        if ($responseBody -match "Could not find the '([^']+)' column") {
            $badCol = $matches[1]
            Write-Host "Removing bad column: $badCol"
            $payload.Remove($badCol)
        } else {
            Write-Host "Other error: $responseBody"
            break
        }
    }
}

Write-Host "VALID SCHEMA KEYS:"
$payload.Keys
