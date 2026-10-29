
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

async function loadLeaderboard() {
    const container = document.getElementById('leaderboard');

    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (!response.ok) {
            container.textContent =
                data.message || 'Failed to load leaderboard.';

            if (response.status === 401) {
                window.location.href = '/login';
            }

            return;
        }

        container.replaceChildren();

        data.players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'player';

            const rank = document.createElement('span');
            rank.textContent = `#${index + 1}`;

            const identity = document.createElement('div');
identity.className = 'player-identity';

const avatar = document.createElement('img');
avatar.className = 'player-avatar';
avatar.alt = '';
avatar.loading = 'lazy';
avatar.src = `/api/avatar?username=${encodeURIComponent(player.username)}`;

avatar.onerror = () => {
    const fallback = document.createElement('span');
    fallback.className = 'player-avatar-fallback';
    fallback.textContent = player.username.charAt(0).toUpperCase();
    avatar.replaceWith(fallback);
};

const username = document.createElement('span');
username.className = 'player-username';
username.textContent = player.username;

identity.append(avatar, username);

            const tier = document.createElement('span');
            tier.textContent = player.tier;

            const points = document.createElement('span');
            points.textContent = `${player.points} points`;

            row.append(rank, identity, tier, points);
            container.appendChild(row);
        });

        if (data.players.length === 0) {
            container.textContent = 'No players yet!';
        }
    } catch (error) {
        container.textContent = 'Could not connect to the server.';
        console.error('Leaderboard loading failed:', error);
    }
}

async function checkAdminAccess() {
    try {
        const response = await fetch('/api/me');

        if (!response.ok) {
            return;
        }

        const user = await response.json();

        if (user.loggedIn && user.isAdmin === true) {
            document.getElementById('admin-button').hidden = false;
        }
    } catch (error) {
        console.error('Could not check admin access:', error);
    }
}

loadLeaderboard();
checkAdminAccess();



document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
       
const response = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
});


        const responseText = await response.text();

        console.log('Logout status:', response.status);
        console.log('Logout response:', responseText);

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}: ${responseText}`);
        }

        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
        alert(error.message);
    }
});

// TEMPORARY AI CHAT

const aiToggle = document.getElementById('ai-chat-toggle');
const aiWindow = document.getElementById('ai-chat-window');
const aiClose = document.getElementById('ai-chat-close');
const aiForm = document.getElementById('ai-chat-form');
const aiInput = document.getElementById('ai-chat-input');
const aiMessages = document.getElementById('ai-chat-messages');
const aiSend = document.getElementById('ai-chat-send');

let aiHistory = [];
let aiRequest = null;

function clearAiChat() {
    aiRequest?.abort();
    aiRequest = null;

    aiHistory = [];
    aiMessages.replaceChildren();

    aiWindow.hidden = true;
    aiToggle.focus();
}

function addAiMessage(text, role) {
    const message = document.createElement('p');

    message.className = `ai-message ${role === 'user' ? 'ai-user' : 'ai-bot'}`;
    message.textContent = text;

    aiMessages.appendChild(message);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    return message;
}

aiToggle.addEventListener('click', () => {
    aiWindow.hidden = false;
    aiInput.focus();
});

aiClose.addEventListener('click', clearAiChat);

aiForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const message = aiInput.value.trim();

    if (!message || aiRequest) {
        return;
    }

    aiInput.value = '';
    aiInput.disabled = true;
    aiSend.disabled = true;

    addAiMessage(message, 'user');

    aiHistory.push({
        role: 'user',
        content: message
    });
    while (aiHistory.length > 100) {
    aiHistory.shift();
}

    const controller = new AbortController();
    aiRequest = controller;

    const loadingMessage = addAiMessage('Thinking...', 'assistant');

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: aiHistory
            }),
            signal: controller.signal
        });

        const responseText = await response.text();

let data;

try {
    data = JSON.parse(responseText);
} catch {
    throw new Error(
        `Server returned invalid JSON (HTTP ${response.status}).`
    );
}

        if (!response.ok) {
            throw new Error(data.message || 'The AI request failed.');
        }

        loadingMessage.textContent = data.reply;

        aiHistory.push({
            role: 'assistant',
            content: data.reply
        });
        while (aiHistory.length > 100) {
    aiHistory.shift();
}
    } catch (error) {
        if (error.name !== 'AbortError') {
            loadingMessage.textContent = error.message || 'The AI is unavailable.';
        }

        // Don't keep a user message that didn't receive a reply.
        if (error.name !== 'AbortError') {
            aiHistory.pop();
        }
    } finally {
        if (aiRequest === controller) {
            aiRequest = null;
            aiInput.disabled = false;
            aiSend.disabled = false;
            aiInput.focus();
        }
    }
});
