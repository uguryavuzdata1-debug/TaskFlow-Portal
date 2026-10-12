$headers = @{
    "apikey" = "sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH"
    "Authorization" = "Bearer sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH"
}
$response = Invoke-RestMethod -Uri "https://ekjhhjrhfkoiklyxjfpu.supabase.co/rest/v1/records?limit=1" -Headers $headers
$response | ConvertTo-Json
