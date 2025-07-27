const figuras = [
  { 
    id: 1, 
    nombre: "Círculo", 
    svg: '<img src="img/circulo.webp" class="svg-symbol" alt="Círculo">' 
  },
  { 
    id: 2, 
    nombre: "Líneas paralelas", 
    svg: '<img src="img/paralelas.webp" class="svg-symbol" alt="Líneas paralelas">'
  },
  { 
    id: 3, 
    nombre: "Triángulo", 
    svg: '<img src="img/triangulo.webp" class="svg-symbol" alt="Triángulo">'
  },
  { 
    id: 4, 
    nombre: "Cuadrado", 
    svg: '<img src="img/cuadrado.webp" class="svg-symbol" alt="Cuadrado">'
  },
  { 
    id: 5, 
    nombre: "Pentágono", 
    svg: '<img src="img/pentagono.webp" class="svg-symbol" alt="Pentágono">'
  },
  {
    id: 6, 
    nombre: "Hexágono", 
    svg: '<img src="img/hexagono.webp" class="svg-symbol" alt="Hexágono">'
  },
];

let history = [];
let hintedCells = []; // New array to store hinted cell coordinates

// Tablero solo con números pre-rellenados:
const initialPuzzle = [
  [null, 5, null, null, null, null],
  [2, null, null, null, null, null],
  [null, null, null, null, 1, null],
  [null, null, null, null, null, null],
  [4, null, null, null, null, 6],
  [null, null, null, null, null, 3],
];

// Solución completa del Sudoku para proporcionar pistas
const sudokuSolution = [
  [5, 6, 1, 4, 2, 3],
  [2, 3, 4, 5, 6, 1],
  [1, 2, 5, 6, 3, 4],
  [3, 4, 6, 1, 5, 2],
  [4, 5, 2, 3, 1, 6],
  [6, 1, 3, 2, 4, 5]
];

const goldenCells = [
  [0,1],
  [2,4],
  [5,5]
];

let scoreDisplay;
let timerDisplay;
let gameMode;
let score;
let timeLeft;
let timerInterval;
let isSudokuSolvedOnce = false; // Variable para controlar si el Sudoku ya se resolvió una vez
let solveButton; // Declarar solveButton globalmente

