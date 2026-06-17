const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const appJs = fs.readFileSync('h:\\UGUR AI\\Unfinished Work\\TO DO\\app.js', 'utf8');
const matchUrl = appJs.match(/createClient\(['"]([^'"]+)['"]/);
const matchKey = appJs.match(/createClient\([^,]+,\s*['"]([^'"]+)['"]/);

if (matchUrl && matchKey) {
    const supabase = createClient(matchUrl[1], matchKey[1]);
    
    async function testUpdate() {
        // Find a valid record ID first
        const { data: records, error: fetchErr } = await supabase.from('records').select('id').limit(1);
        if (fetchErr || !records || records.length === 0) {
            console.log("Error fetching records:", fetchErr);
            return;
        }
        
        const id = records[0].id;
        console.log("Found ID:", id);
        
        // Attempt update
        const { data, error } = await supabase.from('records').update({ 
            invoiced: true, 
            "INV NO": '11111', 
            "INV DATE": new Date().toISOString().split('T')[0] 
        }).eq('id', id).select();
        
        console.log("Update Error:", error);
        console.log("Update Data:", data);
    }
    
    testUpdate();
} else {
    console.log("Could not parse supabase credentials from app.js");
}
