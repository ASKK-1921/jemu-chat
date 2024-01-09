/* eslint-disable no-alert */
const registerForm = document.getElementById('registerForm');

const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

const validateForm = () => {
	if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
		alert('Please check the form for any missing information');
	}

	if (password.value !== confirmPassword.value) {
		alert('Passwords do not match. Please try again');
	} else {
		registerForm.submit();
	}
};

registerForm.onsubmit = (e) => {
	e.preventDefault();
	validateForm();
};
