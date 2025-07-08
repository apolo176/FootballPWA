
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

    const table = document.getElementById('playersTable');
    const tableBody = table.querySelector('tbody');

    const addBtn = document.getElementById('addPlayerBtn');
    addBtn.addEventListener('click', () => {
      window.location.href = 'add-player.html';
    });

  // Función para agregar jugador


  // Escuchar cambios en tiempo real y actualizar lista
  db.collection("players").onSnapshot(snapshot => {
      tableBody.innerHTML = '';
    snapshot.forEach(doc => {
      const p = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.position || '-'}</td>
          <td>${p.dorsal || '-'}</td>
          <td>${p.goals}</td>
          <td>${p.assists}</td>
          <td>${p.minutes}</td>
          <td>${p.yellowCards}</td>
          <td>${p.redCards}</td>
        `;
        tableBody.appendChild(tr);
    });
  });
