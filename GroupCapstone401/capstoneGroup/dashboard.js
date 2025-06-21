const email = localStorage.getItem('userEmail');
const username = localStorage.getItem('username');

if (!email) window.location.href = 'login.html';

document.getElementById('greeting').innerText = `Hello, ${username}`;

document.getElementById('logout-btn').onclick = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};

async function loadNotifications() {
  const res = await fetch('/api/sessions');
  const data = await res.json();
  alert("Upcoming sessions:\n" + data.map(s => `${s.link} at ${s.time}`).join("\n"));
}

window.onload = async () => {
  const all = await fetch('/api/notes');
  const mine = await fetch(`/api/mynotes/${email}`);
  const [total, myNotes] = [await all.json(), await mine.json()];
  document.getElementById('stats').innerText =
    `Notes uploaded by you: ${myNotes.length}, Total notes: ${total.length}`;
};
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').style.display = 'block';
});

document.getElementById('logout-btn-modal').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// Update username
document.getElementById('username-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newUsername = document.getElementById('new-username').value;
  const email = localStorage.getItem('userEmail');
  const res = await fetch('/api/update-username', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newUsername })
  });
  const text = await res.text();
  alert(text);
  if (res.ok) {
    localStorage.setItem('username', newUsername);
    location.reload();
  }
});

// Update password
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('new-password').value;
  const email = localStorage.getItem('userEmail');
  const res = await fetch('/api/update-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword })
  });
  const text = await res.text();
  alert(text);
});
