let allData = [];

async function load() {
  document.getElementById('tableContainer').innerHTML =
    '<div class="loading"><span class="spinner"></span>Loading…</div>';
  try {
    const res = await fetch('/api/submissions');
    allData = await res.json();
    updateStats();
    populateFilter();
    renderTable();
    document.getElementById('leadCount').textContent =
      allData.length + ' lead' + (allData.length !== 1 ? 's' : '');
  } catch {
    document.getElementById('tableContainer').innerHTML =
      '<div class="empty"><p>Failed to load submissions.</p></div>';
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allData.length;

  const week = allData.filter(r => {
    return (Date.now() - new Date(r.created_at).getTime()) < 7 * 86400 * 1000;
  }).length;
  document.getElementById('statWeek').textContent = week;

  const freq = {};
  allData.forEach(r => { if (r.service) freq[r.service] = (freq[r.service] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('statTop').textContent = top ? top[0] : '—';
}

function populateFilter() {
  const services = [...new Set(allData.map(r => r.service).filter(Boolean))].sort();
  const sel = document.getElementById('filterService');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All services</option>' +
    services.map(s => `<option value="${esc(s)}"${s === cur ? ' selected' : ''}>${esc(s)}</option>`).join('');
}

function renderTable() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const svc = document.getElementById('filterService').value;
  const rows = allData.filter(r => {
    const match = !q || [r.name, r.email, r.message, r.service].some(v => v && v.toLowerCase().includes(q));
    const svcMatch = !svc || r.service === svc;
    return match && svcMatch;
  });

  if (!rows.length) {
    document.getElementById('tableContainer').innerHTML = `
      <div class="empty">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="12" width="32" height="26" rx="4" stroke="#12181F" stroke-width="2"/>
          <path d="M8 18h32M16 8v8M32 8v8" stroke="#12181F" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h3>${allData.length ? 'No results' : 'No submissions yet'}</h3>
        <p>${allData.length ? 'Try a different search or filter.' : 'Submissions from the contact form will appear here.'}</p>
      </div>`;
    return;
  }

  document.getElementById('tableContainer').innerHTML = `
    <table>
      <thead><tr>
        <th>Name</th><th>Email</th><th>Service</th><th>Message</th><th>Date</th><th></th>
      </tr></thead>
      <tbody>${rows.map(buildRow).join('')}</tbody>
    </table>`;
}

function buildRow(r) {
  const d = new Date(r.created_at);
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `<tr id="row-${r.id}">
    <td class="name">${esc(r.name)}</td>
    <td class="email"><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td>
    <td class="service">${r.service ? `<span>${esc(r.service)}</span>` : '<span style="opacity:.4">—</span>'}</td>
    <td class="message">${r.message ? esc(r.message).substring(0, 120) + (r.message.length > 120 ? '…' : '') : '<span style="opacity:.4">—</span>'}</td>
    <td class="date">${dateStr}<br><span style="opacity:.6">${timeStr}</span></td>
    <td><button class="btn-delete" onclick="del(${r.id})">Delete</button></td>
  </tr>`;
}

async function del(id) {
  if (!confirm('Delete this submission?')) return;
  await fetch('/api/submissions/' + id, { method: 'DELETE' });
  allData = allData.filter(r => r.id !== id);
  updateStats();
  populateFilter();
  renderTable();
  document.getElementById('leadCount').textContent =
    allData.length + ' lead' + (allData.length !== 1 ? 's' : '');
}

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

load();