document.addEventListener("DOMContentLoaded", () => {
  scoreDisplay = document.getElementById("score");
  timerDisplay = document.getElementById("timer");
  solveButton = document.querySelector('#solveButtonContainer button');
  const groupIrAdelanteDiv = document.getElementById("group-ir-adelante");

  renderBoard();
  renderDragZone();
  saveState(); // Guarda el estado inicial

  // Elementos de la interfaz
  const btnPistaExtra = document.getElementById("btn-pista-extra");
  if (groupIrAdelanteDiv) groupIrAdelanteDiv.style.display = "flex"; // Force display for development

  // Modales
  const modalPista = document.getElementById("modal-pista");
  const cerrarModalPista = document.getElementById("cerrar-modal-pista");
  const pistaExplicacion = document.getElementById("pista-explicacion");
  const feedbackPista = document.getElementById("feedback-pista");
  const btnConfirmarPista = document.getElementById("btn-confirmar-pista");
  const btnDescartarPista = document.getElementById("btn-descartar-pista");

  // Estado del juego
  gameMode = localStorage.getItem('gameMode') || 'score'; // Recupera el modo de juego
  score = 400; // Valor inicial, se podría cargar de localStorage si se guarda
  timeLeft = 30 * 60; // 30 minutos en segundos
  let pistasUsadasPuzzle = 0;
  let totalPistasUsadas = 0;
  let puzzleActual = "sudoku"; // Siempre es el puzzle del sudoku aquí

  const puzzles = {
    sudoku: {
      modal: null,
      respuesta: "",
      btnVer: null,
      btnResolver: null,
      input: null,
      feedback: null,
      cerrarModal: null,
      escenaSiguiente: null,
    },
  };

  const pistas = {
    sudoku: [], 
  };

  // --- INICIALIZACIÓN DEL JUEGO ---
  function inicializarJuegoSudoku() {
    // Cargar estado si es necesario, por ahora solo inicializa
    if (gameMode === 'score') {
      document.getElementById("score-container").style.display = "block";
      document.getElementById("timer-container").style.display = "none";
      if (scoreDisplay) scoreDisplay.textContent = score;
    } else if (gameMode === 'time') {
      document.getElementById("score-container").style.display = "none";
      document.getElementById("timer-container").style.display = "block";
      startTimer();
    }
    if (btnPistaExtra) btnPistaExtra.style.display = "flex";
  }

  // --- LÓGICA DE PISTAS ---
  function pedirPista() {
    if (pistasUsadasPuzzle < 2) { // Permitir hasta 2 pistas
      // Mostrar el modal de confirmación de pista
      if (modalPista) modalPista.style.display = "flex";
      if (feedbackPista) feedbackPista.textContent = ""; // Limpiar feedback anterior

      let costoPuntos = 10;
      let costoMinutos = 1;
      if (pistasUsadasPuzzle === 1) { // Segunda pista
        costoPuntos = 20;
        costoMinutos = 2;
      }

      if (pistaExplicacion) {
        let explanationText = "";
        if (gameMode === 'time') {
          explanationText = `Durante esta prueba tendrás acceso a un máximo de 2 pistas extra y en cada una de ellas te daremos 3 figuras para resolver el panel. ¡Pero no será gratis! Se restará ${costoMinutos} minuto${costoMinutos > 1 ? 's' : ''} de tu valioso tiempo por la ${pistasUsadasPuzzle === 0 ? 'primera' : 'segunda'} pista.`;
        } else if (gameMode === 'score') {
          explanationText = `Durante esta prueba tendrás acceso a un máximo de 2 pistas extra en las cuales se incluirán en el tablero 3 figuras por pista usada, para ayudarte en la resolución del tablero. ¡Pero no será gratis! Se te restarán ${costoPuntos} puntos por la ${pistasUsadasPuzzle === 0 ? 'primera' : 'segunda'} pista.`;
        }
        pistaExplicacion.textContent = explanationText;
      }

      // Ocultar el botón de segunda pista si existe (ya no se usa directamente)
      const oldBtnSegundaPista = document.getElementById("btn-segunda-pista");
      if (oldBtnSegundaPista) oldBtnSegundaPista.style.display = "none";

      // Mostrar los botones de confirmación/descarte
      if (btnConfirmarPista) btnConfirmarPista.style.display = "block";
      if (btnDescartarPista) btnDescartarPista.style.display = "block";

    } else {
      if (feedbackPista) feedbackPista.textContent = "Ya has usado todas las pistas para este puzzle.";
      if (modalPista) modalPista.style.display = "flex";
      // Ocultar botones de confirmación si ya no hay pistas disponibles
      if (btnConfirmarPista) btnConfirmarPista.style.display = "none";
      if (btnDescartarPista) btnDescartarPista.style.display = "none";
    }
  }

  function confirmarPista() {
    // Ocultar los botones de confirmación/descarte
    if (btnConfirmarPista) btnConfirmarPista.style.display = "none";
    if (btnDescartarPista) btnDescartarPista.style.display = "none";

    // Aplicar penalización
    let penaltyScore = 10;
    let penaltyTime = 60;
    if (pistasUsadasPuzzle === 1) { // Segunda pista
      penaltyScore = 20;
      penaltyTime = 120;
    }

    if (gameMode === 'score') {
      score -= penaltyScore;
      if (scoreDisplay) scoreDisplay.textContent = score;
    } else if (gameMode === 'time') {
      timeLeft -= penaltyTime;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("¡Se acabó el tiempo! Fin del juego.");
        window.location.href = "../index.html";
        return;
      }
    }

    pistasUsadasPuzzle++;
    totalPistasUsadas++;

    const currentBoard = history[history.length - 1];
    let hintsGiven = 0;
    const cellsToHint = [];

    // Encontrar celdas vacías que no sean goldenCells
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (currentBoard[r][c] === null) {
          const isGolden = goldenCells.some(([gr, gc]) => gr === r && gc === c);
          if (!isGolden) {
            cellsToHint.push({ row: r, col: c });
          }
        }
      }
    }

    // Mezclar cellsToHint para elegir celdas vacías al azar
    for (let i = cellsToHint.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellsToHint[i], cellsToHint[j]] = [cellsToHint[j], cellsToHint[i]];
    }

    // Dar hasta 3 pistas
    let availableCellsForHint = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (currentBoard[r][c] === null) {
          const isGolden = goldenCells.some(([gr, gc]) => gr === r && gc === c);
          if (!isGolden) {
            const correctValue = sudokuSolution[r][c];
            if (isValidPlacement(currentBoard, r, c, correctValue)) {
              availableCellsForHint.push({ row: r, col: c, value: correctValue });
            }
          }
        }
      }
    }

    // Shuffle availableCellsForHint to pick random valid cells
    for (let i = availableCellsForHint.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCellsForHint[i], availableCellsForHint[j]] = [availableCellsForHint[j], availableCellsForHint[i]];
    }

    for (let i = 0; i < Math.min(3, availableCellsForHint.length); i++) {
      const { row, col, value } = availableCellsForHint[i];
      currentBoard[row][col] = value; // Update the board state
      hintedCells.push({row, col}); // Store coordinates of the hinted cell
      hintsGiven++;
    }

    // Volver a renderizar el tablero con las nuevas pistas
    renderBoard(currentBoard);
    saveState(); // Guardar el nuevo estado con las pistas

    if (feedbackPista) {
      if (hintsGiven > 0) {
        feedbackPista.textContent = `Se han añadido ${hintsGiven} pistas al tablero.`;
      } else {
        feedbackPista.textContent = "No hay más celdas vacías para dar pistas.";
      }
    }

    // Deshabilitar el botón principal de pista si se alcanzó el máximo de pistas
    if (pistasUsadasPuzzle >= 2) {
      if (btnPistaExtra) btnPistaExtra.disabled = true;
    }
  }

  function descartarPista() {
    if (modalPista) modalPista.style.display = "none";
  }

  if (btnPistaExtra) {
    btnPistaExtra.addEventListener("click", pedirPista);
  }
  if (btnConfirmarPista) {
    btnConfirmarPista.addEventListener("click", confirmarPista);
  }
  if (btnDescartarPista) {
    btnDescartarPista.addEventListener("click", descartarPista);
  }
  if (cerrarModalPista) {
    cerrarModalPista.addEventListener("click", descartarPista);
  }

  const btnVolverAtras = document.getElementById("btn-volver-atras");
  const btnIrAdelanteButton = document.getElementById("btn-ir-adelante");

  if (btnVolverAtras) {
    btnVolverAtras.addEventListener("click", () => {
      history.back(); // Vuelve a la pantalla anterior en el historial del navegador
    });
  }

  if (btnIrAdelanteButton) {
    btnIrAdelanteButton.addEventListener("click", () => {
      const modalSudokuResuelto = document.getElementById('modal-sudoku-resuelto');
      if (modalSudokuResuelto) {
        openOverlayModal(modalSudokuResuelto);
      }
    });
  }

  // --- LÓGICA DEL TEMPORIZADOR ---
  function startTimer() {
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("¡Se acabó el tiempo! Fin del juego.");
        // Redirigir o reiniciar el juego
        window.location.href = "../index.html";
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // --- FUNCIÓN PARA ENVIAR RESULTADOS DE LA PARTIDA ---
  function sendGameResult() {
    const gameData = {
      id_usuario: 1, // Asume un ID de usuario fijo o cárgalo de localStorage
      modo_juego: gameMode,
      pistas_usadas: totalPistasUsadas,
      resultado: 1 // 1 para éxito, 0 para fallo
    };

    if (gameMode === 'score') {
      gameData.puntuacion_final = score;
      gameData.tiempo_restante_final = null;
    } else if (gameMode === 'time') {
      gameData.puntuacion_final = null;
      gameData.tiempo_restante_final = timeLeft;
    }

    fetch('../controller/guardarPartida.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Respuesta del servidor al guardar partida:', data);
      if (data.success) {
        console.log('Partida guardada con éxito.');
      } else {
        console.error('Error al guardar partida:', data.mensaje);
      }
    })
    .catch((error) => {
      console.error('Error en la solicitud de guardar partida:', error);
    });
  }

  // --- GESTIÓN DE MODALES SUPERPUESTOS ---
  let activeGameModal = null;

  function openOverlayModal(modal) {
    const gameModals = document.querySelectorAll('.modal-overlay'); // Selecciona todos los modales con esta clase
    gameModals.forEach(m => {
      if (m.style.display === 'flex') {
        activeGameModal = m;
        m.style.display = 'none';
      }
    });
    if (modal) modal.style.display = 'flex';
  }

  function closeOverlayModal(modal) {
    if (modal) modal.style.display = 'none';
    if (activeGameModal) {
      activeGameModal.style.display = 'flex';
      activeGameModal = null;
    }
  }

  // --- MODAL DE PERFIL ---
  const btnPerfil = document.getElementById('btn-perfil');
  const modalPerfil = document.getElementById('modal-perfil');
  const cerrarModalPerfil = document.getElementById('cerrar-modal-perfil');
  const btnCambiarImg = document.getElementById('btn-cambiar-img');
  const inputPerfilImg = document.getElementById('input-perfil-img');
  const perfilImgPreview = document.getElementById('perfil-img-preview');

  if (btnPerfil) {
      btnPerfil.addEventListener('click', () => openOverlayModal(modalPerfil));
  }
  if (cerrarModalPerfil) {
      cerrarModalPerfil.addEventListener('click', () => closeOverlayModal(modalPerfil));
  }
  if (btnCambiarImg) {
      btnCambiarImg.addEventListener('click', () => {
        if (inputPerfilImg) inputPerfilImg.click();
      });
  }

  if (inputPerfilImg) {
      inputPerfilImg.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
              const reader = new FileReader();
              reader.onload = (event) => {
                  if (perfilImgPreview) perfilImgPreview.src = event.target.result;
              };
              reader.readAsDataURL(e.target.files[0]);
          }
      });
  }

  // --- MODAL DE RANKING ---
  const btnRanking = document.getElementById('btn-ranking');
  const modalRanking = document.getElementById('modal-ranking');
  const cerrarModalRanking = document.getElementById('cerrar-modal-ranking');
  const tablaRankingBody = document.querySelector('#tabla-ranking tbody');

  function cargarRanking() {
      if (!tablaRankingBody) return;
      tablaRankingBody.innerHTML = '';

      fetch('../controller/obtenerRanking.php')
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  const scoreRanking = data.ranking.score || [];
                  scoreRanking.forEach((item, index) => {
                      const row = document.createElement('tr');
                      row.innerHTML = `
                          <td>${index + 1}</td>
                          <td>${item.jugador}</td>
                          <td>${item.valor} pts</td>
                      `;
                      tablaRankingBody.appendChild(row);
                  });

                  if (scoreRanking.length > 0 && (data.ranking.time || []).length > 0) {
                      const separatorRow = document.createElement('tr');
                      separatorRow.innerHTML = `<td colspan="3" style="text-align: center; font-weight: bold; background-color: rgba(255,255,255,0.1);">--- Ranking por Tiempo ---</td>`;
                      tablaRankingBody.appendChild(separatorRow);
                  }

                  const timeRanking = data.ranking.time || [];
                  timeRanking.forEach((item, index) => {
                      const row = document.createElement('tr');
                      row.innerHTML = `
                          <td>${index + 1}</td>
                          <td>${item.jugador}</td>
                          <td>${formatTime(item.valor)}</td>
                      `;
                      tablaRankingBody.appendChild(row);
                  });

              } else {
                  console.error('Error al obtener ranking:', data.mensaje);
                  tablaRankingBody.innerHTML = `<tr><td colspan="3">Error al cargar el ranking: ${data.mensaje}</td></tr>`;
              }
          })
          .catch(error => {
              console.error('Error en la solicitud de ranking:', error);
              tablaRankingBody.innerHTML = `<tr><td colspan="3">Error de conexión al cargar el ranking.</td></tr>`;
          });
  }

  if (btnRanking) {
      btnRanking.addEventListener('click', () => {
          cargarRanking();
          openOverlayModal(modalRanking);
      });
  }

  if (cerrarModalRanking) {
      cerrarModalRanking.addEventListener('click', () => closeOverlayModal(modalRanking));
  }

  window.addEventListener('click', (e) => {
      if (e.target === modalPerfil) closeOverlayModal(modalPerfil);
      if (e.target === modalRanking) closeOverlayModal(modalRanking);
      if (e.target === modalPista) closeOverlayModal(modalPista);
  });

  // Manejador global para soltar fuera de las celdas del sudoku
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault(); // Permite el drop en el body
  });

  document.body.addEventListener('drop', (e) => {
    const source = e.dataTransfer.getData("source");
    const originalRow = e.dataTransfer.getData("originalRow");
    const originalCol = e.dataTransfer.getData("originalCol");

    // Si el arrastre viene del tablero y se suelta fuera de una celda TD
    if (source === "board" && e.target.tagName !== 'TD') {
      const originalCell = document.querySelector(`[data-row="${originalRow}"][data-col="${originalCol}"]`);
      if (originalCell) {
        originalCell.innerHTML = "";
        originalCell.dataset.value = "";
        saveState();
        loadState(history[history.length - 1]);
      }
    }
  });

  inicializarJuegoSudoku();

  // Lógica del botón Resolver/Continuar
  if (solveButton) {
    solveButton.addEventListener('click', handleSolveButton);
  }

  // Lógica del botón Continuar del modal del pergamino
  // Lógica del botón Continuar del modal del pergamino
  const btnAvanzarSudoku = document.getElementById('btn-avanzar-sudoku');
  if (btnAvanzarSudoku) {
    btnAvanzarSudoku.addEventListener('click', () => {
      // Redirigir a la escena de la jungla
      window.location.href = "../index.html#escena-jungla"; // Asumiendo que la jungla está en index.html
    });
  }

  // --- MODAL SUDOKU RESUELTO ---
  const modalSudokuResuelto = document.getElementById('modal-sudoku-resuelto');
  const cerrarModalSudokuResuelto = document.getElementById('cerrar-modal-sudoku-resuelto');
  const btnContinuarSudoku = document.getElementById('btn-continuar-sudoku');

  if (cerrarModalSudokuResuelto) {
    cerrarModalSudokuResuelto.addEventListener('click', () => closeOverlayModal(modalSudokuResuelto));
  }

  if (btnContinuarSudoku) {
    btnContinuarSudoku.addEventListener('click', () => {
      window.location.href = "../index.html#escena-jungla";
    });
  }

  window.addEventListener('click', (e) => {
      if (e.target === modalPerfil) closeOverlayModal(modalPerfil);
      if (e.target === modalRanking) closeOverlayModal(modalRanking);
      if (e.target === modalPista) closeOverlayModal(modalPista);
      if (e.target === modalSudokuResuelto) closeOverlayModal(modalSudokuResuelto);
  });
});

