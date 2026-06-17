const url = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co/rest/v1/records?select=*&limit=1';
const headers = { 'apikey': 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH', 'Authorization': 'Bearer sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH' };

fetch(url, { headers })
    .then(r => r.json())
    .then(data => console.log('RECORDS:', JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));

const url2 = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co/rest/v1/services?select=*&limit=10';
fetch(url2, { headers })
    .then(r => r.json())
    .then(data => console.log('SERVICES:', JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
