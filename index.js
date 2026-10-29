
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
