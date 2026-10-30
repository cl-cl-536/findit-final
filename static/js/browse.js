/**
 * FindIt – Browse Items Module
 * Handles searching, type filtering, category filtering, and results rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  const itemsContainer = document.getElementById('browse-items-grid');
  const resultsCountEl = document.getElementById('results-count');
  const searchInput = document.getElementById('browse-search-input');
  const categorySelect = document.getElementById('browse-category-select');
  const statusSelect = document.getElementById('browse-status-select');
  const filterPills = document.querySelectorAll('.type-filter-pill');
  const resetBtn = document.getElementById('browse-reset-filters');

  let currentType = 'all'; // 'all', 'lost', 'found'
  let currentCategory = 'all';
  let currentStatus = 'all';
  let currentQuery = '';

  // Parse URL query parameters if navigated from home hero search or category links
  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('type')) {
      currentType = params.get('type').toLowerCase();
    }
    if (params.has('category')) {
      currentCategory = params.get('category');
      if (categorySelect) categorySelect.value = currentCategory;
    }
    if (params.has('q')) {
      currentQuery = params.get('q').trim();
      if (searchInput) searchInput.value = currentQuery;
    }

    // Sync type pill active state
    filterPills.forEach(pill => {
      const pillType = pill.getAttribute('data-type');
      if (pillType === currentType) {
        pill.classList.add('active');
        if (pillType === 'lost') pill.classList.add('active-lost');
        if (pillType === 'found') pill.classList.add('active-found');
      } else {
        pill.classList.remove('active', 'active-lost', 'active-found');
      }
    });
  }

  // Filter and display items
  function applyFilters() {
    const allItems = FindItApp.getItems();
    const query = (searchInput ? searchInput.value : currentQuery).toLowerCase().trim();
    const category = categorySelect ? categorySelect.value : currentCategory;
    const status = statusSelect ? statusSelect.value : currentStatus;

    const filtered = allItems.filter(item => {
      // Type match (all, lost, found)
      const matchesType = (currentType === 'all') || (item.type === currentType);

      // Category match
      const matchesCategory = (category === 'all') || (item.category.toLowerCase() === category.toLowerCase());

      // Status match
      const matchesStatus = (status === 'all') || (item.status === status);

      // Text search match (title, description, location)
      const matchesQuery = !query || 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query);

      return matchesType && matchesCategory && matchesStatus && matchesQuery;
    });

    renderItems(filtered);
  }

  function renderItems(items) {
    if (!itemsContainer) return;

    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${items.length} ${items.length === 1 ? 'item' : 'items'}`;
    }

    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3>No matching items found</h3>
          <p>We couldn't find any belongings matching your active search or filters. Try adjusting your query or resetting filters.</p>
          <button id="empty-reset-btn" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-rotate-left"></i> Reset Filters
          </button>
        </div>
      `;
      const emptyReset = document.getElementById('empty-reset-btn');
      if (emptyReset) {
        emptyReset.addEventListener('click', resetAllFilters);
      }
      return;
    }

    itemsContainer.innerHTML = items.map(item => FindItApp.renderItemCard(item)).join('');
  }

  function resetAllFilters() {
    currentType = 'all';
    currentCategory = 'all';
    currentStatus = 'all';
    currentQuery = '';

    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = 'all';
    if (statusSelect) statusSelect.value = 'all';

    filterPills.forEach(pill => {
      if (pill.getAttribute('data-type') === 'all') {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active', 'active-lost', 'active-found');
      }
    });

    // Clean URL bar
    window.history.replaceState({}, document.title, window.location.pathname);
    applyFilters();
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      applyFilters();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active', 'active-lost', 'active-found'));
      const pillType = pill.getAttribute('data-type');
      currentType = pillType;
      pill.classList.add('active');
      if (pillType === 'lost') pill.classList.add('active-lost');
      if (pillType === 'found') pill.classList.add('active-found');
      applyFilters();
    });
  });

  // Run on start
  readUrlParams();
  applyFilters();
});

