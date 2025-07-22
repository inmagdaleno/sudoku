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

// Tablero solo con números pre-rellenados:
const initialPuzzle = [
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
  [null, null, null, null, null, null],
];

const goldenCells = [
  [0,1],
  [2,4],
  [5,5]
];

window.onload = () => {
  renderBoard();
  renderDragZone();
  saveState(); // Guarda el estado inicial

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
};

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

      if (goldenCells.some(([r,c]) => r === i && c === j)) {
        cell.classList.add("gold");
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
        // Hacer la celda arrastrable si contiene un valor
        cell.draggable = true;
        cell.ondragstart = dragHandler;
        cell.dataset.originalRow = i; // Almacenar fila original
        cell.dataset.originalCol = j; // Almacenar columna original
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
  playSound("clickSound");
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

  if (correct) {
    document.getElementById("resultado").innerHTML =
      "¡Puzzle resuelto! Código secreto: " + obtenerCodigo();
    table.classList.add("success");
    playSound("successSound");
  } else {
    document.getElementById("resultado").textContent =
      "Hay errores. Revisa filas, columnas y cuadrantes.";
    playSound("errorSound");
  }
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

function playSound(id) {
  let audio = document.getElementById(id);
  audio.currentTime = 0;
  audio.play();
  }