function renderBoard(boardState = initialPuzzle) {
  const table = document.getElementById("sudoku");
  table.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < 6; j++) {
      let cell = document.createElement("td");
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = dropHandler;

      // Eliminado: if (goldenCells.some(([r,c]) => r === i && c === j)) {
      // Eliminado:   cell.classList.add("gold");
      // Eliminado: }

      // Añadir clase para celdas con pistas
      if (hintedCells.some(hc => hc.row === i && hc.col === j)) {
        cell.classList.add("hinted-cell");
      }

      const val = boardState[i][j];
      if (val !== null) {
        if (isFigure(+val)) {
          let svg = figuras.find(f => f.id == val).svg;
          cell.innerHTML = svg;
        } else {
          cell.textContent = val;
        }
        cell.dataset.value = val;
        
        // Las celdas iniciales del puzzle y las celdas con pistas no deben ser arrastrables
        const isInitialPuzzleCell = initialPuzzle[i][j] !== null;
        const isHintedCell = hintedCells.some(hc => hc.row === i && hc.col === j);

        if (!isInitialPuzzleCell && !isHintedCell) {
          cell.draggable = true;
          cell.ondragstart = dragHandler;
          cell.dataset.originalRow = i; 
          cell.dataset.originalCol = j; 
        } else {
          cell.draggable = false; 
          cell.ondragstart = null; 
        }
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

function renderDragZone() {
  const zone = document.getElementById("dragZone");
  zone.innerHTML = "";

  figuras.forEach(f => {
    let div = document.createElement("div");
    div.classList.add("draggable");
    div.innerHTML = f.svg;
    if (f.id === 2) {
      div.style.width = "72px";
      div.style.height = "72px";
      div.querySelector('.svg-symbol').style.width = "72px";
      div.querySelector('.svg-symbol').style.height = "72px";
    }
    div.draggable = true;
    div.dataset.value = f.id;
    div.ondragstart = dragHandler;
    zone.appendChild(div);
  });
  }

function dragHandler(e) {
  e.dataTransfer.setData("value", e.currentTarget.dataset.value);
  // Comprobar si el arrastre se originó en una celda del tablero
  if (e.currentTarget.dataset.originalRow && e.currentTarget.dataset.originalCol) {
    e.dataTransfer.setData("source", "board");
    e.dataTransfer.setData("originalRow", e.currentTarget.dataset.originalRow);
    e.dataTransfer.setData("originalCol", e.currentTarget.dataset.originalCol);
  } else {
    e.dataTransfer.setData("source", "dragZone");
  }
  playSound("audioClick");
}

function dropHandler(e) {
  e.preventDefault();
  const value = e.dataTransfer.getData("value");
  const source = e.dataTransfer.getData("source");
  const originalRow = e.dataTransfer.getData("originalRow");
  const originalCol = e.dataTransfer.getData("originalCol");

  // Limpiar la celda de destino antes de colocar el nuevo valor
  e.target.innerHTML = "";
  e.target.dataset.value = "";

  if (isFigure(+value)) {
    let svg = figuras.find(f => f.id == value).svg;
    e.target.innerHTML = svg;
  }
  e.target.dataset.value = value;

  // Si el origen fue del tablero, limpiar la celda original
  if (source === "board") {
    const originalCell = document.querySelector(`[data-row="${originalRow}"][data-col="${originalCol}"]`);
    if (originalCell) {
      originalCell.innerHTML = "";
      originalCell.dataset.value = "";
    }
  }
  saveState(); // Guarda el estado después de cada movimiento
  loadState(history[history.length - 1]); // Recarga el tablero desde el último estado
}



function saveState() {
  const table = document.getElementById("sudoku");
  let currentState = [];
  for (let i = 0; i < 6; i++) {
    let row = [];
    for (let j = 0; j < 6; j++) {
      row.push(table.rows[i].cells[j].dataset.value || null);
    }
    currentState.push(row);
  }
  history.push(currentState);
}

function loadState(state) {
  renderBoard(state);
}

function deshacer() {
  if (history.length > 1) {
    history.pop(); // Elimina el estado actual
    loadState(history[history.length - 1]); // Carga el estado anterior
  }
}

function limpiar() {
  history = []; // Limpia el historial
  renderBoard(initialPuzzle); // Renderiza el tablero inicial vacío
  saveState(); // Guarda el estado inicial limpio
}


function isFigure(val) {
  return figuras.some(f => f.id === val);
}

function isValidPlacement(board, row, col, value) {
  // Check row
  for (let c = 0; c < 6; c++) {
    if (board[row][c] == value) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 6; r++) {
    if (board[r][col] == value) {
      return false;
    }
  }

  // Check 2x3 subgrid
  const startRow = Math.floor(row / 2) * 2;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] == value) {
        return false;
      }
    }
  }

  return true;
}

