/**
 * FindIt – User Dashboard Module
 * Displays user's submitted reports, summary metrics, and status management.
 */

document.addEventListener('DOMContentLoaded', () => {
  let user = FindItApp.getCurrentUser();

  // If no user is logged in, default to the demo student Jordan Smith for immediate college demonstration
  if (!user) {
    user = {
      name: 'Jordan Smith',
      email: 'student@campus.edu',
      role: 'Student',
      studentId: 'ST-2024-912'
    };
    FindItApp.setCurrentUser(user);
    FindItApp.showToast('Logged in as demo student Jordan Smith', 'success');
  }

  // Update user profile info in sidebar & header
  const userNameEl = document.getElementById('dash-user-name');
  const userEmailEl = document.getElementById('dash-user-email');
  const userGreetingEl = document.getElementById('dash-user-greeting');
  const userAvatarEl = document.getElementById('dash-user-avatar');

  if (userNameEl) userNameEl.textContent = user.name;
  if (userEmailEl) userEmailEl.textContent = user.email;
  if (userGreetingEl) userGreetingEl.textContent = user.name.split(' ')[0];
  if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Logout handler in sidebar
  const logoutLinks = document.querySelectorAll('.action-logout');
  logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      FindItApp.logout();
    });
  });

  // Load and render user reports
  loadUserDashboard();

  function loadUserDashboard() {
    const allItems = FindItApp.getItems();
    
    // User's reports: match reporterEmail or contactEmail or contactName
    const userReports = allItems.filter(item => {
      return (item.reporterEmail && item.reporterEmail.toLowerCase() === user.email.toLowerCase()) ||
             (item.contactEmail && item.contactEmail.toLowerCase() === user.email.toLowerCase()) ||
             (item.contactName && item.contactName.toLowerCase() === user.name.toLowerCase());
    });

    // Update Counters
    const totalReports = userReports.length;
    const lostCount = userReports.filter(i => i.type === 'lost').length;
    const foundCount = userReports.filter(i => i.type === 'found').length;
    const returnedCount = userReports.filter(i => i.status === 'returned').length;

    const elTotal = document.getElementById('user-stat-total');
    const elLost = document.getElementById('user-stat-lost');
    const elFound = document.getElementById('user-stat-found');
    const elReturned = document.getElementById('user-stat-returned');

    if (elTotal) elTotal.textContent = totalReports;
    if (elLost) elLost.textContent = lostCount;
    if (elFound) elFound.textContent = foundCount;
    if (elReturned) elReturned.textContent = returnedCount;

    // Render User Reports Table
    const tableBody = document.getElementById('user-reports-tbody');
    const emptyState = document.getElementById('user-reports-empty');
    const reportsTable = document.getElementById('user-reports-table');

    if (!tableBody) return;

    if (userReports.length === 0) {
      if (reportsTable) reportsTable.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (reportsTable) reportsTable.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = userReports.map(item => {
      const isLost = item.type === 'lost';
      const typeBadge = isLost 
        ? `<span class="badge badge-lost">Lost</span>` 
        : `<span class="badge badge-found">Found</span>`;

      let statusBadge = '';
      if (item.status === 'returned') {
        statusBadge = `<span class="badge badge-returned"><i class="fa-solid fa-check"></i> Returned</span>`;
      } else if (item.status === 'pending') {
        statusBadge = `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
      } else {
        statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-bolt"></i> Active</span>`;
      }

      const returnActionBtn = item.status !== 'returned'
        ? `<button class="btn btn-sm btn-outline-primary mark-returned-btn" data-id="${item.id}" title="Mark this item as resolved/returned">
             <i class="fa-solid fa-check-double"></i> Mark Returned
           </button>`
        : `<span class="text-muted" style="font-size: 0.8rem;"><i class="fa-solid fa-circle-check" style="color: var(--found-text);"></i> Resolved</span>`;

      return `
        <tr>
          <td>
            <div class="table-item-cell">
              <img src="${item.image || 'assets/images/headphones.svg'}" alt="${item.title}" class="table-thumb" onerror="this.src='assets/images/headphones.svg'">
              <div>
                <strong style="color: var(--primary);">${item.title}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${item.category}</div>
              </div>
            </div>
          </td>
          <td>${typeBadge}</td>
          <td>
            <div style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <i class="fa-solid fa-location-dot" style="color: var(--secondary); margin-right: 4px;"></i>${item.location}
            </div>
          </td>
          <td>${FindItApp.formatDate(item.date)}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <a href="item-details.html?id=${item.id}" class="btn btn-sm btn-outline" title="View details">
                <i class="fa-regular fa-eye"></i> View
              </a>
              ${returnActionBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach mark as returned listener
    const markButtons = tableBody.querySelectorAll('.mark-returned-btn');
    markButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = btn.getAttribute('data-id');
        FindItApp.updateItem(itemId, { status: 'returned' });
        FindItApp.showToast('Item marked as Returned and safely resolved!', 'success');
        loadUserDashboard();
      });
    });
  }
});

