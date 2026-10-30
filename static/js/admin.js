/**
 * FindIt – Administrator Module
 * Campus administrator dashboard for supervising lost/found reports, status updates & moderation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const adminSearch = document.getElementById('admin-search');
  const adminTypeFilter = document.getElementById('admin-type-filter');
  const adminStatusFilter = document.getElementById('admin-status-filter');
  const adminTbody = document.getElementById('admin-reports-tbody');
  const deleteModal = document.getElementById('admin-delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const deleteItemTitleEl = document.getElementById('delete-item-title');

  let itemPendingDelete = null;

  function loadAdminDashboard() {
    updateAdminStats();
    renderAdminTable();
  }

  function updateAdminStats() {
    const items = FindItApp.getItems();
    const total = items.length;
    const lost = items.filter(i => i.type === 'lost').length;
    const found = items.filter(i => i.type === 'found').length;
    const returned = items.filter(i => i.status === 'returned').length;

    const elTotal = document.getElementById('admin-stat-total');
    const elLost = document.getElementById('admin-stat-lost');
    const elFound = document.getElementById('admin-stat-found');
    const elReturned = document.getElementById('admin-stat-returned');

    if (elTotal) elTotal.textContent = total;
    if (elLost) elLost.textContent = lost;
    if (elFound) elFound.textContent = found;
    if (elReturned) elReturned.textContent = returned;
  }

  function renderAdminTable() {
    if (!adminTbody) return;

    const allItems = FindItApp.getItems();
    const query = adminSearch ? adminSearch.value.toLowerCase().trim() : '';
    const typeFilter = adminTypeFilter ? adminTypeFilter.value : 'all';
    const statusFilter = adminStatusFilter ? adminStatusFilter.value : 'all';

    const filtered = allItems.filter(item => {
      const matchesType = (typeFilter === 'all') || (item.type === typeFilter);
      const matchesStatus = (statusFilter === 'all') || (item.status === statusFilter);
      const matchesQuery = !query ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.contactName.toLowerCase().includes(query) ||
        (item.contactEmail && item.contactEmail.toLowerCase().includes(query));

      return matchesType && matchesStatus && matchesQuery;
    });

    if (filtered.length === 0) {
      adminTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            No reports match the current administrative filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    adminTbody.innerHTML = filtered.map(item => {
      const isLost = item.type === 'lost';
      const typeBadge = isLost 
        ? `<span class="badge badge-lost">Lost</span>` 
        : `<span class="badge badge-found">Found</span>`;

      return `
        <tr>
          <td>
            <div class="table-item-cell">
              <img src="${item.image || 'assets/images/headphones.svg'}" alt="${item.title}" class="table-thumb" onerror="this.src='assets/images/headphones.svg'">
              <div>
                <strong style="color: var(--primary);">${item.title}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${item.category} • ID: ${item.id}</div>
              </div>
            </div>
          </td>
          <td>${typeBadge}</td>
          <td>
            <div style="font-size: 0.85rem; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${item.location}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${FindItApp.formatDate(item.date)}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem; font-weight: 600;">${item.contactName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.contactEmail}</div>
          </td>
          <td>
            <select class="status-select admin-status-changer" data-id="${item.id}">
              <option value="active" ${item.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="returned" ${item.status === 'returned' ? 'selected' : ''}>Returned</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <a href="item-details.html?id=${item.id}" class="btn btn-sm btn-outline" title="Inspect full item details">
                <i class="fa-regular fa-eye"></i>
              </a>
              <button class="btn btn-sm btn-outline admin-delete-btn" data-id="${item.id}" data-title="${item.title}" style="color: var(--lost-text);" title="Delete report">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach status changer listeners
    const statusSelects = adminTbody.querySelectorAll('.admin-status-changer');
    statusSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const itemId = select.getAttribute('data-id');
        const newStatus = select.value;
        FindItApp.updateItem(itemId, { status: newStatus });
        FindItApp.showToast(`Status updated to "${newStatus.toUpperCase()}"`, 'success');
        updateAdminStats();
      });
    });

    // Attach delete report listeners
    const deleteBtns = adminTbody.querySelectorAll('.admin-delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        itemPendingDelete = id;
        if (deleteItemTitleEl) deleteItemTitleEl.textContent = title;
        if (deleteModal) deleteModal.classList.add('show');
      });
    });
  }

  // Delete modal buttons
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (itemPendingDelete) {
        FindItApp.deleteItem(itemPendingDelete);
        FindItApp.showToast('Report deleted successfully.', 'success');
        itemPendingDelete = null;
        if (deleteModal) deleteModal.classList.remove('show');
        loadAdminDashboard();
      }
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
      itemPendingDelete = null;
      if (deleteModal) deleteModal.classList.remove('show');
    });
  }

  // Filter Listeners
  if (adminSearch) adminSearch.addEventListener('input', renderAdminTable);
  if (adminTypeFilter) adminTypeFilter.addEventListener('change', renderAdminTable);
  if (adminStatusFilter) adminStatusFilter.addEventListener('change', renderAdminTable);

  loadAdminDashboard();
});

