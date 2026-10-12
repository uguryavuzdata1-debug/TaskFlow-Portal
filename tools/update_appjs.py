import codecs
import random

app_js = codecs.open('app.js', 'r', 'utf-8').read()

# We need to find renderCustomers() or renderCustomersTable()
# Let's locate the tbody row rendering logic
old_row_logic = """
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 15px;">${c['CUSTOMER ID'] || '-'}</td>
            <td style="padding: 15px; font-weight: 500;">${c['COMPANY'] || '-'}</td>
            <td style="padding: 15px;">
                <button class="btn btn-primary" style="padding: 5px 10px; font-size: 12px;" onclick="openCustomerModal('${c['CUSTOMER ID']}')">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
"""

# Let's see if we can find this exact block or similar
import re

tr_match = re.search(r'const tr = document\.createElement\(\'tr\'\);.*?tbody\.appendChild\(tr\);', app_js, flags=re.DOTALL)
if tr_match:
    # Build new row logic
    new_row_logic = """
        const tr = document.createElement('tr');
        
        // Mock data for CRM feel
        const mockStatus = Math.random() > 0.3 ? 'Active' : 'Inactive';
        const statusClass = mockStatus === 'Active' ? 'status-active' : 'status-inactive';
        const mockTickets = Math.floor(Math.random() * 5);
        const mockTime = Math.floor(Math.random() * 23) + 1 + 'h ago';
        
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--secondary);">${c['COMPANY'] || '-'}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${c['CUSTOMER ID'] || '-'}</div>
            </td>
            <td><span class="status-badge ${statusClass}">${mockStatus}</span></td>
            <td>${mockTickets}</td>
            <td>${mockTime}</td>
            <td>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="openCustomerModal('${c['CUSTOMER ID']}')">View Details</button>
            </td>
        `;
        tbody.appendChild(tr);
"""
    app_js = app_js.replace(tr_match.group(0), new_row_logic)

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(app_js)
    
print("Updated app.js for new customer table layout.")
