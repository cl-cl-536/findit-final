/**
 * FindIt – Cloud-Based Lost & Found Management System
 * Shared Core Application Module (Storage, Seed Data, Auth State & Utilities)
 */

const FindItApp = (() => {
  const STORAGE_KEYS = {
    ITEMS: 'findit_items',
    USERS: 'findit_users',
    CURRENT_USER: 'findit_current_user'
  };

  // Realistic sample items pre-loaded for campus demonstration
  const INITIAL_SAMPLE_ITEMS = [
    {
      id: 'item-101',
      title: 'Black Wireless Headphones',
      category: 'Electronics',
      type: 'lost',
      status: 'active',
      location: 'Central Library, 2nd Floor Study Cubicle 14',
      date: '2026-10-28',
      description: 'Sony WH-1000XM4 matte black over-ear noise cancelling headphones. Has a small scratch near the left hinge and includes a zippered black protective case.',
      contactName: 'Jordan Smith',
      contactEmail: 'student@campus.edu',
      contactPhone: '+1 (555) 234-5678',
      image: 'assets/images/headphones.svg',
      createdAt: '2026-10-28T09:30:00Z'
    },
    {
      id: 'item-102',
      title: 'Blue Water Bottle',
      category: 'Accessories',
      type: 'found',
      status: 'active',
      location: 'Engineering Block C, Cafeteria Corner Table',
      date: '2026-10-29',
      description: '32oz hydro-insulated vacuum bottle in cobalt blue with a black twist lid and carry loop. Has a campus robotics club sticker on the front.',
      contactName: 'Campus Security Desk',
      contactEmail: 'security@campus.edu',
      contactPhone: '+1 (555) 890-1234',
      image: 'assets/images/waterbottle.svg',
      createdAt: '2026-10-29T14:15:00Z'
    },
    {
      id: 'item-103',
      title: 'Student ID Card',
      category: 'ID Cards',
      type: 'found',
      status: 'active',
      location: 'Auditorium Main Entrance Lobby',
      date: '2026-10-29',
      description: 'Official College Identity Card belonging to Alex Chen, Department of Computer Science (Roll ID: #CS2024-884). Attached to a blue campus ribbon lanyard.',
      contactName: 'Lost & Found Center',
      contactEmail: 'lostfound@campus.edu',
      contactPhone: '+1 (555) 345-6789',
      image: 'assets/images/idcard.svg',
      createdAt: '2026-10-29T11:00:00Z'
    },
    {
      id: 'item-104',
      title: 'Brown Leather Wallet',
      category: 'Accessories',
      type: 'lost',
      status: 'active',
      location: 'Sports Complex Bleachers near Court 2',
      date: '2026-10-27',
      description: 'Fossil bi-fold dark brown leather wallet. Contains college metro card, driver license, and campus library pass. Great sentimental value.',
      contactName: 'Jordan Smith',
      contactEmail: 'student@campus.edu',
      contactPhone: '+1 (555) 234-5678',
      image: 'assets/images/wallet.svg',
      createdAt: '2026-10-27T16:45:00Z'
    },
    {
      id: 'item-105',
      title: 'Laptop Charger',
      category: 'Electronics',
      type: 'found',
      status: 'returned',
      location: 'Lab 304, Computer Science Block',
      date: '2026-10-26',
      description: 'Dell 65W USB-C power adapter with long rubber cable wrap and indicator light. Left plugged into row 3 power strip.',
      contactName: 'Lab Assistant Mark',
      contactEmail: 'lab304@campus.edu',
      contactPhone: '+1 (555) 456-7890',
      image: 'assets/images/charger.svg',
      createdAt: '2026-10-26T17:20:00Z'
    },
    {
      id: 'item-106',
      title: 'College Backpack',
      category: 'Bags',
      type: 'lost',
      status: 'active',
      location: 'Student Center Lounge, 1st Floor',
      date: '2026-10-28',
      description: 'North Face heather grey daypack with black trim. Contains 2 engineering spiral notebooks, graph paper, and a Casio scientific calculator.',
      contactName: 'Samantha Ray',
      contactEmail: 'samantha.ray@campus.edu',
      contactPhone: '+1 (555) 567-8901',
      image: 'assets/images/backpack.svg',
      createdAt: '2026-10-28T13:10:00Z'
    },
    {
      id: 'item-107',
      title: 'Calculus Textbook',
      category: 'Books',
      type: 'found',
      status: 'active',
      location: 'Lecture Hall B, Row G Seat 12',
      date: '2026-10-29',
      description: 'Stewart Calculus Early Transcendentals 9th Edition. Blue hardback with red ribbon bookmark and handwritten notes in chapter 4.',
      contactName: 'Prof. Miller Office',
      contactEmail: 'mathdept@campus.edu',
      contactPhone: '+1 (555) 678-9012',
      image: 'assets/images/textbook.svg',
      createdAt: '2026-10-29T10:00:00Z'
    },
    {
      id: 'item-108',
      title: 'Campus Keys with Lanyard',
      category: 'Other',
      type: 'lost',
      status: 'pending',
      location: 'North Parking Lot Bay 4 near Bike Racks',
      date: '2026-10-27',
      description: 'Set of 3 keys including a Toyota car key fob and campus dorm key, on a navy blue lanyard with yellow campus lettering.',
      contactName: 'Jordan Smith',
      contactEmail: 'student@campus.edu',
      contactPhone: '+1 (555) 234-5678',
      image: 'assets/images/keys.svg',
      createdAt: '2026-10-27T08:15:00Z'
    }
  ];

  const INITIAL_USERS = [
    {
      name: 'Jordan Smith',
      email: 'student@campus.edu',
      password: 'student123',
      role: 'Student',
      studentId: 'ST-2024-912'
    },
    {
      name: 'Campus Administrator',
      email: 'admin@campus.edu',
      password: 'admin123',
      role: 'Administrator',
      studentId: 'FAC-001'
    }
  ];

  // Initialize data into localStorage if empty
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_SAMPLE_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }

  // Items API
  function getItems() {
    initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS)) || [];
    } catch (e) {
      console.error('Error reading items from localStorage', e);
      return [];
    }
  }

  function getItemById(id) {
    const items = getItems();
    return items.find(item => item.id === id) || null;
  }

  function saveItem(itemData) {
    const items = getItems();
    const newItem = {
      ...itemData,
      id: 'item-' + Date.now(),
      status: itemData.status || 'active',
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return newItem;
  }

  function updateItem(id, updates) {
    const items = getItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  function deleteItem(id) {
    let items = getItems();
    items = items.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return true;
  }

  // Auth API
  function getUsers() {
    initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  }

  function getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    setupNavbar();
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (user) {
      const safeUser = { name: user.name, email: user.email, role: user.role, studentId: user.studentId };
      setCurrentUser(safeUser);
      return { success: true, user: safeUser };
    }
    return { success: false, message: 'Invalid email or password.' };
  }

  function register(userData) {
    const users = getUsers();
    const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: 'An account with this campus email already exists.' };
    }
    const newUser = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'Student',
      studentId: userData.studentId || 'ST-' + Math.floor(1000 + Math.random() * 9000)
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Auto sign-in
    const safeUser = { name: newUser.name, email: newUser.email, role: newUser.role, studentId: newUser.studentId };
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  }

  function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
  }

  // Formatting helpers
  function formatDate(dateString) {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'Electronics': return 'fa-solid fa-laptop';
      case 'Accessories': return 'fa-solid fa-gem';
      case 'Books': return 'fa-solid fa-book';
      case 'ID Cards': return 'fa-solid fa-id-card';
      case 'Bags': return 'fa-solid fa-bag-shopping';
      default: return 'fa-solid fa-box-archive';
    }
  }

  // Toast notification
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Dynamic Navbar Auth sync & mobile menu
  function setupNavbar() {
    const navActions = document.getElementById('nav-actions');
    const user = getCurrentUser();

    if (navActions) {
      if (user) {
        navActions.innerHTML = `
          <a href="dashboard.html" class="user-menu-btn" title="View My Dashboard">
            <span class="avatar">${user.name.charAt(0).toUpperCase()}</span>
            <span>${user.name.split(' ')[0]}</span>
          </a>
          <a href="dashboard.html" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-gauge"></i> Dashboard
          </a>
          <button id="nav-logout-btn" class="btn btn-sm btn-outline" style="color: var(--lost-text);" title="Log out">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        `;
        const logoutBtn = document.getElementById('nav-logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
          });
        }
      } else {
        navActions.innerHTML = `
          <a href="login.html" class="btn btn-outline btn-sm">
            <i class="fa-regular fa-user"></i> Log In
          </a>
          <a href="register.html" class="btn btn-primary btn-sm">
            Sign Up
          </a>
        `;
      }
    }

    // Highlight active link in navbar
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        if (navActions) navActions.classList.toggle('open');
      });
    }
  }

  // Update statistics elements across pages if they exist
  function updateGlobalStats() {
    const items = getItems();
    const totalCount = items.length;
    const foundCount = items.filter(i => i.type === 'found').length;
    const lostCount = items.filter(i => i.type === 'lost').length;
    const returnedCount = items.filter(i => i.status === 'returned').length;

    const elTotal = document.getElementById('stat-total');
    const elFound = document.getElementById('stat-found');
    const elLost = document.getElementById('stat-lost');
    const elReturned = document.getElementById('stat-returned');

    if (elTotal) elTotal.textContent = totalCount;
    if (elFound) elFound.textContent = foundCount;
    if (elLost) elLost.textContent = lostCount;
    if (elReturned) elReturned.textContent = returnedCount;
  }

  // Render standard item card HTML
  function renderItemCard(item) {
    const isLost = item.type === 'lost';
    const typeBadge = isLost 
      ? `<span class="badge badge-lost"><i class="fa-solid fa-circle-exclamation"></i> Lost</span>` 
      : `<span class="badge badge-found"><i class="fa-solid fa-circle-check"></i> Found</span>`;
    
    let statusBadge = '';
    if (item.status === 'returned') {
      statusBadge = `<span class="badge badge-returned"><i class="fa-solid fa-check"></i> Returned</span>`;
    } else if (item.status === 'pending') {
      statusBadge = `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
    } else {
      statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-bolt"></i> Active</span>`;
    }

    const catIcon = getCategoryIcon(item.category);

    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-card-media">
          <img src="${item.image || 'assets/images/headphones.svg'}" alt="${item.title}" onerror="this.src='assets/images/headphones.svg'">
          <div class="item-badge-type">${typeBadge}</div>
          <div class="item-badge-category">
            <span class="badge badge-category"><i class="${catIcon}"></i> ${item.category}</span>
          </div>
        </div>
        <div class="item-card-body">
          <h3 class="item-card-title">${item.title}</h3>
          <p class="item-card-desc">${item.description}</p>
          <div class="item-card-meta">
            <div class="meta-row">
              <i class="fa-solid fa-location-dot"></i>
              <span>${item.location}</span>
            </div>
            <div class="meta-row">
              <i class="fa-regular fa-calendar"></i>
              <span>${formatDate(item.date)}</span>
            </div>
          </div>
          <div class="item-card-footer">
            ${statusBadge}
            <a href="item-details.html?id=${item.id}" class="btn btn-outline btn-sm">
              View Details <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Auto initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    setupNavbar();
    updateGlobalStats();
  });

  return {
    getItems,
    getItemById,
    saveItem,
    updateItem,
    deleteItem,
    getUsers,
    getCurrentUser,
    setCurrentUser,
    login,
    register,
    logout,
    formatDate,
    getCategoryIcon,
    showToast,
    setupNavbar,
    updateGlobalStats,
    renderItemCard
  };
})();

