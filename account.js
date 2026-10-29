'use strict';

const particleContainer = document.getElementById('particles');

for (let i = 0; i < 50; i++) {
    const particle = document.createElement('span');
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const duration = 5 + Math.random() * 10;

    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';

    particle.animate(
        [
            { transform: 'translate(0, 0)' },
            { transform: `translate(${x}px, ${y}px)` }
        ],
        {
            duration: duration * 1000,
            iterations: Infinity,
            direction: 'alternate',
            easing: 'ease-in-out'
        }
    );

    particleContainer.appendChild(particle);
}

const passwordForm = document.getElementById('password-form');
const passwordMessage = document.getElementById('password-message');
const changePasswordButton = document.getElementById('change-password-button');

const avatarFile = document.getElementById('avatar-file');
const chooseAvatarButton = document.getElementById('choose-avatar-button');
const removeAvatarButton = document.getElementById('remove-avatar-button');
const saveAvatarButton = document.getElementById('save-avatar-button');
const cancelAvatarButton = document.getElementById('cancel-avatar-button');

const avatarPreview = document.getElementById('avatar-preview');
const avatarPreviewContainer = document.getElementById('avatar-preview-container');
const avatarMessage = document.getElementById('avatar-message');
const profilePicture = document.getElementById('profile-picture');

let selectedAvatarData = null;
let currentAccountUsername = '';

function showAvatarMessage(message, type = '') {
    avatarMessage.textContent = message;
    avatarMessage.className = type;
}

function showDefaultAvatar() {
    const initial = document.createElement('span');

    initial.textContent = (currentAccountUsername || '?').charAt(0).toUpperCase();

    profilePicture.replaceChildren(initial);
    profilePicture.setAttribute(
        'aria-label',
        `Default profile picture for ${currentAccountUsername || 'account'}`
    );
}

function loadAvatar() {
    if (!currentAccountUsername) return;

    const image = new Image();

    image.onload = () => {
        image.alt = `Profile picture for ${currentAccountUsername}`;

        profilePicture.replaceChildren(image);
        profilePicture.setAttribute('aria-label', image.alt);
        removeAvatarButton.hidden = false;
    };

    image.onerror = () => {
        showDefaultAvatar();
        removeAvatarButton.hidden = true;
    };

    image.src = `/api/avatar?username=${encodeURIComponent(currentAccountUsername)}&v=${Date.now()}`;
}

async function loadAccount() {
    try {
        const response = await fetch('/api/me');

        if (!response.ok) {
            window.location.href = '/login';
            return;
        }

        const user = await response.json();

        if (!user.loggedIn) {
            window.location.href = '/login';
            return;
        }

        document.getElementById('account-username').textContent =
            user.username || 'RLTiers Member';

        currentAccountUsername = user.username || '';

        loadAvatar();
    } catch (error) {
        console.error('Could not load account:', error);

        document.getElementById('account-username').textContent =
            'Could not load account';
    }
}

loadAccount();

passwordForm.addEventListener('submit', async event => {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    passwordMessage.textContent = '';
    passwordMessage.className = '';

    if (newPassword !== confirmPassword) {
        passwordMessage.textContent = 'The new passwords do not match.';
        passwordMessage.className = 'error';
        return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
        passwordMessage.textContent =
            'The new password must be 8–128 characters long.';
        passwordMessage.className = 'error';
        return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
        passwordMessage.textContent =
            'The new password must be no more than 72 UTF-8 bytes.';
        passwordMessage.className = 'error';
        return;
    }

    changePasswordButton.disabled = true;
    changePasswordButton.textContent = 'Changing password...';

    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (!response.ok) {
            passwordMessage.textContent =
                data.message || 'Could not change your password.';
            passwordMessage.className = 'error';
            return;
        }

        passwordForm.reset();

        passwordMessage.textContent =
            data.message || 'Password changed successfully.';
        passwordMessage.className = 'success';
    } catch (error) {
        console.error('Password change failed:', error);

        passwordMessage.textContent =
            'Could not connect to the server. Please try again.';
        passwordMessage.className = 'error';
    } finally {
        changePasswordButton.disabled = false;
        changePasswordButton.textContent = 'Change Password';
    }
});

chooseAvatarButton.addEventListener('click', () => avatarFile.click());

avatarFile.addEventListener('change', () => {
    const file = avatarFile.files[0];

    selectedAvatarData = null;
    showAvatarMessage('');

    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        showAvatarMessage('Choose a PNG, JPEG, or WebP image.', 'error');
        avatarFile.value = '';
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showAvatarMessage('The image must be 2 MB or smaller.', 'error');
        avatarFile.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        if (typeof reader.result !== 'string') {
            showAvatarMessage('Could not read this image.', 'error');
            return;
        }

        selectedAvatarData = reader.result;
        avatarPreview.src = selectedAvatarData;
        avatarPreviewContainer.hidden = false;

        showAvatarMessage('');
    };

    reader.onerror = () => {
        showAvatarMessage('Could not read this image.', 'error');
    };

    reader.readAsDataURL(file);
});

cancelAvatarButton.addEventListener('click', () => {
    selectedAvatarData = null;
    avatarFile.value = '';

    avatarPreview.removeAttribute('src');
    avatarPreviewContainer.hidden = true;

    showAvatarMessage('');
});

saveAvatarButton.addEventListener('click', async () => {
    if (!selectedAvatarData) return;

    saveAvatarButton.disabled = true;
    saveAvatarButton.textContent = 'Saving...';

    showAvatarMessage('');

    try {
        const response = await fetch('/api/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: selectedAvatarData })
        });

        const data = await response.json();

        if (!response.ok) {
            showAvatarMessage(
                data.message || 'Could not save picture.',
                'error'
            );
            return;
        }

        avatarPreviewContainer.hidden = true;
        selectedAvatarData = null;
        avatarFile.value = '';

        showAvatarMessage(data.message || 'Picture updated!', 'success');

        loadAvatar();
    } catch (error) {
        console.error('Avatar upload failed:', error);

        showAvatarMessage(
            'Could not connect to the server.',
            'error'
        );
    } finally {
        saveAvatarButton.disabled = false;
        saveAvatarButton.textContent = 'Save Picture';
    }
});

removeAvatarButton.addEventListener('click', async () => {
    removeAvatarButton.disabled = true;

    showAvatarMessage('');

    try {
        const response = await fetch('/api/avatar/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        });

        const data = await response.json();

        if (!response.ok) {
            showAvatarMessage(
                data.message || 'Could not remove picture.',
                'error'
            );
            return;
        }

        showDefaultAvatar();
        removeAvatarButton.hidden = true;

        showAvatarMessage(data.message || 'Picture removed.', 'success');
    } catch (error) {
        console.error('Avatar removal failed:', error);

        showAvatarMessage(
            'Could not connect to the server.',
            'error'
        );
    } finally {
        removeAvatarButton.disabled = false;
    }
});