function isSudokuSolved() {
  const table = document.getElementById("sudoku");
  let solved = true;

  // Check rows, columns, and 2x3 subgrids
  for (let i = 0; i < 6; i++) {
    let rowValues = new Set();
    let colValues = new Set();
    for (let j = 0; j < 6; j++) {
      let cellValueRow = table.rows[i].cells[j].dataset.value;
      let cellValueCol = table.rows[j].cells[i].dataset.value;

      if (!cellValueRow || rowValues.has(cellValueRow)) {
        solved = false;
        break;
      }
      rowValues.add(cellValueRow);

      if (!cellValueCol || colValues.has(cellValueCol)) {
        solved = false;
        break;
      }
      colValues.add(cellValueCol);
    }
    if (!solved) break;
  }

  if (solved) {
    for (let blockRow = 0; blockRow < 6; blockRow += 2) {
      for (let blockCol = 0; blockCol < 6; blockCol += 3) {
        let blockValues = new Set();
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 3; j++) {
            let cellValue = table.rows[blockRow + i].cells[blockCol + j].dataset.value;
            if (!cellValue || blockValues.has(cellValue)) {
              solved = false;
              break;
            }
            blockValues.add(cellValue);
          }
          if (!solved) break;
        }
        if (!solved) break;
      }
      if (!solved) break;
    }
  }
  return solved;
}

