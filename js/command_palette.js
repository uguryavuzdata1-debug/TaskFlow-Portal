// ============================================================
// TASKFLOW GLOBAL COMMAND PALETTE / QUICK SEARCH (Ctrl + K)
// ============================================================
(function() {
    'use strict';

    let selectedIndex = 0;
    let searchResults = [];

    function createPaletteModal() {
        if (document.getElementById('taskflow-command-palette')) return;

        const overlay = document.createElement('div');
        overlay.id = 'taskflow-command-palette';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(6px);
            z-index: 10000;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding-top: 10vh;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="background: #ffffff; width: 100%; max-width: 620px; border-radius: 16px; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.3); border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column;">
                <!-- Header / Input -->
                <div style="display: flex; align-items: center; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; gap: 12px; background: #ffffff;">
                    <span style="font-size: 1.25rem; color: #64748b;">🔍</span>
                    <input type="text" id="cp-search-input" placeholder="Müşteri adı, telefon, posta kodu veya AnyDesk ara..." 
                           style="flex: 1; border: none !important; outline: none !important; font-size: 1rem; color: #0f172a; background: transparent !important; padding: 0 !important;" />
                    <span style="font-size: 0.72rem; padding: 2px 7px; border: 1px solid #cbd5e1; border-radius: 6px; color: #64748b; font-family: monospace;">ESC</span>
                </div>
                
                <!-- Results List -->
                <div id="cp-results-list" style="max-height: 380px; overflow-y: auto; padding: 8px;">
                    <div style="padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                        Aramak için müşteri adı, telefon veya posta kodu yazın...
                    </div>
                </div>

                <!-- Footer Hint -->
                <div style="padding: 10px 16px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #64748b;">
                    <div style="display: flex; gap: 14px;">
                        <span><kbd style="padding: 1px 5px; background: #e2e8f0; border-radius: 4px;">↑</kbd> <kbd style="padding: 1px 5px; background: #e2e8f0; border-radius: 4px;">↓</kbd> Gezin</span>
                        <span><kbd style="padding: 1px 5px; background: #e2e8f0; border-radius: 4px;">Enter</kbd> Seç & Aç</span>
                        <span><kbd style="padding: 1px 5px; background: #e2e8f0; border-radius: 4px;">Esc</kbd> Kapat</span>
                    </div>
                    <span>TaskFlow Quick Search</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Click outside closes
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePalette();
        });

        // Search input handling
        const input = document.getElementById('cp-search-input');
        input.addEventListener('input', function() {
            handleSearch(input.value.trim());
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                moveSelection(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                moveSelection(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectCurrentItem();
            } else if (e.key === 'Escape') {
                closePalette();
            }
        });
    }

    function openPalette() {
        createPaletteModal();
        const overlay = document.getElementById('taskflow-command-palette');
        const input = document.getElementById('cp-search-input');
        if (overlay) {
            overlay.style.display = 'flex';
            if (input) {
                input.value = '';
                input.focus();
                handleSearch('');
            }
        }
    }

    function closePalette() {
        const overlay = document.getElementById('taskflow-command-palette');
        if (overlay) overlay.style.display = 'none';
    }

    function handleSearch(query) {
        const container = document.getElementById('cp-results-list');
        if (!container) return;

        selectedIndex = 0;
        searchResults = [];

        const allCustomers = (window.appState && window.appState.customers) ? window.appState.customers : [];

        if (!query) {
            // Show recent / top customers
            searchResults = allCustomers.slice(0, 7);
        } else {
            const q = query.toLowerCase();
            searchResults = allCustomers.filter(c => {
                const name = (c.organization_name || '').toLowerCase();
                const phone = (c.primary_phone || '').toLowerCase();
                const num = (c.organization_number || '').toLowerCase();
                const pc = (c.billing_postal_code || '').toLowerCase();
                const city = (c.billing_city || '').toLowerCase();
                return name.includes(q) || phone.includes(q) || num.includes(q) || pc.includes(q) || city.includes(q);
            }).slice(0, 10);
        }

        renderResults();
    }

    function renderResults() {
        const container = document.getElementById('cp-results-list');
        if (!container) return;

        if (searchResults.length === 0) {
            container.innerHTML = `
                <div style="padding: 2.5rem 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                    Eşleşen müşteri bulunamadı.
                </div>
            `;
            return;
        }

        container.innerHTML = searchResults.map((c, idx) => {
            const isSelected = idx === selectedIndex;
            const bg = isSelected ? 'rgba(27, 67, 118, 0.08)' : 'transparent';
            const border = isSelected ? '1px solid rgba(27, 67, 118, 0.25)' : '1px solid transparent';
            const name = c.organization_name || 'İsimsiz Müşteri';
            const phone = c.primary_phone || '';
            const pc = c.billing_postal_code || '';
            const status = c.contract_status || 'No Contract';
            const isActive = status.toLowerCase().includes('active');

            return `
                <div class="cp-result-item" data-idx="${idx}" 
                     style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: ${bg}; border: ${border}; transition: all 0.15s ease;">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                        <div style="width: 34px; height: 34px; border-radius: 8px; background: #e2e8f0; color: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
                            ${name[0].toUpperCase()}
                        </div>
                        <div style="min-width: 0;">
                            <div style="font-weight: 600; font-size: 0.9rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${name}
                            </div>
                            <div style="font-size: 0.75rem; color: #64748b; font-family: monospace; display: flex; gap: 8px;">
                                ${phone ? `<span>📞 ${phone}</span>` : ''}
                                ${pc ? `<span>📍 ${pc}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 0.68rem; padding: 3px 8px; border-radius: 12px; font-weight: 600; border: 1px solid ${isActive ? '#22c55e' : '#cbd5e1'}; color: ${isActive ? '#166534' : '#64748b'}; background: ${isActive ? 'rgba(34,197,94,0.1)' : '#f8fafc'};">
                            ${status.toUpperCase()}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click events to items
        const items = container.querySelectorAll('.cp-result-item');
        items.forEach((item, idx) => {
            item.addEventListener('mouseenter', () => {
                selectedIndex = idx;
                renderResults();
            });
            item.addEventListener('click', () => {
                selectedIndex = idx;
                selectCurrentItem();
            });
        });
    }

    function moveSelection(direction) {
        if (searchResults.length === 0) return;
        selectedIndex += direction;
        if (selectedIndex < 0) selectedIndex = searchResults.length - 1;
        if (selectedIndex >= searchResults.length) selectedIndex = 0;
        renderResults();

        // Scroll selected item into view
        const container = document.getElementById('cp-results-list');
        const items = container ? container.querySelectorAll('.cp-result-item') : null;
        if (items && items[selectedIndex]) {
            items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    function selectCurrentItem() {
        const c = searchResults[selectedIndex];
        if (!c) return;

        closePalette();

        // Switch to customers tab
        if (typeof window.showTab === 'function') {
            window.showTab('customers');
        }

        // Open customer detail
        const all = (window.appState && window.appState.customers) ? window.appState.customers : [];
        const originalIndex = all.findIndex(x => String(x.id) === String(c.id));
        if (originalIndex !== -1 && typeof window.openCustomerDetail === 'function') {
            window.openCustomerDetail(originalIndex);
        }
    }

    // Global Keydown Listener (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            const modal = document.getElementById('taskflow-command-palette');
            if (modal && modal.style.display === 'flex') {
                closePalette();
            } else {
                openPalette();
            }
        }
    });

    window.openCommandPalette = openPalette;
    window.closeCommandPalette = closePalette;
    console.log('[INIT] Command Palette loaded (Ctrl+K / Cmd+K).');
})();
