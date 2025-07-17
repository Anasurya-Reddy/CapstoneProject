// Signup Form Handling
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('formError');
  
  submitBtn.disabled = true;
  errorEl.style.display = 'none';

  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        password: form.password.value
      })
    });

    const result = await response.json();
    
    if (result.success) {
      window.location.href = result.redirect;
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
    }
  } catch (error) {
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
});

// Password Strength Meter
document.getElementById('password')?.addEventListener('input', function() {
  const strengthBar = document.getElementById('passwordStrength');
  const strength = Math.min(4, Math.floor(this.value.length / 3));
  const colors = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71'];
  strengthBar.style.width = `${strength * 25}%`;
  strengthBar.style.backgroundColor = colors[strength - 1] || '#e74c3c';
});

// Add this to your existing auth.js
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('formError');
    
    // Show loading state
    submitBtn.disabled = true;
    errorEl.style.display = 'none';
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: form.email.value,
                password: form.password.value
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Successful login - redirect
            window.location.href = result.redirect;
        } else {
            // Show error message
            errorEl.textContent = result.error || 'Login failed';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
    }
});
