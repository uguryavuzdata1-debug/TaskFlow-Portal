import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add a function to fetch customers and render them
new_customer_logic = """
let allCustomersCache = [];

async function fetchCustomersFromTurso() {
    try {
        const res = await fetch('http://localhost:3000/api/customers');
        allCustomersCache = await res.json();
        renderCustomerGrid('');
    } catch(e) {
        console.error("Error fetching customers", e);
    }
}

function renderCustomerGrid(query) {
    const grid = document.getElementById('customers-grid');
    if(!grid) return;
    
    let filtered = allCustomersCache;
    if(query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(c => 
            (c.organization_name && c.organization_name.toLowerCase().includes(q)) || 
            (c.billing_postal_code && c.billing_postal_code.toLowerCase().includes(q)) ||
            (c.organization_number && c.organization_number.toLowerCase().includes(q))
        );
    }
    
    // Update the counter
    const countEl = document.querySelector('#section-customers .eyebrow + h1 + div + div > div:first-child');
    if(countEl) countEl.innerText = `Showing ${filtered.length} matching businesses`;
    
    if(filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--steel);">No customers found matching "${query}"</div>`;
        return;
    }

    grid.innerHTML = filtered.map(c => `
        <div class="cust-card" style="background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:1.2rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12); overflow:hidden;">
          <div class="stub" style="position:absolute; top:0; right:0; width:34px; height:34px; border-left:1px dashed var(--line); border-bottom:1px dashed var(--line);"></div>
          <span style="display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600; color:var(--green); border:1px solid currentColor; border-radius:20px; padding:2px 8px; margin-bottom:0.8rem;">${c.contract_status || 'ACTIVE'}</span>
          
          <h3 style="margin:0 0 0.2rem; font-size:1.1rem; font-weight:700; color:var(--ink);">${c.organization_name}</h3>
          <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1rem;">${c.billing_postal_code || 'No Postcode'} · ${c.organization_number || 'No ID'}</div>
          
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Industry</span> <span style="font-weight:600;">${c.industry || 'Unknown'}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Primary Phone</span> <span style="font-family:'IBM Plex Mono',monospace;">${c.primary_phone || 'N/A'}</span>
          </div>
          
          <div style="display:flex; gap:0.8rem; border-top:1px dashed var(--line); padding-top:1rem; margin-top:1.2rem;">
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">View Detail</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Add Appt</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Invoice</a>
          </div>
        </div>
    `).join('');
}
"""

# Append logic to end of app.js
if "fetchCustomersFromTurso" not in js:
    js += "\n" + new_customer_logic
    
    # Let's bind the search input event listener on init.
    # We find window.onload or initApp() or similar and hook it in.
    bind_logic = """
    setTimeout(() => {
        const searchInput = document.getElementById('customer-search');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderCustomerGrid(e.target.value);
            });
            // Hide the mock autocomplete
            const ac = document.querySelector('.autocomplete-panel');
            if(ac) ac.style.display = 'none';
        }
    }, 1000);
    """
    
    if "fetchCustomersFromTurso();" not in js:
        js += "\nfetchCustomersFromTurso();\n"
        js += bind_logic

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
