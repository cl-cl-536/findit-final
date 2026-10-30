/**
 * FindIt – Authentication Module
 * Handles demo student & administrator sign-in, account registration, and validation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const quickFillStudentBtn = document.getElementById('quick-fill-student');
  const quickFillAdminBtn = document.getElementById('quick-fill-admin');

  // Quick-fill demo credentials for easy faculty evaluation
  if (quickFillStudentBtn) {
    quickFillStudentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('email').value = 'student@campus.edu';
      document.getElementById('password').value = 'student123';
      FindItApp.showToast('Student credentials filled!', 'success');
    });
  }

  if (quickFillAdminBtn) {
    quickFillAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('email').value = 'admin@campus.edu';
      document.getElementById('password').value = 'admin123';
      FindItApp.showToast('Admin credentials filled!', 'success');
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        FindItApp.showToast('Please provide both your college email and password.', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing In...`;

      setTimeout(() => {
        const result = FindItApp.login(email, password);
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Log In <i class="fa-solid fa-arrow-right"></i>`;

        if (result.success) {
          FindItApp.showToast(`Welcome back, ${result.user.name}!`, 'success');
          setTimeout(() => {
            if (result.user.role === 'Administrator') {
              window.location.href = 'admin.html';
            } else {
              window.location.href = 'dashboard.html';
            }
          }, 800);
        } else {
          FindItApp.showToast(result.message || 'Login failed. Check your credentials.', 'error');
        }
      }, 500);
    });
  }

  // Handle Registration Submission
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const termsAccepted = document.getElementById('terms') ? document.getElementById('terms').checked : true;

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        FindItApp.showToast('All fields are required.', 'error');
        return;
      }

      if (!email.includes('@')) {
        FindItApp.showToast('Please enter a valid campus email address.', 'error');
        return;
      }

      if (password.length < 6) {
        FindItApp.showToast('Password must be at least 6 characters long.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        FindItApp.showToast('Passwords do not match.', 'error');
        return;
      }

      if (!termsAccepted) {
        FindItApp.showToast('You must agree to the Campus Lost & Found Community Guidelines.', 'error');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

      setTimeout(() => {
        const result = FindItApp.register({
          name,
          email,
          password,
          role: 'Student'
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = `Create Account <i class="fa-solid fa-arrow-right"></i>`;

        if (result.success) {
          FindItApp.showToast('Account registered successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        } else {
          FindItApp.showToast(result.message || 'Registration failed.', 'error');
        }
      }, 600);
    });
  }
});

