// ============================================
// CUSTOMER DIRECTORY - Standalone Module v2
// 5-column list + slide-over detail panel
// ============================================
(function() {
    'use strict';

    var cache = [];
    var initialized = false;

    // -- Fetch from Turso API --------------------------------
    async function loadCustomers() {
        var container = document.getElementById('customers-list');
        if (!container) return;
        if (!initialized) container.innerHTML = '<div style="padding:2rem;text-align:center;font-family:IBM Plex Mono,monospace;color:var(--steel);font-size:0.8rem;">LOADING CUSTOMER DIRECTORY...</div>';

        try {
            var res = await window.sbClient.from('vt_customers').select('*');
            if (res.error) throw res.error;
            var data = res.data;

            data.sort(function(a,b){
                return new Date(b.modified_time||b.created_time||0) - new Date(a.modified_time||a.created_time||0);
            });

            var seen = {};
            var uniqueData = [];
            for (var i = 0; i < data.length; i++) {
                var c = data[i];
                var key = c.organization_number || c.organization_name || c.customer_no;
                if (key) {
                    var lowerKey = String(key).trim().toLowerCase();
                    if (!seen[lowerKey]) {
                        seen[lowerKey] = true;
                        uniqueData.push(c);
                    }
                } else {
                    uniqueData.push(c);
                }
            }
            data = uniqueData;

            cache = data;
            initialized = true;
            applyFilters();

            if (window.appState) window.appState.customers = data;
            var dl = document.getElementById('vtiger-customer-list');
            if (dl) dl.innerHTML = data.map(function(c){
                return '<option value="'+(c.organization_name||c.company||'').replace(/"/g,'&quot;')+'">'; 
            }).join('');

        } catch(e) {
            console.warn('[Customers] API error:', e.message);
            cache = []; initialized = true; document.getElementById('customers-list').innerHTML = '<div style="padding:2rem;text-align:center;color:red;">HATA: Veritabanindan m�steriler �ekilemedi! L�tfen API baglantinizi kontrol edin.</div>';
        }
    }

    // -- Apply filters + sort + render ----------------------
    function applyFilters() {
        var searchEl   = document.getElementById('customer-search');
        var statusEl   = document.getElementById('customer-status-filter');
        var industryEl = document.getElementById('customer-industry-filter');
        var sortEl     = document.getElementById('customer-sort-filter');

        var q        = searchEl   ? searchEl.value.toLowerCase().trim() : '';
        var status   = statusEl   ? statusEl.value   : 'all';
        var industry = industryEl ? industryEl.value : 'all';
        var sortBy   = sortEl     ? sortEl.value     : 'recent';

        var clearBtn = document.getElementById('customer-search-clear');
        if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

        var filtered = cache;

        if (q) {
            filtered = filtered.filter(function(c){
                return (
                    ((c.organization_name||'').toLowerCase().includes(q)) ||
                    ((c.billing_postal_code||'').toLowerCase().includes(q)) ||
                    ((c.billing_city||'').toLowerCase().includes(q)) ||
                    ((c.primary_phone||'').toLowerCase().includes(q)) ||
                    ((c.organization_number||'').toLowerCase().includes(q)) ||
                    ((c.ownership||'').toLowerCase().includes(q))
                );
            });
        }

        if (status === 'active') {
            filtered = filtered.filter(function(c){ return c.contract_status && c.contract_status.toLowerCase().includes('active'); });
        } else if (status === 'none') {
            filtered = filtered.filter(function(c){ return !c.contract_status || !c.contract_status.toLowerCase().includes('active'); });
        }

        if (industry !== 'all') {
            filtered = filtered.filter(function(c){ return (c.industry||'').toLowerCase().includes(industry.toLowerCase()); });
        }

        if (sortBy === 'name') {
            filtered = filtered.slice().sort(function(a,b){ return (a.organization_name||'').localeCompare(b.organization_name||''); });
        } else if (sortBy === 'postcode') {
            filtered = filtered.slice().sort(function(a,b){ return (a.billing_postal_code||'').localeCompare(b.billing_postal_code||''); });
        } else if (sortBy === 'city') {
            filtered = filtered.slice().sort(function(a,b){ return (a.billing_city||'').localeCompare(b.billing_city||''); });
        }

        renderList(filtered, q);
    }

    // -- Render 5-column list --------------------------------
    function renderList(filtered, q) {
        var counter = document.getElementById('customer-count-display');
        if (counter) counter.textContent = filtered.length + ' / ' + cache.length + ' customers';

        var container = document.getElementById('customers-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<div style="padding:3rem;text-align:center;font-family:IBM Plex Mono,monospace;color:var(--steel);">No results found.</div>';
            return;
        }

        // Store filtered so detail panel can look up by index
        window._customerFiltered = filtered;

        var displayLimit = 60;
        window._customerDisplayLimit = displayLimit;

        function buildRowHtml(c, idx) {
            var name      = c.organization_name || 'Unknown';
            var number    = c.organization_number || '-';
            var postcode  = c.billing_postal_code || '-';
            var city      = c.billing_city || '-';
            var hasContract = c.contract_status && c.contract_status.toLowerCase().includes('active');
            var contractStatus = c.contract_status || 'No Contract';
            var rowBg = idx % 2 === 0 ? 'var(--paper)' : 'var(--card)';

            // Service status badge
            var statusColor = hasContract ? 'var(--green)' : 'var(--steel)';
            var statusBg    = hasContract ? 'rgba(60,180,80,0.1)' : 'transparent';

            // Highlight search term
            var dName     = q ? hl(name, q) : name;
            var dNumber   = q ? hl(number, q) : number;
            var dPostcode = q ? hl(postcode, q) : postcode;
            var dCity     = q ? hl(city, q) : city;

            return [
                '<div style="display:grid;grid-template-columns:130px 1fr 160px 160px 100px;gap:0.5rem;',
                'padding:0.65rem 1rem;background:'+rowBg+';border-bottom:1px solid var(--line);align-items:center;',
                'cursor:pointer;transition:background 0.12s;"',
                ' onmouseenter="this.style.background=\'rgba(255,200,0,0.12)\'"',
                ' onmouseleave="this.style.background=\''+rowBg+'\'"',
                ' onclick="openCustomerDetail('+idx+')">',

                  // 1. Org ID
                  '<div style="font-family:IBM Plex Mono,monospace;font-size:0.72rem;color:var(--steel);">'+dNumber+'</div>',

                  // 2. Org Name
                  '<div style="font-weight:600;color:var(--ink);font-size:0.88rem;">'+dName+'</div>',

                  // 3. Postcode / City
                  '<div style="font-family:IBM Plex Mono,monospace;font-size:0.78rem;">',
                    '<div style="font-weight:600;color:var(--ink);">'+dPostcode+'</div>',
                    '<div style="color:var(--steel);font-size:0.7rem;">'+dCity+'</div>',
                  '</div>',

                  // 4. Service Status
                  '<div>',
                    '<span style="display:inline-flex;align-items:center;gap:0.3rem;font-family:IBM Plex Mono,monospace;',
                    'font-size:0.68rem;font-weight:700;padding:0.2rem 0.5rem;',
                    'border:1px solid '+statusColor+';color:'+statusColor+';background:'+statusBg+';">',
                      '<span style="display:inline-block;width:6px;height:6px;background:'+statusColor+';border-radius:50%;"></span>',
                      contractStatus.toUpperCase(),
                    '</span>',
                  '</div>',

                  // 5. Actions button
                  '<div style="display:flex;justify-content:center;" onclick="event.stopPropagation()">',
                    '<button onclick="openCustomerDetail('+idx+')"',
                    ' title="View full profile"',
                    ' style="padding:0.35rem 0.7rem;border:1px solid var(--ink);background:var(--ink);color:var(--paper);',
                    'font-family:IBM Plex Mono,monospace;font-size:0.68rem;font-weight:700;cursor:pointer;">',
                    'VIEW',
                    '</button>',
                  '</div>',

                '</div>'
            ].join('');
        }

        var visibleSlice = filtered.slice(0, displayLimit);
        container.innerHTML = visibleSlice.map(buildRowHtml).join('');

        if (filtered.length > displayLimit) {
            var loadMoreIndicator = document.createElement('div');
            loadMoreIndicator.id = 'customer-load-more';
            loadMoreIndicator.style.cssText = 'padding:1rem;text-align:center;font-family:IBM Plex Mono,monospace;font-size:0.75rem;color:var(--steel);border-top:1px dashed var(--line);cursor:pointer;background:var(--card);';
            loadMoreIndicator.innerHTML = 'Showing ' + displayLimit + ' of ' + filtered.length + ' customers. Scroll or click to load more...';
            loadMoreIndicator.onclick = function() { loadNextChunk(); };
            container.appendChild(loadMoreIndicator);
        }

        function loadNextChunk() {
            var curr = window._customerDisplayLimit || 60;
            if (curr >= filtered.length) return;
            var nextLimit = curr + 60;
            window._customerDisplayLimit = nextLimit;
            var nextSlice = filtered.slice(curr, nextLimit);
            var lm = document.getElementById('customer-load-more');
            if (lm) lm.remove();

            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = nextSlice.map(function(c, i){ return buildRowHtml(c, curr + i); }).join('');
            while(tempDiv.firstChild) {
                container.appendChild(tempDiv.firstChild);
            }

            if (nextLimit < filtered.length) {
                var newLm = document.createElement('div');
                newLm.id = 'customer-load-more';
                newLm.style.cssText = 'padding:1rem;text-align:center;font-family:IBM Plex Mono,monospace;font-size:0.75rem;color:var(--steel);border-top:1px dashed var(--line);cursor:pointer;background:var(--card);';
                newLm.innerHTML = 'Showing ' + nextLimit + ' of ' + filtered.length + ' customers. Scroll or click to load more...';
                newLm.onclick = function() { loadNextChunk(); };
                container.appendChild(newLm);
            }
        }

        // On scroll near bottom, auto-load next batch
        container.onscroll = function() {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 150) {
                loadNextChunk();
            }
        };
    }

    var currentCustomer = null;

    var currentCustomer = null;

    // -- Open detail panel -----------------------------------
    function openDetail(idx) {
        var list = window._customerFiltered || cache;
        var c = list[idx];
        if (!c) return;

        currentCustomer = c;
        window._currentDetailCustomer = c;

        // Fill all panel fields
        set('cd-header-name', c.organization_name || '-');
        set('cd-header-id', (c.organization_number || '-') + ' • ID: ' + (c.id || '-'));
        set('cd-industry-badge', (c.industry || 'GENERAL').toUpperCase());
        set('cd-contract-badge', (c.contract_status || 'NO CONTRACT').toUpperCase());
        set('cd-phone', c.primary_phone || '-');
        set('cd-email', c.primary_email || '-');
        set('cd-owner', c.ownership || '-');
        set('cd-assigned', c.assigned_to ? ('Technician #' + c.assigned_to) : '-');
        set('cd-address', (c.billing_address || '-').replace(/\n/g,', '));
        set('cd-city', c.billing_city || '-');
        set('cd-postcode', c.billing_postal_code || '-');
        set('cd-contract-status', c.contract_status || 'No Contract');
        set('cd-contract-start', c.contract_start_date || '-');
        set('cd-contract-due', c.contract_due_date || '-');
        set('cd-industry', c.industry || '-');
        set('cd-description', c.description || 'No notes recorded.');
        set('cd-created', c.created_time ? String(c.created_time).split(' ')[0] : '-');
        set('cd-modified', c.modified_time ? String(c.modified_time).split(' ')[0] : '-');

        // Contract badge color
        var badge = document.getElementById('cd-contract-badge');
        if (badge) {
            var isActive = c.contract_status && c.contract_status.toLowerCase().includes('active');
            badge.style.borderColor = isActive ? 'var(--green)' : 'var(--steel)';
            badge.style.color = isActive ? 'var(--green)' : 'var(--steel)';
        }

        // Render Tickets & Quotations tables
        renderCustomerTicketsTable(c, 'all');
        renderCustomerQuotesTable(c, 'all');

        // Show panel + overlay with animation
        var overlay = document.getElementById('customer-detail-overlay');
        var panel   = document.getElementById('customer-detail-panel');
        if (overlay) { overlay.style.display = 'block'; }
        if (panel)   {
            panel.style.display = 'block';
            requestAnimationFrame(function(){
                panel.style.transform = 'translateX(0)';
            });
        }

        if (window.lucide) lucide.createIcons();
    }

    function closeDetail() {
        var panel   = document.getElementById('customer-detail-panel');
        var overlay = document.getElementById('customer-detail-overlay');
        if (panel) {
            panel.style.transform = 'translateX(100%)';
            setTimeout(function(){ panel.style.display = 'none'; }, 320);
        }
        if (overlay) overlay.style.display = 'none';
    }

    // ========================================================
    // CUSTOMER TICKETS LOGIC & TABLE RENDERING
    // ========================================================
    function getCustomerTickets(c) {
        if (!c) return [];
        var res = [];
        var allTickets = (window.appState && window.appState.tickets) ? window.appState.tickets : [];
        var cName = (c.organization_name || c.company || c['ORGANIZATION NAME'] || c.COMPANY || '').toLowerCase().trim();
        var cId = String(c.id || c.DB_ID || c['CUSTOMER ID'] || '').trim();
        var cCleanId = cId.replace(/^11x/, '');
        var cNo = (c.organization_number || c['ORGANIZATION NUMBER'] || '').toLowerCase().trim();
        var cPostcode = (c.billing_postal_code || c.postcode || c.POSTCODE || '').toLowerCase().replace(/\s+/g, '');

        res = allTickets.filter(function(t) {
            var tComp = (t.company || '').toLowerCase().trim();
            var tId = String(t.companyId || t.parent_id || '').trim();
            var tCleanId = tId.replace(/^11x/, '');
            var tPostcode = (t.postcode || '').toLowerCase().replace(/\s+/g, '');

            if (cCleanId && tCleanId && cCleanId === tCleanId) return true;
            if (cId && tId && (cId === tId || cId === '11x'+tId || '11x'+cId === tId)) return true;
            if (cNo && tCleanId && cNo === tCleanId) return true;
            if (cName && tComp && (cName === tComp || tComp.includes(cName) || cName.includes(tComp))) return true;
            if (cPostcode && tPostcode && cPostcode === tPostcode && cName && tComp && cName[0] === tComp[0]) return true;
            return false;
        });

        // Also check localStorage for tickets added specifically for this customer
        var localKey = 'tf_cust_tickets_' + (c.id || c.organization_number || c.organization_name);
        try {
            var saved = JSON.parse(localStorage.getItem(localKey) || '[]');
            if (Array.isArray(saved) && saved.length > 0) {
                saved.forEach(function(s) {
                    if (!res.some(function(r){ return String(r.id) === String(s.id) || String(r.crmTicket) === String(s.crmTicket); })) {
                        res.unshift(s);
                    }
                });
            }
        } catch(e) {}

        return res;
    }

    function renderCustomerTicketsTable(c, filter) {
        var container = document.getElementById('cd-tickets-table-container');
        var badge = document.getElementById('cd-tickets-count-badge');
        if (!container) return;

        filter = filter || 'all';
        var allTickets = getCustomerTickets(c);

        // Direct fetch fallback if tickets in memory is 0
        if (allTickets.length === 0 && c && !c._fetchingTickets && window.tursoExecute) {
            c._fetchingTickets = true;
            var cRawId = String(c.id || c.DB_ID || c['CUSTOMER ID'] || '').trim();
            var cCleanId = cRawId.replace(/^11x/, '');
            var cName = (c.organization_name || c.company || c['ORGANIZATION NAME'] || '').trim();

            window.tursoExecute("SELECT id, ticket_no, ticket_title, parent_id, ticketstatus, createdtime, description, assigned_user_id FROM vt_tickets WHERE parent_id = ? OR parent_id = ? LIMIT 50", [cCleanId, '11x' + cCleanId])
                .then(function(dbTickets) {
                    c._fetchingTickets = false;
                    if (dbTickets && dbTickets.length > 0) {
                        var fetchedMapped = dbTickets.map(function(t) {
                            var realStatus = t.ticketstatus || 'Open';
                            var isClosed = realStatus.toLowerCase() === 'closed';
                            return {
                                id: String(t.id),
                                dbId: String(t.id).slice(-5),
                                crmTicket: t.ticket_no || ('TT' + t.id),
                                ticket_no: t.ticket_no || ('TT' + t.id),
                                timestamp: t.createdtime || new Date().toISOString(),
                                createdtime: t.createdtime || '',
                                company: cName || 'Customer',
                                companyId: t.parent_id,
                                parent_id: t.parent_id,
                                postcode: c.billing_postal_code || '',
                                user: t.assigned_user_id || 'Technician #1',
                                mainService: t.ticket_title || 'General Support',
                                subService: '',
                                status: realStatus,
                                price: 0,
                                description: t.description || '',
                                invoiced: isClosed,
                                paymentStatus: isClosed ? 'Completed' : 'Pending'
                            };
                        });
                        if (window.appState) {
                            window.appState.tickets = (window.appState.tickets || []).concat(fetchedMapped);
                        }
                        renderCustomerTicketsTable(c, filter);
                    }
                }).catch(function(err) {
                    c._fetchingTickets = false;
                    console.warn('[renderCustomerTicketsTable] fetch fallback error:', err);
                });
        }

        if (badge) badge.textContent = allTickets.length;

        // Update filter buttons active style
        var filterBtns = document.querySelectorAll('#cd-tickets-filters .cd-filter-btn');
        filterBtns.forEach(function(b) {
            var f = b.getAttribute('data-filter');
            if (f === filter) {
                b.style.background = '#1d2430';
                b.style.color = '#ffffff';
                b.style.borderColor = '#1d2430';
            } else {
                b.style.background = '#ffffff';
                b.style.color = '#334155';
                b.style.borderColor = '#cbd5e1';
            }
        });

        // Filter tickets
        var filtered = allTickets;
        if (filter === 'open') {
            filtered = allTickets.filter(function(t) {
                var st = (t.status || '').toLowerCase();
                return st.includes('pend') || st.includes('prog') || st.includes('log') || st.includes('open');
            });
        } else if (filter === 'completed') {
            filtered = allTickets.filter(function(t) {
                var st = (t.status || '').toLowerCase();
                return st.includes('comp') || st.includes('close');
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = [
                '<div style="padding:1.5rem; text-align:center; color:#64748b; font-size:0.8rem;">',
                  '<div style="margin-bottom:0.5rem; font-weight:600; color:#475569;">No registered tickets found</div>',
                  '<div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.85rem;">There are no ' + (filter !== 'all' ? filter : '') + ' ticket records for this customer.</div>',
                '</div>'
            ].join('');
            return;
        }

        var rowsHtml = filtered.map(function(t, i) {
            var st = (t.status || 'Pending').toLowerCase();
            var stBg = '#f1f5f9';
            var stColor = '#475569';
            var stBorder = '#cbd5e1';

            if (st.includes('comp') || st.includes('close')) {
                stBg = '#dcfce7'; stColor = '#15803d'; stBorder = '#86efac';
            } else if (st.includes('prog') || st.includes('pend')) {
                stBg = '#fef3c7'; stColor = '#b45309'; stBorder = '#fde68a';
            } else if (st.includes('log') || st.includes('open')) {
                stBg = '#dbeafe'; stColor = '#1d4ed8'; stBorder = '#93c5fd';
            }

            var tDate = t.timestamp ? String(t.timestamp).split('T')[0].split(' ')[0] : '-';
            var tNo = t.crmTicket || t.ticket_no || ('#' + (t.dbId || t.id || (1000 + i)));
            var tPrice = typeof t.price === 'number' ? ('£' + t.price.toFixed(2)) : (t.price ? ('£' + parseFloat(t.price).toFixed(2)) : '£0.00');
            var tService = t.mainService || t.service_type || t.service || t.ticket_title || 'General Support';
            var tTech = t.user || t.staff_user || t.technician || '-';

            return [
                '<tr style="border-bottom:1px solid #f1f5f9; transition:background 0.12s;" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'#ffffff\'">',
                  '<td style="padding:0.6rem 0.75rem; font-family:monospace; font-weight:700; color:#1d2430;">' + tNo + '</td>',
                  '<td style="padding:0.6rem 0.75rem; font-family:monospace; color:#64748b; font-size:0.72rem;">' + tDate + '</td>',
                  '<td style="padding:0.6rem 0.75rem;">',
                    '<div style="font-weight:600; color:#1e293b;">' + tService + '</div>',
                    (t.subService ? '<div style="font-size:0.68rem; color:#64748b;">' + t.subService + '</div>' : ''),
                  '</td>',
                  '<td style="padding:0.6rem 0.75rem; color:#475569; font-size:0.75rem;">' + tTech + '</td>',
                  '<td style="padding:0.6rem 0.75rem;">',
                    '<span style="display:inline-block; padding:0.15rem 0.5rem; font-family:monospace; font-size:0.65rem; font-weight:700; border-radius:3px; background:' + stBg + '; color:' + stColor + '; border:1px solid ' + stBorder + ';">',
                      (t.status || 'Pending').toUpperCase(),
                    '</span>',
                  '</td>',
                  '<td style="padding:0.6rem 0.75rem; text-align:right; font-family:monospace; font-weight:700; color:#0f172a;">' + tPrice + '</td>',
                  '<td style="padding:0.6rem 0.75rem; text-align:center;">',
                    '<button onclick="window.viewTicketDetails && window.viewTicketDetails(\'' + (t.id || tNo) + '\')" ',
                    'style="padding:0.25rem 0.55rem; background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-size:0.68rem; font-family:monospace; font-weight:600; cursor:pointer; border-radius:3px;">',
                    'VIEW',
                    '</button>',
                  '</td>',
                '</tr>'
            ].join('');
        }).join('');

        container.innerHTML = [
            '<table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.75rem;">',
              '<thead>',
                '<tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; font-family:monospace; color:#475569; font-size:0.66rem; text-transform:uppercase; letter-spacing:0.03em;">',
                  '<th style="padding:0.5rem 0.75rem;">TICKET NO</th>',
                  '<th style="padding:0.5rem 0.75rem;">DATE</th>',
                  '<th style="padding:0.5rem 0.75rem;">SERVICE / DETAIL</th>',
                  '<th style="padding:0.5rem 0.75rem;">TECHNICIAN</th>',
                  '<th style="padding:0.5rem 0.75rem;">STATUS</th>',
                  '<th style="padding:0.5rem 0.75rem; text-align:right;">PRICE</th>',
                  '<th style="padding:0.5rem 0.75rem; text-align:center;">ACTION</th>',
                '</tr>',
              '</thead>',
              '<tbody>' + rowsHtml + '</tbody>',
            '</table>'
        ].join('');
    }

    // ========================================================
    // CUSTOMER QUOTATIONS (QUOTES) LOGIC & TABLE RENDERING
    // ========================================================
    function getCustomerQuotes(c) {
        if (!c) return [];
        var res = [];
        var allQuotes = (window.appState && window.appState.quotes) ? window.appState.quotes : [];
        var cName = (c.organization_name || c.company || c['ORGANIZATION NAME'] || '').toLowerCase().trim();
        var cId = String(c.id || c.DB_ID || c['CUSTOMER ID'] || '').trim();
        var cCleanId = cId.replace(/^11x/, '');
        var cNo = (c.organization_number || c['ORGANIZATION NUMBER'] || '').toLowerCase().trim();

        res = allQuotes.filter(function(q) {
            var qAcc = String(q.account_id || q.accountId || q.companyId || '').trim();
            var qCleanAcc = qAcc.replace(/^11x/, '');
            var qName = (q.account_name || q.company || q.customer_name || '').toLowerCase().trim();
            if (cCleanId && qCleanAcc && cCleanId === qCleanAcc) return true;
            if (cId && qAcc && (cId === qAcc || cId === '11x'+qAcc || '11x'+cId === qAcc)) return true;
            if (cNo && qCleanAcc && cNo === qCleanAcc) return true;
            if (cName && qName && (cName === qName || qName.includes(cName) || cName.includes(qName))) return true;
            return false;
        });

        // Also check localStorage for quotes added specifically for this customer
        var localKey = 'tf_cust_quotes_' + (c.id || c.organization_number || c.organization_name);
        try {
            var saved = JSON.parse(localStorage.getItem(localKey) || '[]');
            if (Array.isArray(saved) && saved.length > 0) {
                saved.forEach(function(s) {
                    if (!res.some(function(r){ return String(r.id) === String(s.id) || String(r.quote_no) === String(s.quote_no); })) {
                        res.unshift(s);
                    }
                });
            }
        } catch(e) {}

        return res;
    }

    function renderCustomerQuotesTable(c, filter) {
        var container = document.getElementById('cd-quotes-table-container');
        var badge = document.getElementById('cd-quotes-count-badge');
        if (!container) return;

        filter = filter || 'all';
        var allQuotes = getCustomerQuotes(c);

        // Direct fetch fallback if quotes in memory is 0
        if (allQuotes.length === 0 && c && !c._fetchingQuotes && window.tursoExecute) {
            c._fetchingQuotes = true;
            var cRawId = String(c.id || c.DB_ID || c['CUSTOMER ID'] || '').trim();
            var cCleanId = cRawId.replace(/^11x/, '');
            var cName = (c.organization_name || c.company || c['ORGANIZATION NAME'] || '').trim();

            window.tursoExecute("SELECT id, quote_no, subject, quotestage, validtill, createdtime, hdnGrandTotal, account_id FROM vt_quotes WHERE account_id = ? OR account_id = ? LIMIT 50", [cCleanId, '11x' + cCleanId])
                .then(function(dbQuotes) {
                    c._fetchingQuotes = false;
                    if (dbQuotes && dbQuotes.length > 0) {
                        var fetchedMapped = dbQuotes.map(function(q) {
                            var grandTotal = parseFloat(q.hdnGrandTotal) || 0;
                            return {
                                id: String(q.id),
                                quote_no: q.quote_no || q.id,
                                subject: q.subject || 'Equipment & Service Quotation',
                                quotestage: q.quotestage || 'Draft',
                                validtill: q.validtill || '',
                                createdtime: q.createdtime || '',
                                hdnGrandTotal: grandTotal,
                                total: grandTotal,
                                details: q.details || '',
                                company: cName || 'Customer',
                                account_id: q.account_id
                            };
                        });
                        if (window.appState) {
                            window.appState.quotes = (window.appState.quotes || []).concat(fetchedMapped);
                        }
                        renderCustomerQuotesTable(c, filter);
                    }
                }).catch(function(err) {
                    c._fetchingQuotes = false;
                    console.warn('[renderCustomerQuotesTable] fetch fallback error:', err);
                });
        }

        if (badge) badge.textContent = allQuotes.length;

        // Update filter buttons active style
        var filterBtns = document.querySelectorAll('#cd-quotes-filters .cd-qfilter-btn');
        filterBtns.forEach(function(b) {
            var f = b.getAttribute('data-filter');
            if (f === filter) {
                b.style.background = '#1d2430';
                b.style.color = '#ffffff';
                b.style.borderColor = '#1d2430';
            } else {
                b.style.background = '#ffffff';
                b.style.color = '#334155';
                b.style.borderColor = '#cbd5e1';
            }
        });

        // Filter quotes
        var filtered = allQuotes;
        if (filter === 'accepted') {
            filtered = allQuotes.filter(function(q) {
                var st = (q.quotestage || q.status || '').toLowerCase();
                return st.includes('accept');
            });
        } else if (filter === 'pending') {
            filtered = allQuotes.filter(function(q) {
                var st = (q.quotestage || q.status || '').toLowerCase();
                return st.includes('deliv') || st.includes('creat') || st.includes('draft') || st.includes('sent');
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = [
                '<div style="padding:1.5rem; text-align:center; color:#64748b; font-size:0.8rem;">',
                  '<div style="margin-bottom:0.5rem; font-weight:600; color:#475569;">No registered quotes found</div>',
                  '<div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.85rem;">There are no ' + (filter !== 'all' ? filter : '') + ' quote records for this customer.</div>',
                '</div>'
            ].join('');
            return;
        }

        var rowsHtml = filtered.map(function(q, i) {
            var st = (q.quotestage || q.status || 'Created').toLowerCase();
            var stBg = '#f1f5f9';
            var stColor = '#475569';
            var stBorder = '#cbd5e1';

            if (st.includes('accept')) {
                stBg = '#dcfce7'; stColor = '#15803d'; stBorder = '#86efac';
            } else if (st.includes('deliv') || st.includes('sent')) {
                stBg = '#dbeafe'; stColor = '#1d4ed8'; stBorder = '#93c5fd';
            } else if (st.includes('reject')) {
                stBg = '#fee2e2'; stColor = '#b91c1c'; stBorder = '#fca5a5';
            } else if (st.includes('creat') || st.includes('draft')) {
                stBg = '#fef3c7'; stColor = '#b45309'; stBorder = '#fde68a';
            }

            var qNo = q.quote_no || q.id || ('QUO-' + (202600 + i));
            var qValid = q.validtill || q.valid_till || q.createdtime || '-';
            var qSubject = q.subject || 'EPOS System Equipment Quotation';
            var qUser = q.assigned_to || q.assigned_user_id || '-';
            var qTotalVal = typeof q.hdnGrandTotal === 'number' ? q.hdnGrandTotal : (q.total ? parseFloat(q.total) : (q.hdnGrandTotal ? parseFloat(q.hdnGrandTotal) : 0));
            var qTotal = '£' + (isNaN(qTotalVal) ? '0.00' : qTotalVal.toFixed(2));

            return [
                '<tr style="border-bottom:1px solid #f1f5f9; transition:background 0.12s;" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'#ffffff\'">',
                  '<td style="padding:0.6rem 0.75rem; font-family:monospace; font-weight:700; color:#1d2430;">' + qNo + '</td>',
                  '<td style="padding:0.6rem 0.75rem; font-family:monospace; color:#64748b; font-size:0.72rem;">' + qValid + '</td>',
                  '<td style="padding:0.6rem 0.75rem;">',
                    '<div style="font-weight:600; color:#1e293b;">' + qSubject + '</div>',
                    (q.details ? '<div style="font-size:0.68rem; color:#64748b; max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + q.details + '</div>' : ''),
                  '</td>',
                  '<td style="padding:0.6rem 0.75rem; color:#475569; font-size:0.75rem;">' + qUser + '</td>',
                  '<td style="padding:0.6rem 0.75rem;">',
                    '<span style="display:inline-block; padding:0.15rem 0.5rem; font-family:monospace; font-size:0.65rem; font-weight:700; border-radius:3px; background:' + stBg + '; color:' + stColor + '; border:1px solid ' + stBorder + ';">',
                      (q.quotestage || q.status || 'Created').toUpperCase(),
                    '</span>',
                  '</td>',
                  '<td style="padding:0.6rem 0.75rem; text-align:right; font-family:monospace; font-weight:700; color:#059669;">' + qTotal + '</td>',
                  '<td style="padding:0.6rem 0.75rem; text-align:center;">',
                    '<button onclick="window.viewQuoteDetails && window.viewQuoteDetails(\'' + (q.id || qNo) + '\')" ',
                    'style="padding:0.25rem 0.55rem; background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-size:0.68rem; font-family:monospace; font-weight:600; cursor:pointer; border-radius:3px;">',
                    'VIEW',
                    '</button>',
                  '</td>',
                '</tr>'
            ].join('');
        }).join('');

        container.innerHTML = [
            '<table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.75rem;">',
              '<thead>',
                '<tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; font-family:monospace; color:#475569; font-size:0.66rem; text-transform:uppercase; letter-spacing:0.03em;">',
                  '<th style="padding:0.5rem 0.75rem;">QUOTE NO</th>',
                  '<th style="padding:0.5rem 0.75rem;">VALID TILL</th>',
                  '<th style="padding:0.5rem 0.75rem;">SUBJECT / DETAIL</th>',
                  '<th style="padding:0.5rem 0.75rem;">PREPARED BY</th>',
                  '<th style="padding:0.5rem 0.75rem;">STATUS</th>',
                  '<th style="padding:0.5rem 0.75rem; text-align:right;">TOTAL</th>',
                  '<th style="padding:0.5rem 0.75rem; text-align:center;">ACTION</th>',
                '</tr>',
              '</thead>',
              '<tbody>' + rowsHtml + '</tbody>',
            '</table>'
        ].join('');
    }

    // -- Filter helper wrappers -----------------------------
    window.filterCustTickets = function(filter) {
        if (currentCustomer) renderCustomerTicketsTable(currentCustomer, filter);
    };

    window.filterCustQuotes = function(filter) {
        if (currentCustomer) renderCustomerQuotesTable(currentCustomer, filter);
    };

    // ========================================================
    // MODALS: ADD TICKET & ADD QUOTE HANDLERS
    // ========================================================
    window.openAddTicketForCurrentCustomer = function() {
        if (!currentCustomer) return;
        var modal = document.getElementById('cd-ticket-modal');
        if (!modal) return;

        document.getElementById('cd-tm-cust-id').value = currentCustomer.id || '';
        document.getElementById('cd-tm-company').value = currentCustomer.organization_name || '';
        document.getElementById('cd-tm-ticketno').value = 'TT-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('cd-tm-price').value = '125.00';
        document.getElementById('cd-tm-tech').value = (window.appState && window.appState.currentUser) ? window.appState.currentUser : 'Ugur';
        document.getElementById('cd-tm-desc').value = '';
        modal.style.display = 'flex';
    };

    window.saveNewCustomerTicket = function() {
        if (!currentCustomer) return;
        var comp = document.getElementById('cd-tm-company').value;
        var tNo = document.getElementById('cd-tm-ticketno').value.trim() || ('TT-' + Date.now().toString().slice(-4));
        var srv = document.getElementById('cd-tm-service').value;
        var status = document.getElementById('cd-tm-status').value;
        var price = parseFloat(document.getElementById('cd-tm-price').value) || 0;
        var tech = document.getElementById('cd-tm-tech').value.trim();
        var desc = document.getElementById('cd-tm-desc').value.trim();

        var newTicket = {
            id: 'TCK-' + Date.now(),
            crmTicket: tNo,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            mainService: srv,
            subService: '',
            user: tech,
            status: status,
            price: price,
            description: desc,
            company: comp,
            companyId: currentCustomer.id || '',
            postcode: currentCustomer.billing_postal_code || ''
        };

        // Save to appState
        if (window.appState) {
            if (!Array.isArray(window.appState.tickets)) window.appState.tickets = [];
            window.appState.tickets.unshift(newTicket);
        }

        // Save to localStorage
        var localKey = 'tf_cust_tickets_' + (currentCustomer.id || currentCustomer.organization_number || currentCustomer.organization_name);
        try {
            var cur = JSON.parse(localStorage.getItem(localKey) || '[]');
            cur.unshift(newTicket);
            localStorage.setItem(localKey, JSON.stringify(cur));
        } catch(e) {}

        // Persist directly to Turso DB
        if (window.turso && window.turso.addTicket) {
            window.turso.addTicket({
                id: newTicket.id,
                ticket_no: tNo,
                ticket_title: srv,
                ticketstatus: status,
                ticketpriorities: 'Normal',
                ticketseverities: 'Minor',
                parent_id: currentCustomer.id || '',
                customer_name: comp,
                assigned_user_id: tech,
                description: desc
            }).then(function() {
                console.log('[Turso DB] Ticket created in Turso:', newTicket.id);
            }).catch(function(err) {
                console.warn('[Turso DB] Ticket creation warning:', err);
            });
        }

        document.getElementById('cd-ticket-modal').style.display = 'none';
        renderCustomerTicketsTable(currentCustomer, 'all');

        if (window.showToast) window.showToast('New ticket saved successfully!', 'success');
        else alert('Bilet kaydedildi: ' + tNo);
    };

    window.openAddQuoteForCurrentCustomer = function() {
        if (!currentCustomer) return;
        var modal = document.getElementById('cd-quote-modal');
        if (!modal) return;

        document.getElementById('cd-qm-cust-id').value = currentCustomer.id || '';
        document.getElementById('cd-qm-company').value = currentCustomer.organization_name || '';
        document.getElementById('cd-qm-quoteno').value = 'QUO-2026-' + Math.floor(100 + Math.random() * 900);
        document.getElementById('cd-qm-subject').value = '';
        document.getElementById('cd-qm-total').value = '250.00';
        document.getElementById('cd-qm-details').value = '';

        // Default valid date: +30 days
        var d = new Date();
        d.setDate(d.getDate() + 30);
        document.getElementById('cd-qm-validtill').value = d.toISOString().split('T')[0];

        modal.style.display = 'flex';
    };

    window.saveNewCustomerQuote = function() {
        if (!currentCustomer) return;
        var comp = document.getElementById('cd-qm-company').value;
        var qNo = document.getElementById('cd-qm-quoteno').value.trim() || ('QUO-' + Date.now().toString().slice(-4));
        var validTill = document.getElementById('cd-qm-validtill').value;
        var subject = document.getElementById('cd-qm-subject').value.trim() || 'Service & Ekipman Teklifi';
        var status = document.getElementById('cd-qm-status').value;
        var total = parseFloat(document.getElementById('cd-qm-total').value) || 0;
        var details = document.getElementById('cd-qm-details').value.trim();

        var newQuote = {
            id: 'QUO-' + Date.now(),
            quote_no: qNo,
            subject: subject,
            quotestage: status,
            validtill: validTill,
            createdtime: new Date().toISOString().split('T')[0],
            hdnGrandTotal: total,
            total: total,
            details: details,
            company: comp,
            account_id: currentCustomer.id || '',
            assigned_to: (window.appState && window.appState.currentUser) ? window.appState.currentUser : 'Ugur'
        };

        // Save to appState
        if (window.appState) {
            if (!Array.isArray(window.appState.quotes)) window.appState.quotes = [];
            window.appState.quotes.unshift(newQuote);
        }

        // Save to localStorage
        var localKey = 'tf_cust_quotes_' + (currentCustomer.id || currentCustomer.organization_number || currentCustomer.organization_name);
        try {
            var cur = JSON.parse(localStorage.getItem(localKey) || '[]');
            cur.unshift(newQuote);
            localStorage.setItem(localKey, JSON.stringify(cur));
        } catch(e) {}

        // Persist directly to Turso DB
        if (window.turso && window.turso.addQuote) {
            window.turso.addQuote({
                id: newQuote.id,
                quote_no: qNo,
                subject: subject,
                quotestage: status,
                validtill: validTill,
                hdnGrandTotal: total,
                account_id: currentCustomer.id || '',
                customer_name: comp,
                assigned_user_id: newQuote.assigned_to,
                details: details
            }).then(function() {
                console.log('[Turso DB] Quote created in Turso:', newQuote.id);
            }).catch(function(err) {
                console.warn('[Turso DB] Quote creation warning:', err);
            });
        }

        document.getElementById('cd-quote-modal').style.display = 'none';
        renderCustomerQuotesTable(currentCustomer, 'all');

        if (window.showToast) window.showToast('Yeni fiyat teklifi kaydedildi!', 'success');
        else alert('Teklif kaydedildi: ' + qNo);
    };

    // ========================================================
    // DETAIL VIEW MODAL (INSPECT TICKET / QUOTE)
    // ========================================================
    window.viewTicketDetails = function(ticketId) {
        if (!currentCustomer) return;
        var tickets = getCustomerTickets(currentCustomer);
        var t = tickets.find(function(item){ return String(item.id) === String(ticketId) || String(item.crmTicket) === String(ticketId); });
        if (!t) return;

        var modal = document.getElementById('cd-detail-view-modal');
        if (!modal) return;

        document.getElementById('cd-dvm-badge').textContent = 'SERVICE TICKET';
        document.getElementById('cd-dvm-title').textContent = (t.crmTicket || t.id || 'Ticket Detail') + ' • ' + (t.company || currentCustomer.organization_name);

        var priceStr = typeof t.price === 'number' ? ('£' + t.price.toFixed(2)) : (t.price ? ('£' + parseFloat(t.price).toFixed(2)) : '£0.00');

        document.getElementById('cd-dvm-content').innerHTML = [
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid #e2e8f0;">',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">TICKET NO</div><div style="font-weight:700; color:#0f172a;">' + (t.crmTicket || t.id) + '</div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">DATE</div><div style="font-weight:600; color:#0f172a;">' + (t.timestamp || '-') + '</div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">STATUS</div><div><span style="display:inline-block; padding:0.15rem 0.5rem; font-family:monospace; font-size:0.65rem; font-weight:700; background:#f1f5f9; color:#1e293b; border-radius:3px;">' + (t.status || 'Pending').toUpperCase() + '</span></div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">PRICE</div><div style="font-family:monospace; font-weight:700; color:#059669; font-size:1.05rem;">' + priceStr + '</div></div>',
            '</div>',
            '<div style="margin-bottom:1rem;">',
              '<div style="font-family:monospace; font-size:0.65rem; color:#64748b; margin-bottom:0.25rem;">SERVICE AND CATEGORY</div>',
              '<div style="font-weight:600; color:#1e293b;">' + (t.mainService || 'Service') + (t.subService ? (' — ' + t.subService) : '') + '</div>',
            '</div>',
            '<div style="margin-bottom:1rem;">',
              '<div style="font-family:monospace; font-size:0.65rem; color:#64748b; margin-bottom:0.25rem;">ATANAN TECHNICIAN</div>',
              '<div style="color:#1e293b;">' + (t.user || t.technician || 'Unassigned') + '</div>',
            '</div>',
            '<div>',
              '<div style="font-family:monospace; font-size:0.65rem; color:#64748b; margin-bottom:0.25rem;">WORK / PROBLEM DESCRIPTION</div>',
              '<div style="background:#f8fafc; padding:0.85rem; border:1px solid #e2e8f0; border-radius:4px; font-size:0.85rem; color:#334155; white-space:pre-wrap;">' + (t.description || 'No description provided.') + '</div>',
            '</div>'
        ].join('');

        modal.style.display = 'flex';
    };

    window.viewQuoteDetails = function(quoteId) {
        if (!currentCustomer) return;
        var quotes = getCustomerQuotes(currentCustomer);
        var q = quotes.find(function(item){ return String(item.id) === String(quoteId) || String(item.quote_no) === String(quoteId); });
        if (!q) return;

        var modal = document.getElementById('cd-detail-view-modal');
        if (!modal) return;

        document.getElementById('cd-dvm-badge').textContent = 'QUOTATION';
        document.getElementById('cd-dvm-title').textContent = (q.quote_no || q.id || 'Teklif') + ' • ' + (q.company || currentCustomer.organization_name);

        var totalVal = typeof q.hdnGrandTotal === 'number' ? q.hdnGrandTotal : (q.total ? parseFloat(q.total) : 0);
        var totalStr = '£' + (isNaN(totalVal) ? '0.00' : totalVal.toFixed(2));

        document.getElementById('cd-dvm-content').innerHTML = [
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid #e2e8f0;">',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">QUOTE NO</div><div style="font-weight:700; color:#0f172a;">' + (q.quote_no || q.id) + '</div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">VALID TILL DATE</div><div style="font-weight:600; color:#0f172a;">' + (q.validtill || q.valid_till || '-') + '</div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">STATUS / STAGE</div><div><span style="display:inline-block; padding:0.15rem 0.5rem; font-family:monospace; font-size:0.65rem; font-weight:700; background:#f1f5f9; color:#1e293b; border-radius:3px;">' + (q.quotestage || q.status || 'Created').toUpperCase() + '</span></div></div>',
              '<div><div style="font-family:monospace; font-size:0.65rem; color:#64748b;">GENEL TOTAL</div><div style="font-family:monospace; font-weight:700; color:#059669; font-size:1.05rem;">' + totalStr + '</div></div>',
            '</div>',
            '<div style="margin-bottom:1rem;">',
              '<div style="font-family:monospace; font-size:0.65rem; color:#64748b; margin-bottom:0.25rem;">QUOTE SUBJECT</div>',
              '<div style="font-weight:600; color:#1e293b;">' + (q.subject || '-') + '</div>',
            '</div>',
            '<div>',
              '<div style="font-family:monospace; font-size:0.65rem; color:#64748b; margin-bottom:0.25rem;">PRODUCT / SERVICE AND ITEM DETAILS</div>',
              '<div style="background:#f8fafc; padding:0.85rem; border:1px solid #e2e8f0; border-radius:4px; font-size:0.85rem; color:#334155; white-space:pre-wrap;">' + (q.details || 'No item details provided.') + '</div>',
            '</div>'
        ].join('');

        modal.style.display = 'flex';
    };

    function set(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val || '-';
    }

    function hl(str, q) {
        if (!q || !str) return str;
        var safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        return str.replace(new RegExp('('+safe+')','gi'),'<mark style="background:rgba(255,200,0,0.45);padding:0;">$1</mark>');
    }

    // -- Clear search ----------------------------------------
    function clearSearch() {
        var input = document.getElementById('customer-search');
        if (input) { input.value = ''; input.focus(); }
        var cb = document.getElementById('customer-search-clear');
        if (cb) cb.style.display = 'none';
        applyFilters();
    }

    // -- Wire inputs -----------------------------------------
    function wireInputs() {
        var input = document.getElementById('customer-search');
        if (input) {
            input.addEventListener('input', function(){ applyFilters(); });
            input.addEventListener('keydown', function(e){ if(e.key==='Escape') clearSearch(); });
        }
    }

    function getDemoData() { return []; }

    // -- Globals ---------------------------------------------
    window.loadCustomers        = loadCustomers;
    window.applyCustomerFilters = applyFilters;
    window.clearCustomerSearch  = clearSearch;
    window.openCustomerDetail   = openDetail;
    window.closeCustomerDetail  = closeDetail;
    window.renderCustomerGrid   = function(){ applyFilters(); };

    // -- Init ------------------------------------------------
    function init() {
        wireInputs();
        loadCustomers();
        // ESC key closes panel & modals
        document.addEventListener('keydown', function(e){ 
            if(e.key==='Escape') {
                closeDetail();
                var m1 = document.getElementById('cd-ticket-modal');
                if (m1) m1.style.display = 'none';
                var m2 = document.getElementById('cd-quote-modal');
                if (m2) m2.style.display = 'none';
                var m3 = document.getElementById('cd-detail-view-modal');
                if (m3) m3.style.display = 'none';
            }
        });
        console.log('[Customers] Module ready with Tickets and Quotes tables.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
