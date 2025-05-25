// script.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('button[type="submit"]');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    loginForm.appendChild(successMessage);

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Simulate login
            loginButton.textContent = 'Logging in...';
            loginButton.disabled = true;
            
            setTimeout(() => {
                successMessage.textContent = 'Login successful!';
                successMessage.style.display = 'block';
                loginForm.reset();
                loginButton.textContent = 'Login';
                loginButton.disabled = false;

                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }, 1500);
        }
    });

    function validateForm() {
        let isValid = true;

        if (usernameInput.value.trim() === '') {
            setError(usernameInput, 'Username is required');
            isValid = false;
        } else {
            setSuccess(usernameInput);
        }

        if (passwordInput.value.trim() === '') {
            setError(passwordInput, 'Password is required');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            setError(passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            setSuccess(passwordInput);
        }

        return isValid;
    }

    function setError(input, message) {
        const formControl = input.parentElement;
        let errorDisplay = formControl.querySelector('.error-message');
        
        if (!errorDisplay) {
            errorDisplay = document.createElement('div');
            errorDisplay.className = 'error-message';
            formControl.appendChild(errorDisplay);
        }
        
        errorDisplay.textContent = message;
        input.classList.add('error');
    }

    function setSuccess(input) {
        const formControl = input.parentElement;
        const errorDisplay = formControl.querySelector('.error-message');
        
        if (errorDisplay) {
            errorDisplay.remove();
        }
        
        input.classList.remove('error');
    }

    // Add floating label effect
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('focus', () => {
            input.labels[0].classList.add('active');
        });

        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.labels[0].classList.remove('active');
            }
        });
    });
});