function verificar() {
  const table = document.getElementById("sudoku");
  let correct = true;

  // Limpiar errores previos
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      table.rows[i].cells[j].classList.remove("error");
    }
  }

  // Revisión filas
  for (let i = 0; i < 6; i++) {
    let fila = [];
    for (let j = 0; j < 6; j++) {
      let cell = table.rows[i].cells[j];
      let v = cell.dataset.value;
      if (!v) {
        correct = false;
        cell.classList.add("error");
        continue;
      }
      if (fila.includes(v)) {
        correct = false;
        cell.classList.add("error");
      } else {
        fila.push(v);
      }
    }
  }

  // Revisión columnas
  for (let j = 0; j < 6; j++) {
    let col = [];
    for (let i = 0; i < 6; i++) {
      let cell = table.rows[i].cells[j];
      let v = cell.dataset.value;
      if (!v) {
        correct = false;
        cell.classList.add("error");
        continue;
      }
      if (col.includes(v)) {
        correct = false;
        cell.classList.add("error");
      } else {
        col.push(v);
      }
    }
  }

  // Revisión subcuadrículas 2x3
  for (let blockRow = 0; blockRow < 6; blockRow += 2) {
    for (let blockCol = 0; blockCol < 6; blockCol += 3) {
      let block = [];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          let cell = table.rows[blockRow + i].cells[blockCol + j];
          let v = cell.dataset.value;
          if (!v) {
            correct = false;
            cell.classList.add("error");
            continue;
          }
          if (block.includes(v)) {
            correct = false;
            cell.classList.add("error");
          } else {
            block.push(v);
          }
        }
      }
    }
  }
  return correct;
}

