
const particleContainer = document.getElementById('particles');

for (let i = 0; i < 50; i++) {
    const particle = document.createElement('span');
    const x = (Math.random() - 0.5) * 200;
const y = (Math.random() - 0.5) * 200;
const duration = 5 + Math.random() * 10;

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

    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';

    particleContainer.appendChild(particle);
}





document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    message.textContent = 'Logging in...';

    try {
        const response = await fetch(
    'https://rltiers.zainiscool-comcom.workers.dev/api/login',
    {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: username,
        password: password
       })
});

const result = await response.json();

   if (response.ok) {
        message.textContent = 'Login successful! :D';
        window.location.href = '/RLTiers/leaderboard.html';
        } else {
            message.textContent = result.message || 'Login failed.';
        }
    } catch (error) {
        message.textContent = 'Could not connect to the server.';
    }
});
