/**
 * FindIt – Forms Module
 * Handles Report Lost and Report Found forms, image preview, validation & submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  const lostForm = document.getElementById('report-lost-form');
  const foundForm = document.getElementById('report-found-form');
  const imageInput = document.getElementById('item-image');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreviewEl = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const uploadArea = document.getElementById('file-upload-area');
  const successModal = document.getElementById('report-success-modal');
  const closeModalBtns = document.querySelectorAll('.modal-close, .modal-close-action');

  let currentImageDataUrl = '';

  // Pre-fill user contact info if user is logged in
  const currentUser = FindItApp.getCurrentUser();
  if (currentUser) {
    const contactNameInput = document.getElementById('contact-name');
    const contactEmailInput = document.getElementById('contact-email');
    if (contactNameInput && !contactNameInput.value) contactNameInput.value = currentUser.name;
    if (contactEmailInput && !contactEmailInput.value) contactEmailInput.value = currentUser.email;
  }

  // Pre-fill today's date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('item-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  // Image Upload Handling
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      handleFileSelected(file);
    });
  }

  if (uploadArea) {
    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
      }, false);
    });

    uploadArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      handleFileSelected(file);
    });
  }

  function handleFileSelected(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      FindItApp.showToast('Please select a valid image file (PNG, JPG, SVG)', 'error');
      return;
    }

    // Limit size to ~3MB for localStorage capacity
    if (file.size > 3 * 1024 * 1024) {
      FindItApp.showToast('Image size exceeds 3MB. Please select a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      currentImageDataUrl = event.target.result;
      if (imagePreviewEl) imagePreviewEl.src = currentImageDataUrl;
      if (imagePreviewContainer) imagePreviewContainer.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentImageDataUrl = '';
      if (imageInput) imageInput.value = '';
      if (imagePreviewEl) imagePreviewEl.src = '';
      if (imagePreviewContainer) imagePreviewContainer.classList.remove('active');
    });
  }

  // Fallback category images if user did not upload a photo
  function getFallbackImage(category) {
    switch (category) {
      case 'Electronics': return 'assets/images/headphones.svg';
      case 'Accessories': return 'assets/images/wallet.svg';
      case 'Books': return 'assets/images/textbook.svg';
      case 'ID Cards': return 'assets/images/idcard.svg';
      case 'Bags': return 'assets/images/backpack.svg';
      default: return 'assets/images/keys.svg';
    }
  }

  // Handle Form Submission (Lost Form)
  if (lostForm) {
    lostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit('lost', lostForm);
    });
  }

  // Handle Form Submission (Found Form)
  if (foundForm) {
    foundForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit('found', foundForm);
    });
  }

  function handleFormSubmit(reportType, formEl) {
    const title = document.getElementById('item-title').value.trim();
    const category = document.getElementById('item-category').value;
    const location = document.getElementById('item-location').value.trim();
    const date = document.getElementById('item-date').value;
    const description = document.getElementById('item-description').value.trim();
    const contactName = document.getElementById('contact-name').value.trim();
    const contactEmail = document.getElementById('contact-email').value.trim();
    const contactPhone = document.getElementById('contact-phone') ? document.getElementById('contact-phone').value.trim() : '';

    if (!title || !category || !location || !date || !description || !contactName || !contactEmail) {
      FindItApp.showToast('Please fill in all required fields.', 'error');
      return;
    }

    // Submit button loading animation
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

    setTimeout(() => {
      const finalImage = currentImageDataUrl || getFallbackImage(category);

      const newItem = FindItApp.saveItem({
        title,
        category,
        type: reportType,
        location,
        date,
        description,
        contactName,
        contactEmail,
        contactPhone: contactPhone || 'Not provided',
        image: finalImage,
        reporterEmail: currentUser ? currentUser.email : contactEmail
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;

      // Show success modal or toast
      showSuccessModal(newItem);
      formEl.reset();
      currentImageDataUrl = '';
      if (imagePreviewContainer) imagePreviewContainer.classList.remove('active');
    }, 600);
  }

  function showSuccessModal(item) {
    if (successModal) {
      const modalRefEl = document.getElementById('modal-report-id');
      const modalViewDetails = document.getElementById('modal-view-details');
      if (modalRefEl) modalRefEl.textContent = item.id;
      if (modalViewDetails) modalViewDetails.href = `item-details.html?id=${item.id}`;
      successModal.classList.add('show');
    } else {
      FindItApp.showToast(`Report submitted successfully! (ID: ${item.id})`, 'success');
      setTimeout(() => {
        window.location.href = `browse.html?type=${item.type}`;
      }, 1500);
    }
  }

  // Modal close handlers
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (successModal) successModal.classList.remove('show');
    });
  });

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('show');
      }
    });
  }
});

