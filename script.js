const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');
const strikeSVG = document.querySelector('.strike');
const strikeLine = document.getElementById('strikeLine');
const turnPill = document.getElementById('turnPill');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const sideRadios = document.querySelectorAll('input[name="side"]');
const sideChooser = document.getElementById('sideChooser');
const newRoundBtn = document.getElementById('newRound');
const resetAllBtn = document.getElementById('resetAll');

const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // cols
  [0,4,8], [2,4,6]           // diagonals
];

let board = Array(9).fill(null);
let current = 'X';
let gameOver = false;
let scores = {X:0, O:0, D:0};

function isCPU(){
  return document.querySelector('input[name="mode"]:checked').value === 'cpu';
}
function humanSide(){
  return document.querySelector('input[name="side"]:checked').value; // 'X' or 'O'
}
function setStatus(txt){
  statusEl.textContent = txt;
}
function updateTurnPill(){
  turnPill.textContent = current;
  turnPill.className = 'pill ' + (current === 'X' ? 'x' : 'o');
}
function render(){
  cells.forEach((c,i)=>{
    c.textContent = board[i] || '';
    c.classList.toggle('x', board[i]==='X');
    c.classList.toggle('o', board[i]==='O');
  });
  updateTurnPill();
}
function clearStrike(){
  strikeSVG.classList.remove('show');
  strikeLine.setAttribute('x1',0);
  strikeLine.setAttribute('y1',0);
  strikeLine.setAttribute('x2',0);
  strikeLine.setAttribute('y2',0);
}
function drawStrike(combo){
  // map cell centers in a 3x3 grid to SVG viewBox 0..100
  const coord = (i)=>{
    const row = Math.floor(i/3), col = i%3;
    const x = (col * (100/3)) + (100/6);
    const y = (row * (100/3)) + (100/6);
    return [x,y];
  };
  const [a,b,c] = combo;
  const [x1,y1] = coord(a);
  const [x2,y2] = coord(c);
  strikeLine.setAttribute('x1', x1);
  strikeLine.setAttribute('y1', y1);
  strikeLine.setAttribute('x2', x2);
  strikeLine.setAttribute('y2', y2);
  strikeSVG.classList.add('show');
}
function winner(state){
  for(const line of WIN_LINES){
    const [a,b,c] = line;
    if(state[a] && state[a]===state[b] && state[a]===state[c]){
      return {player: state[a], combo: line};
    }
  }
  if(state.every(v=>v)) return {player: 'D', combo: null}; // draw
  return null;
}
function availableMoves(state){
  const arr=[];
  for(let i=0;i<9;i++) if(!state[i]) arr.push(i);
  return arr;
}

// Optimal AI using minimax (depth-limited unnecessary for 3x3)
function minimax(state, player){
  const w = winner(state);
  if(w){
    if(w.player==='X') return {score: 1};
    if(w.player==='O') return {score: -1};
    return {score: 0};
  }
  const maximizing = (player==='X');
  let best = {score: maximizing? -Infinity : Infinity, move: null};
  for(const mv of availableMoves(state)){
    state[mv] = player;
    const res = minimax(state, player==='X'?'O':'X');
    state[mv] = null;
    const score = res.score;
    if(maximizing){
      if(score > best.score){
        best = {score, move: mv};
      }
    } else {
      if(score < best.score){
        best = {score, move: mv};
      }
    }
  }
  return best;
}

function cpuMove(){
  // CPU plays the opposite of humanSide
  const cpu = humanSide()==='X' ? 'O' : 'X';
  if(gameOver) return;
  const move = minimax([...board], cpu).move;
  if(move!=null){
    makeMove(move, cpu);
  }
}

function makeMove(index, player){
  if(gameOver || board[index]) return;
  board[index] = player;
  render();
  const w = winner(board);
  if(w){
    gameOver = true;
    if(w.player==='D'){
      setStatus('Draw!');
      turnPill.textContent = 'Draw';
      turnPill.className = 'pill draw';
      scores.D++;
      scoreDEl.textContent = scores.D;
    } else {
      setStatus(`${w.player} wins!`);
      drawStrike(w.combo);
      scores[w.player]++;
      (w.player==='X'?scoreXEl:scoreOEl).textContent = scores[w.player];
    }
    disableBoard();
    return;
  }
  current = (player==='X') ? 'O' : 'X';
  setStatus(`${current} to move`);
  updateTurnPill();
  // If vs CPU and it's CPU's turn, let it think
  if(isCPU() && current !== humanSide()){
    setTimeout(cpuMove, 280);
  }
}

function handleCellClick(e){
  const i = +e.currentTarget.dataset.i;
  if(gameOver) return;
  if(isCPU()){
    if(current !== humanSide()) return; // wait your turn
    makeMove(i, current);
  } else {
    makeMove(i, current);
  }
}
function handleCellKey(e){
  if(e.key==='Enter' || e.key===' '){
    e.preventDefault();
    e.currentTarget.click();
  }
}
function disableBoard(){
  cells.forEach(c=>c.classList.add('disabled'));
}
function enableBoard(){
  cells.forEach(c=>c.classList.remove('disabled'));
}
function newRound(start = 'X'){
  board = Array(9).fill(null);
  gameOver = false;
  current = start;
  clearStrike();
  enableBoard();
  render();
  setStatus(`${current} to move`);
  // If CPU mode and CPU starts
  if(isCPU()){
    if(current !== humanSide()){
      setTimeout(cpuMove, 280);
    }
    sideChooser.style.display = '';
  } else {
    sideChooser.style.display = 'none';
  }
}

// Event bindings
cells.forEach(c=>{
  c.addEventListener('click', handleCellClick);
  c.addEventListener('keydown', handleCellKey);
});
newRoundBtn.addEventListener('click', ()=> newRound(current==='X'?'O':'X'));
resetAllBtn.addEventListener('click', ()=>{
  scores={X:0,O:0,D:0};
  scoreXEl.textContent='0';
  scoreOEl.textContent='0';
  scoreDEl.textContent='0';
  newRound('X');
});
modeRadios.forEach(r=> r.addEventListener('change', ()=> newRound('X')));
sideRadios.forEach(r=> r.addEventListener('change', ()=> newRound('X')));

// Init
newRound('X');