// 1. SETTINGS
const API_URL = 'https://sheetdb.io/api/v1/ihekm93q9pwgf'; 
let allAssets = []; 

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

    if (!sId || !sName || !sTeam || !bDate) return alert("Fill all fields including Team");

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
    alert("Borrowed!");
    location.reload();
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
        alert("Returned!");
        location.reload();
    } else {
        alert("Staff ID mismatch!");
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