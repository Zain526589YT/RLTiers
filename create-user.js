
const fs = require('fs');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function ask(question) {
  return new Promise(resolve => {
      rl.question(question, resolve);
});
}


async function createUser() {
    let username = (await ask('Username: ')).trim();
    let password = await ask('Password: ');
    let adminAnswer = (await ask('Is Admin? (true/false): ')).trim().toLowerCase();

    if (!username || !password) {
        console.log('Username and password are required.');
        rl.close();
        return;
    }

    if (adminAnswer !== '' && adminAnswer !== 'true' && adminAnswer !== 'false') {
        console.log('Admin answer must be true or false.');
        rl.close();
        return;
    }

    let isAdmin = adminAnswer === 'true';

    const file = 'users.json';
    let data = { users: [] };

    if (fs.existsSync(file)) {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    }

    if (data.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        console.log('That username already exists.');
        rl.close();
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    data.users.push({
        username: username,
        passwordHash: passwordHash,
        isAdmin: isAdmin
    });

    fs.writeFileSync(file, JSON.stringify(data, null, 4));

    console.log(`Account "${username}" created!`);
    rl.close();
}





createUser().catch(error => {
    console.error(error);
    rl.close();
});