function obtenerCodigo() {
  const table = document.getElementById("sudoku");
  let code = "";
  for (let [r,c] of goldenCells) {
    let cell = table.rows[r].cells[c];
    code += cell.dataset.value;
  }
  return code;
}

function handleSolveButton() {
  const resultadoDiv = document.getElementById("resultado");
  const table = document.getElementById("sudoku");
  const modalPergaminoSudoku = document.getElementById('modal-pergamino-sudoku');

  if (solveButton.textContent === "Resolver") {
    if (isSudokuSolved()) {
      document.getElementById("resultado").innerHTML =
        "¡Puzzle resuelto! Código secreto: " + obtenerCodigo();
      table.classList.add("success");
      playSound("audioSuccess");
      iniciarResolucion(); // Aplica el estado resuelto a las celdas doradas
      sendGameResult(); // Enviar resultado al resolver el Sudoku
      solveButton.textContent = "Continuar";
      isSudokuSolvedOnce = true; // Marcar que el Sudoku ha sido resuelto
    } else {
      resultadoDiv.textContent = "Hay errores. Revisa filas, columnas y cuadrantes.";
      playSound("audioError");
      if (gameMode === 'score') {
        score -= 10;
        if (scoreDisplay) scoreDisplay.textContent = score;
      } else if (gameMode === 'time') {
        timeLeft -= 60; // Penalización de 1 minuto
        updateTimerDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          alert("¡Se acabó el tiempo! Fin del juego.");
          window.location.href = "../index.html";
          return;
        }
      }
    }
  } else if (solveButton.textContent === "Continuar") {
    // Ocultar el juego de Sudoku
    document.querySelector('.main-container').style.display = 'none';
    document.getElementById('outerContainer').style.display = 'none';
    document.getElementById('dragZoneContainer').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('score-container').style.display = 'none';
    document.getElementById('timer-container').style.display = 'none';
    document.querySelector('.esquina-superior-izquierda').style.display = 'none';
    document.querySelector('.esquina-superior-derecha').style.display = 'none';

    // Mostrar el nuevo modal de Sudoku Resuelto
    const modalSudokuResuelto = document.getElementById('modal-sudoku-resuelto');
    if (modalSudokuResuelto) {
      openOverlayModal(modalSudokuResuelto);
    }
  }
}

function iniciarResolucion() {
  const table = document.getElementById("sudoku");
  goldenCells.forEach(([r, c]) => {
    const cell = table.rows[r].cells[c];
    cell.classList.add("solved-gold");
  });
}

function playSound(id) {
  let audio = document.getElementById(id);
  audio.currentTime = 0;
  audio.play();
  }


