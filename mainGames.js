
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
if (gamesList && addBtn) {
  db.collection('games')
    .orderBy('dateTime')
    .onSnapshot(snapshot => {
      gamesList.innerHTML = '';
      snapshot.forEach(doc => {
        const g = doc.data();
        const li = document.createElement('li');
        li.className = 'card game-card';
        li.innerHTML = `
          <div class="team">
            <span class="team-name">${g.local ? 'C.D Peña' : g.rivalName}</span>
          </div>
          <div class="score">
            ${g.scoreHome != null ? `${g.scoreHome} – ${g.scoreAway}` : `<span class="placeholder">–</span>`}
          </div>
          <div class="team">
            <span class="team-name">${g.local ? g.rivalName : 'Nuestro Equipo'}</span>
          </div>
          <div class="details">
            <small>${new Date(g.dateTime.toDate()).toLocaleString()}</small>
            <small>${g.stadium}, ${g.city}</small>
          </div>`;
        gamesList.appendChild(li);
      });
    });

  addBtn.addEventListener('click', () => {
    window.location.href = 'add-game.html';
  });
}