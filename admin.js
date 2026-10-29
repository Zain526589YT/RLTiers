
'use strict';

const table = document.getElementById('players-table');
const notice = document.getElementById('notice');
const searchInput = document.getElementById('search-input');
const roleFilter = document.getElementById('role-filter');
const refreshButton = document.getElementById('refresh-button');
const createAccountButton = document.getElementById('create-account-button');

const totalPlayers = document.getElementById('total-players');
const totalAdmins = document.getElementById('total-admins');
const totalPoints = document.getElementById('total-points');
const playerCount = document.getElementById('player-count');
const tableStatus = document.getElementById('table-status');

let players = [];
let noticeTimer;

// API HELPER

async function api(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body ? {
                'Content-Type': 'application/json'
            } : {}),
            ...options.headers
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error('The server returned an invalid response.');
    }

    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Your session expired. Please log in again.');
    }

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
    }

    return data;
}

// NOTIFICATIONS

function showNotice(message, type = 'success') {
    clearTimeout(noticeTimer);

    notice.textContent = message;
    notice.className = `notice${type === 'error' ? ' error' : ''}`;
    notice.hidden = false;

    noticeTimer = setTimeout(() => {
        notice.hidden = true;
    }, 5000);
}

// SAFE ELEMENT CREATION

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function makeAction(label, symbol, action, username, danger = false) {
    const button = makeElement(
        'button',
        `action-button${danger ? ' danger' : ''}`,
        symbol
    );

    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', `${label}: ${username}`);
    button.dataset.action = action;
    button.dataset.username = username;

    return button;
}

// LOAD ACCOUNTS

async function loadPlayers() {
    tableStatus.textContent = 'Loading accounts…';
    refreshButton.disabled = true;

    try {
        const data = await api('/api/admin/users');

        if (!data || !Array.isArray(data.users)) {
            throw new Error('The server returned unexpected account data.');
        }

        players = data.users;
        updateStats();
        renderPlayers();

        tableStatus.textContent = 'Account data loaded successfully.';
    } catch (error) {
        table.replaceChildren();

        const row = makeElement('tr');
        const cell = makeElement('td', 'table-message', error.message);

        cell.colSpan = 5;
        row.appendChild(cell);
        table.appendChild(row);

        playerCount.textContent = 'Unavailable';
        tableStatus.textContent = 'Could not load account data.';

        showNotice(error.message, 'error');
    } finally {
        refreshButton.disabled = false;
    }
}

// DASHBOARD STATISTICS

function updateStats() {
    totalPlayers.textContent = players.length.toLocaleString();

    totalAdmins.textContent = players.filter(
        player => player.isAdmin === true
    ).length.toLocaleString();

    totalPoints.textContent = players.reduce(
        (sum, player) => sum + (Number(player.points) || 0),
        0
    ).toLocaleString();

    playerCount.textContent =
        `${players.length.toLocaleString()} ${players.length === 1 ? 'account' : 'accounts'}`;
}

// RENDER PLAYER TABLE

