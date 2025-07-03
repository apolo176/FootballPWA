
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

  // Inicializa Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  const form = document.getElementById("playerForm");
  const playerList = document.getElementById("playerList");

  // Función para agregar jugador
  form.addEventListener("submit", e => {
    e.preventDefault();
    console.log("submit")
    const player = {
        name: document.getElementById("name").value,
        goals: parseInt(document.getElementById("goals").value),
        assists: parseInt(document.getElementById("assists").value),
        minutes: parseInt(document.getElementById("minutes").value),
        yellowCards: parseInt(document.getElementById("yellowCards").value),
        redCards: parseInt(document.getElementById("redCards").value)
    };
    db.collection("players").add(player)
      .then(() => {
        form.reset();
        console.log("Jugador agregado");
      })
      .catch(error => console.error("Error agregando jugador:", error));
  });

  // Escuchar cambios en tiempo real y actualizar lista
  db.collection("players").onSnapshot(snapshot => {
    playerList.innerHTML = ""; // Limpia la lista

    snapshot.forEach(doc => {
      const p = doc.data();
      const li = document.createElement("li");
      li.textContent = `${p.name} - Goles: ${p.goals}, Asistencias: ${p.assists}, Minutos: ${p.minutes}, Amarillas: ${p.yellowCards}, Rojas: ${p.redCards}`;
      playerList.appendChild(li);
    });
  });