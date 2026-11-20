/**
 * Multi-Core Cache Consistency Simulator
 * MESI Cache Coherence Protocol Logic
 */

// Initial system state
let memoryVal = 10;
let core1 = {
  value: 10,
  state: 'S' // 'M', 'E', 'S', 'I'
};
let core2 = {
  value: 10,
  state: 'S'
};

let historyLog = [];

// DOM Elements
const memValEl = document.getElementById('mem-val');
const c1ValEl = document.getElementById('c1-val');
const c1StateEl = document.getElementById('c1-state');
const c2ValEl = document.getElementById('c2-val');
const c2StateEl = document.getElementById('c2-state');
const historyListEl = document.getElementById('history-list');
const statusMsgEl = document.getElementById('status-msg');
const inputValX = document.getElementById('input-val-x');

// Helper to get formatted state text
function getStateText(state) {
  switch (state) {
    case 'M': return 'Modified (M)';
    case 'E': return 'Exclusive (E)';
    case 'S': return 'Shared (S)';
    case 'I': return 'Invalid (I)';
    default: return state;
  }
}

// Update the DOM to reflect current state
function render() {
  // Main Memory
  memValEl.textContent = memoryVal;

  // Core 1
  if (core1.state === 'I') {
    c1ValEl.textContent = 'Invalid';
    c1ValEl.className = 'card-value invalid';
  } else {
    c1ValEl.textContent = core1.value;
    c1ValEl.className = 'card-value';
  }
  c1StateEl.textContent = getStateText(core1.state);
  c1StateEl.className = `state-badge state-${core1.state.toLowerCase()}`;

  // Core 2
  if (core2.state === 'I') {
    c2ValEl.textContent = 'Invalid';
    c2ValEl.className = 'card-value invalid';
  } else {
    c2ValEl.textContent = core2.value;
    c2ValEl.className = 'card-value';
  }
  c2StateEl.textContent = getStateText(core2.state);
  c2StateEl.className = `state-badge state-${core2.state.toLowerCase()}`;

  // Operation History (newest first)
  if (historyLog.length === 0) {
    historyListEl.innerHTML = '<li class="empty-history-text">No operations performed yet.</li>';
  } else {
    historyListEl.innerHTML = historyLog.map(entry => {
      let extraClass = '';
      if (entry.includes('wrote')) extraClass = 'write-op';
      if (entry.includes('Invalid')) extraClass = 'invalid-op';
      return `<li class="history-item ${extraClass}">${entry}</li>`;
    }).join('');
  }
}

// Add an entry to the top of the history list
function addHistory(message) {
  historyLog.unshift(message);
  statusMsgEl.classList.add('hidden'); // Hide reset notice on new operations
  render();
}

// ---------------------------------------------------------------------------
// MESI PROTOCOL OPERATIONS
// ---------------------------------------------------------------------------

// Core 1: Read X
function readCore1() {
  if (core1.state !== 'I') {
    // Read Hit
    addHistory(`Core 1 read X = ${core1.value}`);
  } else {
    // Read Miss
    if (core2.state === 'M') {
      // Core 2 holds modified data -> write back to RAM
      memoryVal = core2.value;
      core2.state = 'S';
      core1.value = memoryVal;
      core1.state = 'S';
      addHistory(`Core 1 read X = ${core1.value}`);
      addHistory(`Core 2 wrote back modified data to Memory; both caches now Shared`);
    } else if (core2.state === 'E' || core2.state === 'S') {
      core2.state = 'S';
      core1.value = memoryVal;
      core1.state = 'S';
      addHistory(`Core 1 read X = ${core1.value}`);
    } else {
      // Core 2 is Invalid -> Core 1 gets Exclusive
      core1.value = memoryVal;
      core1.state = 'E';
      addHistory(`Core 1 read X = ${core1.value}`);
    }
  }
}

// Core 2: Read X
function readCore2() {
  if (core2.state !== 'I') {
    // Read Hit
    addHistory(`Core 2 read X = ${core2.value}`);
  } else {
    // Read Miss
    if (core1.state === 'M') {
      // Core 1 holds modified data -> write back to RAM
      memoryVal = core1.value;
      core1.state = 'S';
      core2.value = memoryVal;
      core2.state = 'S';
      addHistory(`Core 2 read X = ${core2.value}`);
      addHistory(`Core 1 wrote back modified data to Memory; both caches now Shared`);
    } else if (core1.state === 'E' || core1.state === 'S') {
      core1.state = 'S';
      core2.value = memoryVal;
      core2.state = 'S';
      addHistory(`Core 2 read X = ${core2.value}`);
    } else {
      // Core 1 is Invalid -> Core 2 gets Exclusive
      core2.value = memoryVal;
      core2.state = 'E';
      addHistory(`Core 2 read X = ${core2.value}`);
    }
  }
}

// Core 1: Write X
function writeCore1() {
  const newVal = parseInt(inputValX.value, 10);
  if (isNaN(newVal)) {
    alert('Please enter a valid number for X');
    return;
  }

  const wasCore2Valid = core2.state !== 'I';

  core1.value = newVal;
  core1.state = 'M';
  core2.state = 'I';

  if (wasCore2Valid) {
    addHistory(`Core 2 cache copy is now Invalid`);
  }
  addHistory(`Core 1 wrote X = ${newVal}`);
}

// Core 2: Write X
function writeCore2() {
  const newVal = parseInt(inputValX.value, 10);
  if (isNaN(newVal)) {
    alert('Please enter a valid number for X');
    return;
  }

  const wasCore1Valid = core1.state !== 'I';

  core2.value = newVal;
  core2.state = 'M';
  core1.state = 'I';

  if (wasCore1Valid) {
    addHistory(`Core 1 cache copy is now Invalid`);
  }
  addHistory(`Core 2 wrote X = ${newVal}`);
}

// Reset Simulator
function resetSimulator() {
  core1.value = 10;
  core1.state = 'S';
  core2.value = 10;
  core2.state = 'S';
  memoryVal = 10;
  historyLog = [];

  statusMsgEl.textContent = 'Simulator Reset Successfully';
  statusMsgEl.classList.remove('hidden');

  render();
}

// ---------------------------------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-read-c1').addEventListener('click', readCore1);
  document.getElementById('btn-read-c2').addEventListener('click', readCore2);
  document.getElementById('btn-write-c1').addEventListener('click', writeCore1);
  document.getElementById('btn-write-c2').addEventListener('click', writeCore2);
  document.getElementById('btn-reset').addEventListener('click', resetSimulator);

  render();
});