function renderPlayers() {
    const query = searchInput.value.trim().toLowerCase();
    const role = roleFilter.value;

    const filteredPlayers = players
        .filter(player =>
            String(player.username).toLowerCase().includes(query)
        )
        .filter(player => {
            if (role === 'admin') return player.isAdmin === true;
            if (role === 'player') return player.isAdmin !== true;
            return true;
        })
        .sort((a, b) =>
            (Number(b.points) || 0) - (Number(a.points) || 0)
        );

    table.replaceChildren();

    if (filteredPlayers.length === 0) {
        const row = makeElement('tr');

        const cell = makeElement(
            'td',
            'table-message',
            players.length === 0
                ? 'No accounts exist yet.'
                : 'No accounts match your search.'
        );

        cell.colSpan = 5;
        row.appendChild(cell);
        table.appendChild(row);
        return;
    }

    filteredPlayers.forEach(player => {
        const row = makeElement('tr');

        // PLAYER

        const playerCell = makeElement('td');
        const playerInfo = makeElement('div', 'player-cell');

        const avatar = makeElement(
            'div',
            'player-avatar',
            String(player.username).charAt(0).toUpperCase()
        );

        const nameContainer = makeElement('div');

        nameContainer.append(
            makeElement('div', 'player-name', player.username),
            makeElement('div', 'player-subtitle', 'RLTiers account')
        );

        playerInfo.append(avatar, nameContainer);
        playerCell.appendChild(playerInfo);

        // TIER

        const tierCell = makeElement('td');

        tierCell.appendChild(
            makeElement('span', 'tier-badge', player.tier || 'Unranked')
        );

        // POINTS

        const pointsCell = makeElement('td');

        pointsCell.appendChild(
            makeElement(
                'span',
                'points-value',
                (Number(player.points) || 0).toLocaleString()
            )
        );

        // ROLE

        const roleCell = makeElement('td');

        roleCell.appendChild(
            makeElement(
                'span',
                `role-badge${player.isAdmin === true ? ' admin' : ''}`,
                player.isAdmin === true ? '◆ Admin' : '● Player'
            )
        );

        // ACTIONS

        const actionsCell = makeElement('td');
        const actions = makeElement('div', 'action-buttons');

        actions.append(
            makeAction('Manage points', '±', 'points', player.username),
            makeAction('Rename account', '✎', 'rename', player.username),
            makeAction(
                player.isAdmin ? 'Remove admin' : 'Make admin',
                '◆',
                'permissions',
                player.username
            ),
            makeAction('Reset password', '🔑', 'password', player.username),
            makeAction('Delete account', '×', 'delete', player.username, true)
        );

        actionsCell.appendChild(actions);

        row.append(
            playerCell,
            tierCell,
            pointsCell,
            roleCell,
            actionsCell
        );

        table.appendChild(row);
    });
}

// ACTION REQUESTS

