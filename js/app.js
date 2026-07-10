// 1. SETTINGS
const API_URL = 'https://sheetdb.io/api/v1/ihekm93q9pwgf'; 
let allAssets = []; 

// Custom modal to replace browser alert() with premium styling
function showModal(message, typeOrOnClose, onClose) {
    let type = 'success';
    let callback = onClose;

    if (typeof typeOrOnClose === 'function') {
        callback = typeOrOnClose;
    } else if (typeof typeOrOnClose === 'string') {
        type = typeOrOnClose;
    }

    // Auto-detect errors from message text
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('mismatch') || lowerMessage.includes('fill') || lowerMessage.includes('fail')) {
        type = 'error';
    }

    // Remove existing modal if any
    const existing = document.getElementById('custom-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(8px);animation:modalFadeIn 0.3s cubic-bezier(0.16,1,0.3,1) both;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#ffffff;border-radius:24px;padding:32px 24px 24px;max-width:340px;width:88%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.15);animation:modalScaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;';

    // SVG Icons
    let iconHtml = '';
    if (type === 'success') {
        iconHtml = `
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #d1fae5; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        `;
    } else {
        iconHtml = `
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: iconPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both, shake 0.5s ease-in-out;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>
        `;
    }

    const titleText = type === 'success' ? 'Pinjam Jap' : 'Attention';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:800;font-size:1.25rem;color:#0f172a;margin-bottom:8px;';
    title.textContent = titleText;

    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:0.95rem;color:#475569;margin-bottom:24px;line-height:1.5;font-weight:500;';
    msg.textContent = message;

    const btn = document.createElement('button');
    btn.textContent = 'OK';
    btn.style.cssText = 'background:#3b82f6;color:#ffffff;border:none;border-radius:14px;padding:14px 0;width:100%;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);';
    btn.onmouseenter = () => {
        btn.style.background = '#2563eb';
        btn.style.transform = 'translateY(-1px)';
    };
    btn.onmouseleave = () => {
        btn.style.background = '#3b82f6';
        btn.style.transform = 'none';
    };

    // Close function
    let didClose = false;
    const closeModal = () => {
        if (didClose) return;
        didClose = true;
        overlay.style.animation = 'modalFadeOut 0.2s ease both';
        modal.style.animation = 'modalScaleOut 0.2s ease both';
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 200);
    };

    btn.onclick = closeModal;

    modal.innerHTML = iconHtml;
    modal.appendChild(title);
    modal.appendChild(msg);
    modal.appendChild(btn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Auto-dismiss for success redirects after 2 seconds
    if (type === 'success' && callback) {
        setTimeout(closeModal, 2000);
    }

    // Add keyframes
    if (!document.getElementById('modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'modal-keyframes';
        style.textContent = `
            @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalFadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes modalScaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes modalScaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.9); opacity: 0; } }
            @keyframes iconPop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-6px); }
                40%, 80% { transform: translateX(6px); }
            }
        `;
        document.head.appendChild(style);
    }

    btn.focus();
}

// Helper: Force date formatting
function formatDate(value) {
    if (!value || value === "") return "Pending";
    if (!isNaN(value) && value > 30000) {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }
    return value;
}

// ===== 2. DISPLAY ASSET LIST (index.html) =====
async function loadAssets() {
    const listDiv = document.getElementById('asset-list');
    const searchInput = document.getElementById('asset-search');
    
    if (!listDiv) return;
    
    listDiv.innerHTML = "<p style='text-align:center;'>Loading assets...</p>";
    
    try {
        const res = await fetch(API_URL);
        allAssets = await res.json(); 
        
        displayAssets(allAssets); 

        // ADDED THIS CHECK: Only listen if searchInput exists on this page
        if (searchInput) {
            searchInput.oninput = (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = allAssets.filter(a => 
                    a.name.toLowerCase().includes(searchTerm) || 
                    a.id.toString().includes(searchTerm)
                );
                displayAssets(filtered);
            };
        }
    } catch (e) { 
        console.error("Load Error:", e);
        listDiv.innerHTML = "<p style='color:red; text-align:center;'>Error loading data.</p>"; 
    }
}

// THE MISSING FUNCTION - This is what draws the cards!
function displayAssets(assetsToDisplay) {
    const listDiv = document.getElementById('asset-list');
    if (!listDiv) return;

    if (assetsToDisplay.length === 0) {
        listDiv.innerHTML = "<p style='text-align:center; color:#888;'>No assets found.</p>";
        return;
    }

    listDiv.innerHTML = assetsToDisplay.map(a => `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 1.1em;">${a.name}</strong>
                <span class="badge ${a.status === 'available' ? 'available' : 'borrowed'}">
                    ${a.status}
                </span>
            </div>
            
            <a href="asset.html?id=${a.id}" style="text-decoration: none; color: #3b82f6; font-weight: bold; font-size: 0.9em;">
                Tap to View →
            </a>
        </div>
    `).join('');
}

// ===== 3. DETAIL & ACTIONS (asset.html) =====
async function handleAssetPage() {
    const infoDiv = document.getElementById('asset-info');
    if (!infoDiv) return;

    const params = new URLSearchParams(window.location.search);
    const assetId = params.get('id');
    
    try {
        const res = await fetch(`${API_URL}/search?id=${assetId}`);
        const data = await res.json();
        const asset = data[0];

        if (!asset) {
            infoDiv.innerHTML = "Asset not found!";
            return;
        }

        const borrowSec = document.getElementById('borrow-section');
        const returnSec = document.getElementById('return-section');
        
        infoDiv.innerHTML = `
            <h2 style="margin:0;">${asset.name}</h2>
            <p>Current Status: <strong style="color: ${asset.status === 'available' ? '#10b981' : '#f59e0b'}">${asset.status.toUpperCase()}</strong></p>
        `;

        if (asset.status === 'available') {
            borrowSec.style.display = 'block';
            document.getElementById('borrow-date').value = new Date().toISOString().split('T')[0];
        } else {
            returnSec.style.display = 'block';
            document.getElementById('borrower-display').innerText = `${asset.borrowerName} (Team: ${asset.team})`;
        }

        loadHistory(assetId);

document.getElementById('confirm-borrow-btn').onclick = async () => {
    const sId = document.getElementById('staff-id').value;
    const sName = document.getElementById('staff-name').value;
    const sTeam = document.getElementById('staff-team').value; // Get team
    const bDate = document.getElementById('borrow-date').value;

    if (!sId || !sName || !sTeam || !bDate) { showModal("Fill all fields including Team"); return; }

    await fetch(`${API_URL}/id/${assetId}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            data: { 
                status: 'borrowed', 
                staffId: sId, 
                borrowerName: sName, 
                team: sTeam, // Save team to main sheet
                date: bDate, 
                returnDate: '' 
            } 
        })
    });
    showModal("Borrowed!", () => location.reload());
};

document.getElementById('return-btn').onclick = async () => {
    const verifyId = document.getElementById('verify-staff-id').value;
    const today = new Date().toISOString().split('T')[0];

    if (verifyId.trim() === asset.staffId.toString().trim()) {
        await fetch(`${API_URL}/id/${assetId}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: { status: 'available', returnDate: today } })
        });

        await fetch(`${API_URL}?sheet=history`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                data: [{
                    id: assetId,
                    name: asset.name,
                    staffId: asset.staffId,
                    borrowerName: asset.borrowerName,
                    team: asset.team, // Log team to history
                    date: asset.date,
                    returnDate: today
                }]
            })
        });
        showModal("Returned!", () => location.reload());
    } else {
        showModal("Staff ID mismatch!");
    }
};

    } catch (err) { infoDiv.innerHTML = "Error loading details."; }
}

// ===== 4. LOAD HISTORY =====
async function loadHistory(assetId) {
    const historyDiv = document.getElementById('history-list');
    if (!historyDiv) return;

    try {
        const res = await fetch(`${API_URL}/search?id=${assetId}&sheet=history`);
        const logs = await res.json();

        if (!Array.isArray(logs) || logs.length === 0) {
            historyDiv.innerHTML = "<p style='text-align:center; color:#888;'>No history records found.</p>";
            return;
        }

        const recentLogs = logs.reverse().slice(0, 2);

// Inside loadHistory function mapping

historyDiv.innerHTML = recentLogs.map(log => `
    <div class="history-item">
        <div style="font-weight: 700;">${log.borrowerName}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">
            ${log.team} • ID: ${log.staffId}
        </div>
        <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600;">
            ${formatDate(log.date)} — ${formatDate(log.returnDate)}
        </div>
    </div>
`).join('');
    } catch (e) {
        historyDiv.innerHTML = "<p style='color:red;'>History sync error.</p>";
    }
}

// START EVERYTHING
loadAssets();
handleAssetPage();