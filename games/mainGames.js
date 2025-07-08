
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyDe5kV8p9GnYb1MKSlMZnajeyARDzCe2DU",
      authDomain: "firestore1-4590c.firebaseapp.com",
      projectId: "firestore1-4590c",
      storageBucket: "firestore1-4590c.appspot.com",
      messagingSenderId: "108637054681",
      appId: "1:108637054681:web:9f07fc8bb2201c309640c8",
      measurementId: "G-V3EVS5XF2Z"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

  
  const gamesList = document.getElementById('gamesList');
  const addBtn = document.getElementById('addGameBtn');
  // Función para agregar jugador
  
  // --- Partidos ---
function renderGame(doc, phase, containerId) {
  const g = doc.data();
  const li = document.createElement('li');
  li.className = 'game-card';
  li.innerHTML = `
    <div>
      <strong>${g.local ? 'C.D Peña' : g.rivalName}</strong> vs <strong>${g.local ? g.rivalName : 'C.D Peña'}</strong>
    </div>
    <div>${new Date(g.dateTime.toDate()).toLocaleString()}</div>
    <div>${g.stadium}, ${g.city}</div>
    <button onclick="window.location.href='game.html?id=${doc.id}&phase=${phase}'">
      ${phase === 'pre' ? 'Gestionar Previa' : phase === 'live' ? 'Ir al Partido' : 'Ver Resumen'}
    </button>
  `;
  document.getElementById(containerId).appendChild(li);
}

db.collection('games')
  .orderBy('dateTime')
  .onSnapshot(snapshot => {
    ['pre', 'live', 'post'].forEach(phase => document.getElementById(phase).innerHTML = '');

    snapshot.forEach(doc => {
      const g = doc.data();
      const now = new Date();
      const dt = g.dateTime.toDate();
      let phase = 'past';
      if (!g.started) phase = 'pre';
      else if (g.started && !g.finished) phase = 'live';

      renderGame(doc, phase, phase);
    });
  });

// Tabs control
document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => {
    const phase = button.dataset.phase;

    // Actualizar pestañas activas
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Mostrar la fase correspondiente
    document.querySelectorAll('.phase').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${phase}`).classList.add('active');
  });
});
  addBtn.addEventListener('click', () => {
    window.location.href = 'add-game.html';
  });