async function postAction(endpoint, body) {
    return api(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

// MANAGE POINTS

async function managePoints(username) {
    const amountText = prompt(
        `Points for ${username}\n\n` +
        'Enter a positive number to award points, or a negative number to remove points.\n\n' +
        'Example: 10 or -10'
    );

    if (amountText === null) return;

    const amount = Number(amountText.trim());

    if (
        !amountText.trim() ||
        !Number.isSafeInteger(amount) ||
        amount === 0 ||
        Math.abs(amount) > 1000000
    ) {
        showNotice(
            'Enter a non-zero whole number between -1000000 and 1000000.',
            'error'
        );
        return;
    }

    const result = await postAction('/api/admin/points', {
        username,
        amount
    });

    showNotice(
        `${result.username} now has ${Number(result.points).toLocaleString()} points (${result.tier}).`
    );

    await loadPlayers();
}

// RENAME ACCOUNT

async function renamePlayer(username) {
    const input = prompt(
        `Enter a new username for ${username}:`,
        username
    );

    if (input === null) return;

    const newUsername = input.trim();

    if (!/^[A-Za-z0-9_.-]{1,32}$/.test(newUsername)) {
        showNotice(
            'Usernames must be 1–32 characters and use only letters, numbers, dots, underscores or hyphens.',
            'error'
        );
        return;
    }

    if (newUsername === username) return;

    const result = await postAction('/api/admin/rename', {
        username,
        newUsername
    });

    showNotice(
        `${result.oldUsername} was renamed to ${result.username}.`
    );

    await loadPlayers();
}

// RESET PASSWORD

async function resetPlayerPassword(username) {
    const newPassword = prompt(
        `Enter a new password for ${username}:\n\nUse 8–128 characters.`
    );

    if (newPassword === null) return;

    if (
        newPassword.length < 8 ||
        newPassword.length > 128 ||
        new TextEncoder().encode(newPassword).length > 72
    ) {
        showNotice(
            'Password must be 8–128 characters and at most 72 UTF-8 bytes.',
            'error'
        );
        return;
    }

    if (!confirm(`Reset the password for "${username}"?`)) return;

    const result = await postAction('/api/admin/password-reset', {
        username,
        newPassword
    });

    showNotice(result.message || `Password reset for ${username}.`);
}

// ADMIN PERMISSIONS

async function changePermissions(username) {
    const player = players.find(
        item => item.username.toLowerCase() === username.toLowerCase()
    );

    if (!player) return;

    const isAdmin = !player.isAdmin;

    const action = isAdmin
        ? 'grant admin permissions to'
        : 'remove admin permissions from';

    if (!confirm(`Are you sure you want to ${action} ${username}?`)) return;

    const result = await postAction('/api/admin/permissions', {
        username,
        isAdmin
    });

    showNotice(result.message || 'Account permissions updated.');
    await loadPlayers();
}

// DELETE ACCOUNT

async function deletePlayer(username) {
    if (
        !confirm(
            `Delete the account "${username}"?\n\n` +
            'This also removes the account from the leaderboard. ' +
            'This action cannot be undone.'
        )
    ) {
        return;
    }

    const result = await postAction('/api/admin/delete', {
        username
    });

    showNotice(`${result.username || username} was deleted.`);
    await loadPlayers();
}

// CREATE ACCOUNT

async function createAccount() {
    const usernameInput = prompt(
        'Choose a username:\n\n' +
        'Use 1–32 letters, numbers, dots, underscores or hyphens.'
    );

    if (usernameInput === null) return;

    const username = usernameInput.trim();

    if (!/^[A-Za-z0-9_.-]{1,32}$/.test(username)) {
        showNotice(
            'Invalid username. Use 1–32 allowed characters.',
            'error'
        );
        return;
    }

    const password = prompt(
        `Choose a password for "${username}":\n\nUse 8–128 characters.`
    );

    if (password === null) return;

    if (
        password.length < 8 ||
        password.length > 128 ||
        new TextEncoder().encode(password).length > 72
    ) {
        showNotice(
            'Password must be 8–128 characters and at most 72 UTF-8 bytes.',
            'error'
        );
        return;
    }

    const pointsInput = prompt(
        'How many starting points should the account have?',
        '0'
    );

    if (pointsInput === null) return;

    const points = Number(pointsInput.trim());

    if (
        !pointsInput.trim() ||
        !Number.isSafeInteger(points) ||
        points < 0 ||
        points > 2000000000
    ) {
        showNotice(
            'Starting points must be a whole number from 0 to 2000000000.',
            'error'
        );
        return;
    }

    const isAdmin = confirm(
        `Should "${username}" have admin permissions?\n\n` +
        'OK = Admin\nCancel = Regular player'
    );

    if (
        !confirm(
            `Create account "${username}"?\n\n` +
            `Starting points: ${points.toLocaleString()}\n` +
            `Role: ${isAdmin ? 'Admin' : 'Player'}`
        )
    ) {
        return;
    }

    const result = await postAction('/api/admin/create', {
        username,
        password,
        points,
        isAdmin
    });

    showNotice(result.message || `Account "${username}" created.`);
    await loadPlayers();
}

// HANDLE TABLE BUTTONS

table.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const { action, username } = button.dataset;

    try {
        if (action === 'points') {
            await managePoints(username);
        } else if (action === 'rename') {
            await renamePlayer(username);
        } else if (action === 'permissions') {
            await changePermissions(username);
        } else if (action === 'password') {
            await resetPlayerPassword(username);
        } else if (action === 'delete') {
            await deletePlayer(username);
        }
    } catch (error) {
        showNotice(error.message, 'error');
    }
});

// SEARCH AND FILTERS

searchInput.addEventListener('input', renderPlayers);
roleFilter.addEventListener('change', renderPlayers);

refreshButton.addEventListener('click', loadPlayers);

// CREATE ACCOUNT BUTTON

createAccountButton.addEventListener('click', async () => {
    try {
        await createAccount();
    } catch (error) {
        showNotice(error.message, 'error');
    }
});

// LOGOUT

document.getElementById('logout-button').addEventListener(
    'click',
    async () => {
        try {
            await api('/api/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        window.location.href = '/login';
    }
);

// STARTUP

async function initializeAdminPanel() {
    try {
        const user = await api('/api/me');

        if (!user.loggedIn) {
            window.location.href = '/login';
            return;
        }

        if (!user.isAdmin) {
            window.location.href = '/';
            return;
        }

        await loadPlayers();
    } catch (error) {
        showNotice(error.message, 'error');
    }
}

initializeAdminPanel();
