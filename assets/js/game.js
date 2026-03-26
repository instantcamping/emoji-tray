// ── 사운드 ─────────────────────────────────────────────
const SFX = {
  bgm:        new Audio('assets/sounds/bgm.mp3'),
  put:        new Audio('assets/sounds/put.mp3'),
  drop:       new Audio('assets/sounds/drop.mp3'),
  levelup:    new Audio('assets/sounds/levelup.mp3'),
  winner:     new Audio('assets/sounds/winner.mp3'),
  end:        new Audio('assets/sounds/end.mp3'),
  start:      new Audio('assets/sounds/start.mp3'),
  item:       new Audio('assets/sounds/item.mp3'),
  goldentime: new Audio('assets/sounds/goldentime.mp3'),
};
SFX.bgm.loop = true;
SFX.bgm.volume = 0.5;
SFX.goldentime.loop = true;
SFX.goldentime.volume = 0.5;
SFX.put.volume = 0.7;
SFX.drop.volume = 0.8;
SFX.start.volume = 0.8;
SFX.item.volume = 0.8;
SFX.levelup.volume = 0.8;
SFX.winner.volume = 0.8;
SFX.end.volume = 0.8;

let soundMuted = false;

function setMute(muted) {
  soundMuted = muted;
  Object.values(SFX).forEach(s => s.muted = muted);
  const btn = document.getElementById('soundToggleBtn');
  if(btn) btn.textContent = muted ? '🔇' : '🔊';
  if(!muted && running && SFX.bgm.paused && !goldenTime) {
    resumeBGM();
  }
}

function playBGM()  { SFX.bgm.currentTime = 0; SFX.bgm.play().catch(()=>{}); }
function pauseBGM() { SFX.bgm.pause(); }
function resumeBGM(){ SFX.bgm.play().catch(()=>{}); }
function stopBGM()  { SFX.bgm.pause(); SFX.bgm.currentTime = 0; }
function playSFX(key) { const s = SFX[key]; if(!s || soundMuted) return; s.currentTime = 0; s.play().catch(()=>{}); }

// ── 이모지 데이터 ──────────────────────────────────────
const EMOJI_DATA = [
  // 100점 (w:0.1) - 가볍지만 고점수 2개
  {e:'🪙',w:0.1,pts:100},{e:'💰',w:0.1,pts:100},
  // 1점 (w:0.1) - 깃털급 4개
  {e:'🌿',w:0.1},{e:'🍃',w:0.1},{e:'🦋',w:0.1},{e:'🌸',w:0.1},
  // 5점 (w:0.5) - 가벼운 7개
  {e:'🌽',w:0.5},{e:'🥜',w:0.5},{e:'🍫',w:0.5},
  {e:'🫐',w:0.5},{e:'🍯',w:0.5},{e:'🧂',w:0.5},{e:'🍡',w:0.5},
  // 10점 (w:1.0) - 보통 14개
  {e:'🥩',w:1.0},{e:'🌭',w:1.0},{e:'🍖',w:1.0},{e:'🥓',w:1.0},
  {e:'🧅',w:1.0},{e:'🥔',w:1.0},{e:'🍄',w:1.0},{e:'🌶️',w:1.0},
  {e:'🥕',w:1.0},{e:'🫑',w:1.0},{e:'🧄',w:1.0},{e:'🥚',w:1.0},
  {e:'🍞',w:1.0},{e:'🥐',w:1.0},
  // 20점 (w:2.0) - 무거운 9개
  {e:'🍕',w:2.0},{e:'🥘',w:2.0},{e:'🍳',w:2.0},
  {e:'🧀',w:2.0},{e:'🥧',w:2.0},{e:'🍗',w:2.0},{e:'🥙',w:2.0},
  {e:'🍔',w:2.0},{e:'🫕',w:2.0},
  // 30점 (w:3.0) - 아주무거운 7개
  {e:'🎸',w:3.0},{e:'🏕️',w:3.0},{e:'🔥',w:3.0},
  {e:'🪵',w:3.0},{e:'🏆',w:3.0},{e:'🎁',w:3.0},{e:'🐻',w:3.0},
  // 50점 (w:5.0) - 초무거운 4개
  {e:'🪨',w:5.0},{e:'🦌',w:5.0},{e:'🦁',w:5.0},{e:'🐻‍❄️',w:5.0},
];
const GIANT_EMOJI = [
  {e:'🐻',w:10},{e:'🦛',w:10},{e:'🗿',w:10},{e:'⚓',w:10},
  {e:'🧱',w:10},{e:'🏔️',w:10},{e:'🪨',w:10},{e:'🏋️',w:10},
];
// 특수 이모지 (모든 레벨에서 등장, 15% 확률)
const SPECIAL_EMOJI = [
  {e:'💣',w:0}, // 폭탄: 전체 제거 (리셋)
  {e:'🧊',w:0}, // 얼음: 기울기 동결 (방어)
  {e:'🧲',w:0}, // 자석: 주변 끌어당기기
  {e:'⭐',w:0}, // 별: 골든타임 (쟁반 위 이모지를 별로 변환, 클릭하면 10점)
];
const SPECIAL_RATE = 0.15;
// 랜덤박스
const MYSTERY_EMOJI = {e:'❓', w:0, special:true, mystery:true};
const MYSTERY_RATE = 0.08;

// ── 쟁반 SVG 좌표계 상수 ───────────────────────────────
// SVG viewBox: 35 45 490 330
// 쟁반 타원 중심: (280, 172), rx=228, ry=108
const VB_X = 35, VB_Y = 45, SVG_W = 490, SVG_H = 330;
const TRAY_CX = 280, TRAY_CY = 172; // 타원 중심
const TRAY_RX = 222, TRAY_RY = 102; // 이모지 배치 가능 반경 (테두리 안쪽)

const DANGER_WARN = 0.65;

// ── 레벨 시스템 ─────────────────────────────────────────
const LEVELS = [
  { goal:100,   autoDrop:10000, floorCount:10, tiltLimit:46, maxWeight:1.0, giantRate:0    },
  { goal:500,   autoDrop:10000, floorCount:10, tiltLimit:38, maxWeight:2.0, giantRate:0    },
  { goal:1000,  autoDrop:10000, floorCount:10, tiltLimit:32, maxWeight:3.0, giantRate:0.05 },
  { goal:5000,  autoDrop:5000,  floorCount:10, tiltLimit:32, maxWeight:5.0, giantRate:0.10 },
  { goal:10000, autoDrop:5000,  floorCount:10, tiltLimit:30, maxWeight:7.0, giantRate:0.12 },
  { goal:Infinity, autoDrop:5000, floorCount:10, tiltLimit:28, maxWeight:10,  giantRate:0.15 },
];
let level = 1;
let TILT_LIMIT = 46, FLOOR_COUNT = 10, AUTO_DROP_DELAY = 10000;
let currentGoal = 100, currentMaxWeight = 1.0, currentGiantRate = 0;

function applyLevel(lv) {
  const cfg = LEVELS[lv - 1];
  TILT_LIMIT = cfg.tiltLimit;
  FLOOR_COUNT = cfg.floorCount;
  AUTO_DROP_DELAY = cfg.autoDrop;
  currentGoal = cfg.goal;
  currentMaxWeight = cfg.maxWeight;
  currentGiantRate = cfg.giantRate;
}

// ── 상태 ───────────────────────────────────────────────
let items=[], tiltX=0, tiltY=0, running=false, rafId=null, shakeTimer=0;
let frozen=false, frozenTimer=null;
let goldenTime=false, goldenTimer=null;
let score=0, best = parseInt(localStorage.getItem('trayBest5')||'0');
let floorItems=[], nextId=0, dragging=null;

function toPoints(w){ return Math.round(w * 10); }

// ── Firestore 랭킹 헬퍼 ─────────────────────────────────
async function loadLeaderboard() {
  try {
    const fb = window._fb; if(!fb) return [];
    const q = fb.query(fb.collection(fb.db,'rankings'), fb.orderBy('score','desc'), fb.limit(10));
    const snap = await fb.getDocs(q);
    const list = [];
    snap.forEach(doc => list.push(doc.data()));
    return list;
  } catch(e) { console.warn('랭킹 로드 실패:', e); return []; }
}
async function saveScore(name, sc, email) {
  try {
    const fb = window._fb; if(!fb) return;
    const data = { name: name, score: sc, date: new Date().toISOString(), email: email };
    await fb.addDoc(fb.collection(fb.db,'rankings'), data);
  } catch(e) { console.warn('점수 저장 실패:', e); }
}
async function isTopTen(sc) {
  const board = await loadLeaderboard();
  if(board.length < 10) return true;
  return sc > board[board.length - 1].score;
}
function renderLeaderboard(board, myScore, myName) {
  const container = document.getElementById('goLbList');
  container.innerHTML = '';
  if(board.length === 0) {
    container.innerHTML = '<div class="go-lb-empty">아직 기록이 없습니다</div>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'go-lb-table';
  table.innerHTML = '<thead><tr><th>순위</th><th>닉네임</th><th>점수</th></tr></thead>';
  const tbody = document.createElement('tbody');
  board.forEach((entry, i) => {
    const tr = document.createElement('tr');
    const isMe = entry.name === myName && entry.score === myScore;
    if(isMe) tr.className = 'me';
    const rankClass = i===0?' gold':i===1?' silver':i===2?' bronze':'';
    const medal = i===0?'🥇 ':i===1?'🥈 ':i===2?'🥉 ':'';
    tr.innerHTML = `<td class="go-lb-rank${rankClass}">${medal}${i+1}</td>`
      + `<td class="go-lb-name">${entry.name}</td>`
      + `<td class="go-lb-score">${entry.score}점</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// ── 축하 컨페티 ──────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#FF8C42','#FF6B2B','#4ECDC4','#7CFC00','#3CB371','#E84040','#40C870','#FFA07A','#FFF'];
  const shapes = ['square','circle','rect'];
  const count = 60;
  for(let i=0; i<count; i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    const color = colors[Math.floor(Math.random()*colors.length)];
    const shape = shapes[Math.floor(Math.random()*shapes.length)];
    const size = 6 + Math.random()*8;
    const left = Math.random()*100;
    const dur = 2 + Math.random()*2;
    const delay = Math.random()*1.2;
    const spin = 360 + Math.random()*720;
    const fallDist = window.innerHeight + 50;

    el.style.cssText = `
      left:${left}vw;
      width:${shape==='rect'?size*2.5:size}px;
      height:${size}px;
      background:${color};
      border-radius:${shape==='circle'?'50%':'2px'};
      --fall-dur:${dur}s;
      --fall-dist:${fallDist}px;
      --spin:${spin}deg;
      animation-delay:${delay}s;
      opacity:0;
    `;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), (dur+delay)*1000 + 100);
  }
}

let lastDropTime=0;

const scene        = document.getElementById('scene');
const trayGroup    = document.getElementById('trayGroup');
const dropZone     = document.getElementById('dropZone');
const dropHighlight= document.getElementById('dropHighlight');
const floorShelf   = document.getElementById('floorShelf');
const ghost        = document.getElementById('dragGhost');
const startOverlay = document.getElementById('startOverlay');
const goOverlay    = document.getElementById('gameoverOverlay');
const canvas       = document.getElementById('emojiCanvas');
const ctx          = canvas.getContext('2d');
const countdownTimer = document.getElementById('countdownTimer');
const countdownRing  = document.getElementById('countdownRing');
const countdownText  = document.getElementById('countdownText');
const RING_CIRCUM    = 2 * Math.PI * 18; // ≈113.1

document.getElementById('bestVal').textContent = best;
document.getElementById('goBest').textContent  = best;

// ── 캔버스 크기 = scene 크기 ──────────────────────────
function syncCanvas() {
  const r = scene.getBoundingClientRect();
  canvas.width  = r.width;
  canvas.height = r.height;
}

// SVG 좌표 → 씬 픽셀 좌표 변환
function svgToScene(sx, sy) {
  const r = scene.getBoundingClientRect();
  return {
    x: (sx - VB_X) / SVG_W * r.width,
    y: (sy - VB_Y) / SVG_H * r.height,
  };
}

// 씬 픽셀 → SVG 좌표
function sceneToSvg(px, py) {
  const r = scene.getBoundingClientRect();
  return {
    x: px / r.width  * SVG_W + VB_X,
    y: py / r.height * SVG_H + VB_Y,
  };
}

// 클라이언트 좌표 → SVG 좌표
function clientToSvg(cx, cy) {
  const r = scene.getBoundingClientRect();
  return {
    x: (cx - r.left) / r.width  * SVG_W + VB_X,
    y: (cy - r.top)  / r.height * SVG_H + VB_Y,
  };
}

// 쟁반 위인지 (SVG 좌표 기준)
function isOnTray(sx, sy) {
  const dx = (sx - TRAY_CX) / TRAY_RX;
  const dy = (sy - TRAY_CY) / TRAY_RY;
  return dx*dx + dy*dy <= 1;
}

// ── 이모지 폰트 크기 (무게 비례) ──────────────────────
function emojiSize(w) {
  const sceneW = scene.getBoundingClientRect().width;
  const base = sceneW * 0.068; // 기본 크기
  const effectiveW = Math.max(w, 0.1); // 무게 0도 1점(0.1) 크기로
  const t = Math.sqrt((Math.min(effectiveW,10) - 0.1) / 9.9); // 0~1
  return Math.round(base * (1 + t * 3.5));
}

// ── 창고 이모지 ────────────────────────────────────────
function randED() {
  if(currentGiantRate > 0 && Math.random() < currentGiantRate) {
    return GIANT_EMOJI[Math.floor(Math.random()*GIANT_EMOJI.length)];
  }
  if(Math.random() < MYSTERY_RATE) {
    return {...MYSTERY_EMOJI};
  }
  if(Math.random() < SPECIAL_RATE) {
    const pool = SPECIAL_EMOJI.filter(s => s.e !== '⭐' || level >= 3);
    if(pool.length > 0) {
      const sp = pool[Math.floor(Math.random()*pool.length)];
      return {...sp, special:true};
    }
  }
  const pool = EMOJI_DATA.filter(d => d.w <= currentMaxWeight);
  return pool[Math.floor(Math.random()*pool.length)];
}

function addFloorItem() {
  let d = randED();
  // 같은 이모지 중복 불허 (최대 15회 재시도)
  for(let retry = 0; retry < 15; retry++) {
    if(!floorItems.some(f => f.e === d.e)) break;
    d = randED();
  }
  const id = nextId++;
  const el = document.createElement('div');
  el.className = 'e-chip' + (d.w>=10?' giant':'') + (d.special?' special':'') + (d.mystery?' mystery':'') + (d.e==='⭐'?' star':'') + (d.pts?' coin':'');
  el.dataset.id = id;
  const emojiSpan = document.createTextNode(d.e);
  el.appendChild(emojiSpan);
  const badge = document.createElement('span');
  badge.className = 'pts';
  badge.textContent = d.mystery ? '?' : (d.special ? '★' : (d.pts || toPoints(d.w)));
  el.appendChild(badge);
  el.addEventListener('mousedown',  ev => startDrag(ev, d, el));
  el.addEventListener('touchstart', ev => startDragTouch(ev, d, el), {passive:false});
  floorShelf.appendChild(el);
  floorItems.push({...d, id, el});
}
function removeFloorItem(el) {
  const i = floorItems.findIndex(f=>f.el===el);
  if(i!==-1) floorItems.splice(i,1);
  el.remove(); addFloorItem();
}
function initFloor() {
  floorShelf.innerHTML=''; floorItems=[];
  for(let i=0;i<FLOOR_COUNT;i++) addFloorItem();
}

// ── 드래그 ─────────────────────────────────────────────
function startDrag(e, data, sourceEl) {
  if(!running) return; e.preventDefault();
  dragging={data,sourceEl};
  sourceEl.classList.add('dragging');
  ghost.textContent = data.e;
  ghost.style.fontSize = data.w>=10 ? '3.6rem' : '2.4rem';
  ghost.style.display = 'block';
  moveGhost(e.clientX, e.clientY);
}
function startDragTouch(e, data, sourceEl) {
  if(!running) return; e.preventDefault();
  dragging={data,sourceEl};
  sourceEl.classList.add('dragging');
  ghost.textContent = data.e;
  ghost.style.fontSize = data.w>=10 ? '3.6rem' : '2.4rem';
  ghost.style.display = 'block';
  moveGhost(e.touches[0].clientX, e.touches[0].clientY);
}
document.addEventListener('mousemove', e=>{ if(!dragging)return; moveGhost(e.clientX,e.clientY); hoverCheck(e.clientX,e.clientY); });
document.addEventListener('mouseup',   e=>{ if(!dragging)return; ghost.style.display='none'; dropHighlight.setAttribute('opacity','0'); if(!tryDrop(e.clientX,e.clientY)) dragging.sourceEl.classList.remove('dragging'); dragging=null; });
document.addEventListener('touchmove', e=>{ if(!dragging)return; e.preventDefault(); moveGhost(e.touches[0].clientX,e.touches[0].clientY); hoverCheck(e.touches[0].clientX,e.touches[0].clientY); },{passive:false});
document.addEventListener('touchend',  e=>{ if(!dragging)return; ghost.style.display='none'; dropHighlight.setAttribute('opacity','0'); if(!tryDrop(e.changedTouches[0].clientX,e.changedTouches[0].clientY)) dragging.sourceEl.classList.remove('dragging'); dragging=null; });

function moveGhost(cx,cy){ ghost.style.left=cx+'px'; ghost.style.top=cy+'px'; spawnSparkles(cx,cy); }

// ── 반짝이 꼬리 ──────────────────────────────────────────
const SPARKLE_COLORS = ['#FF8C42','#FF6B2B','#FFD700','#7CFC00','#3CB371','#FFA07A','#fff'];
let lastSparkleTime = 0;
function spawnSparkles(cx, cy) {
  const now = performance.now();
  if(now - lastSparkleTime < 25) return; // 간격 제한
  lastSparkleTime = now;
  const count = 2 + Math.floor(Math.random()*2);
  for(let i=0; i<count; i++){
    const el = document.createElement('div');
    el.className = 'sparkle';
    const size = 4 + Math.random()*8;
    const color = SPARKLE_COLORS[Math.floor(Math.random()*SPARKLE_COLORS.length)];
    const ox = (Math.random()-.5)*24;
    const oy = (Math.random()-.5)*24;
    el.style.cssText = `left:${cx+ox}px;top:${cy+oy}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size*2}px ${color};animation:sparkle-fade ${800+Math.random()*700}ms ease-out forwards;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', ()=>el.remove());
  }
}

function hoverCheck(cx,cy) {
  const sv = clientToSvg(cx,cy);
  const on = isOnTray(sv.x, sv.y);
  dropHighlight.setAttribute('stroke', on?'rgba(255,140,66,0.8)':'rgba(255,140,66,0)');
  dropHighlight.setAttribute('opacity', on?'1':'0');
}

// 겹침 체크: 반경 내 이모지 수
const OVERLAP_RADIUS = 35; // SVG 좌표 기준 반경
const MAX_OVERLAP = 2;     // 최대 2개까지 (3개째부터 금지)
function countNearby(sx, sy) {
  let n = 0;
  for(const it of items) {
    const dx = it.sx - sx, dy = it.sy - sy;
    if(Math.sqrt(dx*dx + dy*dy) < OVERLAP_RADIUS) n++;
  }
  return n;
}

function showOverlapToast(cx, cy) {
  const el = document.createElement('div');
  el.className = 'overlap-toast';
  el.textContent = '⚠ 같은 곳에 3개 이상 올릴 수 없어요!';
  document.body.appendChild(el);
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  let left = cx - rect.width / 2;
  if(left < 8) left = 8;
  if(left + rect.width > vw - 8) left = vw - 8 - rect.width;
  el.style.left = left + 'px';
  el.style.top = (cy - 30) + 'px';
  setTimeout(() => el.remove(), 1500);
}

function tryDrop(cx,cy) {
  if(goldenCountdownActive || goldenTime) return false;
  const sv = clientToSvg(cx,cy);
  if(!isOnTray(sv.x, sv.y)) return false;
  // 특수 이모지는 겹침 체크 무시
  const isSpecial = dragging.data.e === '💣' || dragging.data.e === '🧊' || dragging.data.e === '🧲' || dragging.data.e === '⭐' || dragging.data.mystery;
  if(!isSpecial) {
    if(countNearby(sv.x, sv.y) >= MAX_OVERLAP) { showOverlapToast(cx, cy); return false; }
  }
  // 랜덤박스: 랜덤 특수효과 발동
  if(dragging.data.mystery) {
    removeFloorItem(dragging.sourceEl);
    mysteryActivate(cx, cy, sv.x, sv.y);
    return true;
  }
  // 폭탄: 쟁반에 추가하지 않고 바로 폭발
  if(dragging.data.e === '💣') {
    removeFloorItem(dragging.sourceEl);
    bombExplode();
    return true;
  }
  // 얼음: 쟁반에 추가하지 않고 동결 효과
  if(dragging.data.e === '🧊') {
    removeFloorItem(dragging.sourceEl);
    iceFreeze(cx, cy);
    return true;
  }
  // 자석: 쟁반에 추가하지 않고 주변 이모지 끌어당기기
  if(dragging.data.e === '🧲') {
    removeFloorItem(dragging.sourceEl);
    magnetPull(sv.x, sv.y, cx, cy);
    return true;
  }
  // 별: 쟁반에 추가하지 않고 골든타임 발동
  if(dragging.data.e === '⭐') {
    removeFloorItem(dragging.sourceEl);
    starGoldenTime(cx, cy);
    return true;
  }
  const dropPts = dragging.data.pts || toPoints(dragging.data.w);
  items.push({sx:sv.x, sy:sv.y, e:dragging.data.e, w:dragging.data.w, dropT:performance.now()});
  score += dropPts;
  removeFloorItem(dragging.sourceEl);
  playSFX('put');
  spawnDropBurst(cx, cy);
  spawnScoreStars(cx, cy, dropPts);
  return true;
}

// ── 랜덤박스 효과 ──────────────────────────────────────────
const MYSTERY_EFFECTS = [
  {emoji:'💣', name:'폭탄'},
  {emoji:'🧊', name:'얼음'},
  {emoji:'🧲', name:'자석'},
  {emoji:'⭐', name:'골든타임'},
];
function mysteryActivate(cx, cy, svgX, svgY) {
  const effect = MYSTERY_EFFECTS[Math.floor(Math.random()*MYSTERY_EFFECTS.length)];
  // 토스트 표시
  showMysteryToast(cx, cy, effect.emoji, effect.name);
  // 랜덤박스 열리는 이펙트
  spawnMysteryBurst(cx, cy);
  // 약간의 딜레이 후 효과 발동
  setTimeout(() => {
    switch(effect.emoji) {
      case '💣': bombExplode(); break;
      case '🧊': iceFreeze(cx, cy); break;
      case '🧲': magnetPull(svgX, svgY, cx, cy); break;
      case '⭐': starGoldenTime(cx, cy); break;
    }
  }, 400);
}
function showMysteryToast(cx, cy, emoji, name) {
  const el = document.createElement('div');
  el.className = 'mystery-toast';
  el.innerHTML = `<span style="font-size:1.4rem">${emoji}</span> ${name}!`;
  document.body.appendChild(el);
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  let left = cx - rect.width / 2;
  if(left < 8) left = 8;
  if(left + rect.width > vw - 8) left = vw - 8 - rect.width;
  el.style.left = left + 'px';
  el.style.top = (cy - 50) + 'px';
  setTimeout(() => el.remove(), 1800);
}
function spawnMysteryBurst(cx, cy) {
  const icons = ['❓','❗','✨','🎲','🎰','💫'];
  const count = 14;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = icons[Math.floor(Math.random() * icons.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .5;
    const dist = 70 + Math.random() * 100;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() - .5) * 400;
    const dur = 600 + Math.random() * 500;
    const delay = Math.random() * 100;
    const fs = 1.2 + Math.random() * 1.2;
    el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 폭탄 폭발 효과: 모든 이모지 제거 + 구름 ─────────────
function bombExplode() {
  playSFX('item');
  const sceneRect = scene.getBoundingClientRect();
  // 쟁반 시각적 중앙 화면 좌표 (SVG 타원 중심 보정)
  const center = svgToScene(TRAY_CX - 20, TRAY_CY - 30);
  const trayCx = sceneRect.left + center.x;
  const trayCy = sceneRect.top + center.y;

  // 1. 화면 흔들기
  let shakeCount = 0;
  const shakeInterval = setInterval(() => {
    const sx = (Math.random() - .5) * 12;
    const sy = (Math.random() - .5) * 12;
    trayGroup.style.transform = `translate(${sx}px,${sy}px)`;
    if(++shakeCount > 8) { clearInterval(shakeInterval); trayGroup.style.transform = ''; }
  }, 40);

  // 2. 폭발 이모지 퍼지기
  const blasts = ['💥','💥','💥','🔥','🔥','💨','💨','✨'];
  for(let i = 0; i < 16; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = blasts[Math.floor(Math.random() * blasts.length)];
    const angle = (Math.PI * 2 / 16) * i + (Math.random() - .5) * .4;
    const dist = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() - .5) * 500;
    const dur = 600 + Math.random() * 500;
    const delay = Math.random() * 100;
    const fs = 1.8 + Math.random() * 1.5;
    el.style.cssText = `left:${trayCx}px;top:${trayCy}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  // 3. 구름 효과
  spawnBombCloud(trayCx, trayCy);

  // 4. 모든 이모지를 날려버리기
  for(let i = items.length - 1; i >= 0; i--) {
    spawnFallingEmoji(items[i]);
  }
  items.length = 0;
  tiltX = 0; tiltY = 0;
}

function spawnBombCloud(cx, cy) {
  const clouds = ['💨','☁️'];
  const count = 8;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'bomb-cloud';
    el.textContent = clouds[Math.floor(Math.random() * clouds.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .6;
    const dist = 40 + Math.random() * 80;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 10;
    const dur = 1200 + Math.random() * 600;
    const delay = 100 + Math.random() * 200;
    const fs = 2.5 + Math.random() * 2;
    el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 얼음 동결 효과: 10초간 기울기 고정 ────────────────────
const ICE_DURATION = 5000;

let frostFlakes = [];

function iceFreeze(screenCx, screenCy) {
  playSFX('item');
  // 이미 동결 중이면 타이머 리셋 & 기존 눈꽃 제거
  if(frozenTimer) clearTimeout(frozenTimer);
  clearFrostFlakes();

  frozen = true;

  // 서리 이펙트
  spawnIceBurst(screenCx, screenCy);

  // 쟁반에 서리 오버레이
  const overlay = document.getElementById('frostOverlay');
  overlay.classList.add('active');

  // 쟁반 주변에 ❄️ 흩뿌리기
  spawnFrostFlakes();

  // 10초 후 해제
  frozenTimer = setTimeout(() => {
    frozen = false;
    frozenTimer = null;
    overlay.classList.remove('active');
    clearFrostFlakes();
  }, ICE_DURATION);
}

function spawnFrostFlakes() {
  const sceneEl = document.getElementById('scene');
  const count = 12;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'frost-flake';
    el.textContent = '❄️';
    // 쟁반 타원 주변에 배치 (타원 가장자리~바깥)
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .4;
    const rx = 38 + Math.random() * 12; // % 단위
    const ry = 30 + Math.random() * 15;
    const x = 50 + Math.cos(angle) * rx;
    const y = 42 + Math.sin(angle) * ry;
    const fs = .8 + Math.random() * .9;
    const rot = Math.random() * 360;
    const delay = Math.random() * .5;
    el.style.cssText = `left:${x}%;top:${y}%;font-size:${fs}rem;--rot:${rot}deg;animation-delay:${delay}s;`;
    sceneEl.appendChild(el);
    frostFlakes.push(el);
  }
}

function clearFrostFlakes() {
  frostFlakes.forEach(el => {
    el.classList.add('melting');
    setTimeout(() => el.remove(), 500);
  });
  frostFlakes = [];
}

function spawnIceBurst(cx, cy) {
  const ices = ['❄️','🧊','💎','✨','❄️','❄️'];
  const count = 14;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = ices[Math.floor(Math.random() * ices.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .5;
    const dist = 60 + Math.random() * 100;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() - .5) * 300;
    const dur = 700 + Math.random() * 500;
    const delay = Math.random() * 150;
    const fs = 1.4 + Math.random() * 1.4;
    el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 자석 끌어당기기 효과 ──────────────────────────────────
function magnetPull(targetSx, targetSy, screenCx, screenCy) {
  playSFX('item');
  if(items.length === 0) return;

  // 자석 이펙트
  spawnMagnetBurst(screenCx, screenCy);

  // 반경 1/3 내 이모지만 끌어당기기
  const magnetRadius = Math.max(TRAY_RX, TRAY_RY) / 3;
  const nearby = items.filter(it => {
    const dx = it.sx - targetSx, dy = it.sy - targetSy;
    return Math.sqrt(dx * dx + dy * dy) <= magnetRadius;
  });
  if(nearby.length === 0) return;

  const pullSteps = 15;
  let step = 0;
  const pullInterval = setInterval(() => {
    step++;
    for(const it of nearby) {
      const dx = targetSx - it.sx;
      const dy = targetSy - it.sy;
      it.sx += dx * 0.15;
      it.sy += dy * 0.15;
    }
    if(step >= pullSteps) clearInterval(pullInterval);
  }, 30);
}

function spawnMagnetBurst(cx, cy) {
  const magnets = ['🧲','⚡','✨','💫'];
  const count = 12;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = magnets[Math.floor(Math.random() * magnets.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .5;
    const dist = 70 + Math.random() * 90;
    // 바깥에서 안으로 들어오는 방향 (tx/ty를 음수로)
    const startTx = Math.cos(angle) * dist;
    const startTy = Math.sin(angle) * dist;
    const dur = 600 + Math.random() * 400;
    const delay = Math.random() * 150;
    const fs = 1.0 + Math.random() * 1.0;
    el.style.cssText = `left:${cx + startTx}px;top:${cy + startTy}px;--tx:${-startTx}px;--ty:${-startTy}px;--rot:0deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 별 골든타임: 쟁반 위 이모지를 별로 변환, 클릭하면 10점 ─────
const GOLDEN_DURATION = 5000;

let goldenCountdownActive = false;

function starGoldenTime(screenCx, screenCy) {
  // 쟁반에 이모지가 없으면 무시
  if(items.length === 0) return;
  // 카운트다운 중이면 무시
  if(goldenCountdownActive) return;
  // 이미 골든타임 중이면 타이머 리셋
  if(goldenTimer) { clearTimeout(goldenTimer); }

  // 별 퍼지기 이펙트
  spawnGoldenBurst(screenCx, screenCy);

  // 창고 위에 골든타임 오버레이
  showGoldenShelfOverlay();

  // 카운트다운 중 기울기 고정 + 자동드롭 정지
  tiltX = 0; tiltY = 0;
  trayGroup.style.transform = 'rotateX(0deg) rotateY(0deg)';
  lastDropTime = performance.now();

  // 3초 카운트다운 후 골든타임 시작
  playSFX('item');
  showGoldenCountdown(() => {
    if(!running) return;
    goldenTime = true;
    pauseBGM();
    playSFX('goldentime');
    startGoldenCounter();

    // 쟁반 위 이모지를 전부 별로 변환 (20% 확률로 🌟 100점)
    items.forEach(it => {
      it.originalE = it.e;
      it.originalW = it.w;
      const isSuperStar = Math.random() < 0.2;
      it.e = isSuperStar ? '🌟' : '⭐';
      it.goldenScore = isSuperStar ? 100 : 10;
      it.golden = true;
    });

    // 쟁반 골든 오버레이 (노란 섬광)
    dropHighlight.setAttribute('stroke', 'rgba(255,215,0,0.8)');
    dropHighlight.setAttribute('stroke-width', '6');
    dropHighlight.setAttribute('opacity', '1');
    dropHighlight.classList.add('golden-flash');

    // 쟁반 골든 테두리
    floorShelf.classList.add('golden-time');

    // 기울기 0으로 리셋 (3D transform 왜곡 제거 → 터치 좌표 정확)
    tiltX = 0; tiltY = 0;
    trayGroup.style.transform = 'rotateX(0deg) rotateY(0deg)';

    // 자동드롭 타이머 리셋 (골든타임 동안 여유 확보)
    lastDropTime = performance.now();

    // 5초 후 해제
    goldenTimer = setTimeout(() => {
      endGoldenTime();
    }, GOLDEN_DURATION);
  });
}

let goldenCounterInterval = null;

function startGoldenCounter() {
  const bar = document.getElementById('goldenCounterBar');
  const txt = document.getElementById('goldenCounterText');
  let sec = Math.round(GOLDEN_DURATION / 1000);
  txt.textContent = sec;
  bar.classList.add('active');
  if(goldenCounterInterval) clearInterval(goldenCounterInterval);
  goldenCounterInterval = setInterval(() => {
    sec--;
    txt.textContent = Math.max(sec, 0);
    if(sec <= 0) { clearInterval(goldenCounterInterval); goldenCounterInterval = null; }
  }, 1000);
}

function stopGoldenCounter() {
  if(goldenCounterInterval) { clearInterval(goldenCounterInterval); goldenCounterInterval = null; }
  document.getElementById('goldenCounterBar').classList.remove('active');
}

function endGoldenTime() {
  goldenTime = false;
  goldenTimer = null;
  stopGoldenCounter();
  SFX.goldentime.loop = false;
  resumeBGM();
  floorShelf.classList.remove('golden-time');
  dropHighlight.setAttribute('opacity', '0');
  dropHighlight.setAttribute('stroke', 'rgba(255,140,66,0)');
  dropHighlight.setAttribute('stroke-width', '4');
  dropHighlight.classList.remove('golden-flash');
  hideGoldenShelfOverlay();

  // 수확되지 않은 별을 원래 이모지로 복원
  items.forEach(it => {
    if(it.golden) {
      it.e = it.originalE;
      it.w = it.originalW;
      delete it.golden;
      delete it.goldenScore;
      delete it.originalE;
      delete it.originalW;
    }
  });
}

function showGoldenCountdown(onComplete) {
  goldenCountdownActive = true;
  const el = document.createElement('div');
  el.className = 'golden-toast countdown';
  el.innerHTML = '<div class="gt-title">⭐ 골든타임</div><div class="gt-sub">별을 터치하세요</div><div class="gt-num">3</div>';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.left = (window.innerWidth / 2 - el.offsetWidth / 2) + 'px';
    el.style.top = '18%';
    el.style.opacity = '1';
  });

  const numEl = el.querySelector('.gt-num');
  let count = 3;
  const interval = setInterval(() => {
    count--;
    if(count > 0) {
      numEl.textContent = count;
      numEl.style.animation = 'none';
      numEl.offsetHeight; // reflow
      numEl.style.animation = '';
    } else {
      clearInterval(interval);
      el.style.opacity = '0';
      goldenCountdownActive = false;
      onComplete();
      setTimeout(() => el.remove(), 400);
    }
  }, 1000);
}

function showGoldenClearToast() {
  const el = document.createElement('div');
  el.className = 'golden-toast';
  el.innerHTML = '<div class="gt-title">⭐ 잘했어요!</div><div class="gt-sub">모든 별을 수확했습니다</div>';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.left = (window.innerWidth / 2 - el.offsetWidth / 2) + 'px';
    el.style.top = '18%';
    el.style.opacity = '1';
  });
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 1500);
}

let goldenShelfOverlay = null;
function showGoldenShelfOverlay() {
  if(goldenShelfOverlay) return;
  const el = document.createElement('div');
  el.className = 'golden-shelf-overlay';
  el.textContent = 'GOLDEN TIME';
  floorShelf.style.position = 'relative';
  floorShelf.appendChild(el);
  goldenShelfOverlay = el;
}
function hideGoldenShelfOverlay() {
  if(goldenShelfOverlay) {
    goldenShelfOverlay.remove();
    goldenShelfOverlay = null;
  }
}

// 쟁반 위 골든 별 클릭 수확 (기울기 0 상태에서 SVG 좌표 직접 비교)
function spawnGoldenScorePop(cx, cy, pts) {
  const el = document.createElement('div');
  el.className = 'golden-score-pop';
  el.textContent = '+' + pts;
  el.style.left = cx + 'px';
  el.style.top  = cy + 'px';
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function harvestGoldenStar(cx, cy) {
  if(!goldenTime || !running) return false;
  const sv = clientToSvg(cx, cy);
  const goldenFs = emojiSize(0.1);
  const sceneRect = scene.getBoundingClientRect();
  // 픽셀 히트 반경을 SVG 단위로 변환 (넉넉하게)
  const hitRadius = (goldenFs * 1.8) / sceneRect.width * SVG_W;

  let closest = null, closestDist = Infinity;
  for(let i = 0; i < items.length; i++) {
    const it = items[i];
    if(!it.golden) continue;
    const dx = it.sx - sv.x, dy = it.sy - sv.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < hitRadius && dist < closestDist) { closestDist = dist; closest = i; }
  }

  if(closest === null) return false;

  // 수확!
  const it = items[closest];
  const pts = it.goldenScore || 10;
  score += pts;
  items.splice(closest, 1);

  // 이펙트
  spawnDropBurst(cx, cy);
  spawnScoreStars(cx, cy, pts);
  spawnGoldenScorePop(cx, cy, pts);

  // 모든 골든 별이 수확되면 조기 종료
  if(!items.some(it => it.golden)) {
    if(goldenTimer) { clearTimeout(goldenTimer); }
    endGoldenTime();
    showGoldenClearToast();
  }

  return true;
}

function spawnGoldenBurst(cx, cy) {
  const stars = ['⭐','🌟','✨','💛','⭐','⭐'];
  const count = 16;
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = stars[Math.floor(Math.random() * stars.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .5;
    const dist = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() - .5) * 400;
    const dur = 700 + Math.random() * 500;
    const delay = Math.random() * 150;
    const fs = 1.2 + Math.random() * 1.2;
    el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 드롭 시 불꽃 + 연기 폭발 ─────────────────────────────
const FIRE_COLORS = ['#FF4500','#FF6B2B','#FF8C42','#FFD700','#FFA500'];
const SMOKE_COLORS = ['rgba(120,120,120,0.6)','rgba(90,90,90,0.5)','rgba(160,160,160,0.4)'];
function spawnDropBurst(cx, cy) {
  // 불꽃 파티클
  const fireCount = 10 + Math.floor(Math.random()*5);
  for(let i=0; i<fireCount; i++){
    const el = document.createElement('div');
    el.className = 'sparkle';
    const size = 5 + Math.random()*10;
    const color = FIRE_COLORS[Math.floor(Math.random()*FIRE_COLORS.length)];
    const angle = (Math.PI*2 / fireCount) * i + (Math.random()-.5)*.5;
    const dist = 15 + Math.random()*35;
    const ox = Math.cos(angle) * dist;
    const oy = Math.sin(angle) * dist - Math.random()*15; // 위로 치우침
    const dur = 350 + Math.random()*400;
    el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size*3}px ${color};animation:sparkle-burst ${dur}ms ease-out forwards;--sx:${ox}px;--sy:${oy}px;border-radius:40%;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', ()=>el.remove());
  }
  // 연기 파티클 (위로 올라감)
  const smokeCount = 4 + Math.floor(Math.random()*3);
  for(let i=0; i<smokeCount; i++){
    const el = document.createElement('div');
    el.className = 'sparkle';
    const size = 12 + Math.random()*16;
    const color = SMOKE_COLORS[Math.floor(Math.random()*SMOKE_COLORS.length)];
    const ox = (Math.random()-.5)*30;
    const oy = -(30 + Math.random()*50); // 위로 올라감
    const dur = 600 + Math.random()*600;
    el.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};animation:sparkle-burst ${dur}ms ease-out forwards;--sx:${ox}px;--sy:${oy}px;border-radius:50%;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', ()=>el.remove());
  }
}

// ── 점수 불꽃/연기 퍼지기 효과 ─────────────────────────────
function spawnScoreStars(cx, cy, pts) {
  const flames = ['🔥','💨','✨','🔥','🔥','💨'];
  const count = Math.min(5 + Math.floor(pts / 5), 14);
  for(let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'score-star';
    el.textContent = flames[Math.floor(Math.random() * flames.length)];
    const angle = (Math.PI * 2 / count) * i + (Math.random() - .5) * .8;
    const dist = 60 + Math.random() * 100;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 40; // 위쪽으로 더 치우침
    const rot = (Math.random() - .5) * 300;
    const dur = 600 + Math.random() * 500;
    const delay = Math.random() * 120;
    const fs = 0.7 + Math.random() * 0.7;
    el.style.cssText = `left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;--rot:${rot}deg;--dur:${dur}ms;--delay:${delay}ms;--fs:${fs}rem;`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── 물리 / 토크 ────────────────────────────────────────
function computeTorque() {
  let tx=0, ty=0;
  items.forEach(it=>{
    tx += (it.sx - TRAY_CX) / TRAY_RX * it.w;
    ty += (it.sy - TRAY_CY) / TRAY_RY * it.w;
  });
  return {tx,ty};
}

// ── 그리기 ─────────────────────────────────────────────
const DROP_ANIM_DUR = 500; // 바운스 애니메이션 길이 (ms)
function dropBounce(t) {
  // t: 0~1 진행도 → 위에서 떨어지며 말랑하게 착지
  if(t >= 1) return {scX:1, scY:1, offY:0};
  // 낙하 (0~0.35): 위에서 내려옴
  if(t < 0.35) {
    const p = t / 0.35;
    const ease = p * p; // ease-in
    return {scX: 1 - 0.1*ease, scY: 1 + 0.15*ease, offY: -60*(1-ease)};
  }
  // 착지 찌그러짐 (0.35~0.55): 납작하게 눌림
  if(t < 0.55) {
    const p = (t - 0.35) / 0.2;
    const squash = Math.sin(p * Math.PI);
    return {scX: 1 + 0.25*squash, scY: 1 - 0.3*squash, offY: 0};
  }
  // 1차 튀어오름 (0.55~0.75)
  if(t < 0.75) {
    const p = (t - 0.55) / 0.2;
    const bounce = Math.sin(p * Math.PI);
    return {scX: 1 - 0.08*bounce, scY: 1 + 0.12*bounce, offY: -15*bounce};
  }
  // 2차 미세 바운스 (0.75~1.0)
  const p = (t - 0.75) / 0.25;
  const bounce = Math.sin(p * Math.PI);
  return {scX: 1 + 0.05*bounce, scY: 1 - 0.06*bounce, offY: 0};
}

function drawEmojis() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const now = performance.now();
  const goldenFs = emojiSize(0.1); // 골든 별 통일 크기 (작게)
  items.forEach(it=>{
    const fs = it.golden ? goldenFs : emojiSize(it.w);
    const sc = svgToScene(it.sx, it.sy);

    // 바운스 애니메이션
    const elapsed = it.dropT ? (now - it.dropT) : DROP_ANIM_DUR;
    const t = Math.min(1, elapsed / DROP_ANIM_DUR);
    const {scX, scY, offY} = dropBounce(t);

    ctx.save();
    ctx.translate(sc.x, sc.y + offY);
    ctx.scale(scX, scY);
    ctx.font=`${fs}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    // 골든 별 글로우 + 크기 펄스 효과
    if(it.golden) {
      const pulse = 1 + 0.12 * Math.sin(now * 0.006);
      ctx.scale(pulse, pulse);
      const glow = 0.7 + 0.3 * Math.sin(now * 0.008);
      ctx.shadowColor=`rgba(255,215,0,${glow})`;
      ctx.shadowBlur=fs*0.8;
      ctx.shadowOffsetY=0;
      // 이중 그림자로 섬광 느낌
      ctx.fillText(it.e, 0, 0);
      ctx.shadowBlur=fs*1.5;
      ctx.shadowColor=`rgba(255,200,0,${glow*0.4})`;
    } else {
      ctx.shadowColor='rgba(0,0,0,.6)';
      ctx.shadowBlur=Math.max(6,fs*.22);
      ctx.shadowOffsetY=Math.max(2,fs*.07);
    }
    ctx.fillText(it.e, 0, 0);
    ctx.restore();
  });
}

// ── 게임 루프 ──────────────────────────────────────────
let hasShownGuide = false;

function init() {
  syncCanvas();
  level = 1;
  applyLevel(level);
  items=[]; tiltX=0; tiltY=0; shakeTimer=0; score=0; running=true; lastDropTime=performance.now();
  frozen=false; if(frozenTimer){clearTimeout(frozenTimer);frozenTimer=null;}
  frostFlakes.forEach(el=>el.remove()); frostFlakes=[];
  document.getElementById('frostOverlay').classList.remove('active');
  if(goldenTime || goldenTimer) endGoldenTime();
  goldenCountdownActive = false;
  startOverlay.style.display='none';
  goOverlay.classList.remove('show');
  document.getElementById('levelClearOverlay').classList.remove('show');
  document.body.classList.remove('no-scroll');
  trayGroup.style.transition='';
  trayGroup.style.transform='';
  initFloor(); updateHUD(0,0);
  if(rafId) cancelAnimationFrame(rafId);
  playBGM();
  loop();

  if(!hasShownGuide) {
    hasShownGuide = true;
    showDragGuide();
  }
}

function showDragGuide() {
  const finger = document.createElement('div');
  finger.className = 'drag-guide';
  finger.textContent = '👆';
  document.body.appendChild(finger);

  // 창고 첫 번째 아이템 위치 → 그릴 중앙 위치
  const shelfRect = floorShelf.getBoundingClientRect();
  const sceneRect = scene.getBoundingClientRect();
  const startX = shelfRect.left + shelfRect.width / 2;
  const startY = shelfRect.top + 20;
  const endX = sceneRect.left + sceneRect.width / 2;
  const endY = sceneRect.top + sceneRect.height * 0.45;

  finger.style.left = startX + 'px';
  finger.style.top = startY + 'px';

  let cycle = 0;
  const maxCycles = 2;

  function animate() {
    // 페이드인 + 시작 위치
    finger.style.transition = 'none';
    finger.style.left = startX + 'px';
    finger.style.top = startY + 'px';
    finger.style.opacity = '0';
    finger.style.transform = 'translate(-50%,-50%) scale(1)';

    requestAnimationFrame(() => {
      finger.style.transition = 'opacity 0.3s';
      finger.style.opacity = '1';

      // 드래그 모션 시작
      setTimeout(() => {
        finger.style.transition = 'left 1s ease-in-out, top 1s ease-in-out, transform 1s ease-in-out';
        finger.style.left = endX + 'px';
        finger.style.top = endY + 'px';
        finger.style.transform = 'translate(-50%,-50%) scale(0.85)';

        // 도착 후 페이드아웃
        setTimeout(() => {
          finger.style.transition = 'opacity 0.4s';
          finger.style.opacity = '0';

          setTimeout(() => {
            cycle++;
            if(cycle < maxCycles) animate();
            else finger.remove();
          }, 500);
        }, 1100);
      }, 400);
    });
  }

  // 유저가 드래그하면 즉시 제거
  const removeGuide = () => {
    finger.remove();
    document.removeEventListener('mousedown', removeGuide);
    document.removeEventListener('touchstart', removeGuide);
  };
  document.addEventListener('mousedown', removeGuide);
  document.addEventListener('touchstart', removeGuide);

  setTimeout(animate, 500);
}

const SLIDE_THRESHOLD = 0.15; // 기울기 비율이 이 이상이면 미끄러지기 시작
const SLIDE_SPEED = 0.35;     // 미끄러짐 속도 계수

function slideEmojis(danger) {
  if(danger < SLIDE_THRESHOLD) return;
  const slideFactor = (danger - SLIDE_THRESHOLD) / (1 - SLIDE_THRESHOLD); // 0~1
  const force = slideFactor * slideFactor * SLIDE_SPEED; // 가속도 느낌

  // 기울기 방향 (tiltY → X축 이동, tiltX → Y축 이동)
  const mag = Math.sqrt(tiltX**2 + tiltY**2) || 1;
  const dirX = tiltY / mag; // rotateY가 양수면 오른쪽으로 기울어짐
  const dirY = tiltX / mag; // rotateX가 양수면 앞으로 기울어짐

  for(let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.sx += dirX * force * TRAY_RX * 0.02;
    it.sy += dirY * force * TRAY_RY * 0.02;

    // 쟁반 밖으로 나갔는지 체크
    const dx = (it.sx - TRAY_CX) / TRAY_RX;
    const dy = (it.sy - TRAY_CY) / TRAY_RY;
    if(dx*dx + dy*dy > 1.05) {
      // 이모지가 바닥에 떨어지면 게임오버
      spawnFallingEmoji(it);
      items.splice(i, 1);
      gameOver();
      return;
    }
  }
}

function spawnFallingEmoji(it) {
  const sceneRect = scene.getBoundingClientRect();
  const sc = svgToScene(it.sx, it.sy);
  const startX = sceneRect.left + sc.x;
  const startY = sceneRect.top + sc.y;
  const fs = emojiSize(it.w);

  const el = document.createElement('div');
  el.className = 'falling-emoji';
  el.textContent = it.e;
  el.style.cssText = `left:${startX}px;top:${startY}px;font-size:${fs}px;line-height:1;will-change:transform,opacity;`;
  document.body.appendChild(el);

  const dirX = (it.sx - TRAY_CX) / TRAY_RX;
  const dirY = (it.sy - TRAY_CY) / TRAY_RY;
  let vx = dirX * 6 + (Math.random()-.5)*2;
  let vy = -2 + dirY * 4;
  let px=0, py=0, rot=0, rotV=(Math.random()-.5)*20, opacity=1;

  function animFrame() {
    vy += 0.5;
    vx *= 0.98;
    px += vx; py += vy;
    rot += rotV;
    opacity -= 0.015;
    el.style.transform = `translate(${px}px,${py}px) rotate(${rot}deg)`;
    el.style.opacity = Math.max(0, opacity);
    if(opacity > 0) requestAnimationFrame(animFrame);
    else el.remove();
  }
  requestAnimationFrame(animFrame);
}

// ── 자동 드롭 (10초 무행동 시) ────────────────────────
function autoDrop() {
  if(!running || dragging || goldenCountdownActive || goldenTime || floorItems.length===0) return;
  const normalItems = floorItems.filter(f => !f.special && f.w < 10);
  if(normalItems.length === 0) return;
  const fi = normalItems[Math.floor(Math.random()*normalItems.length)];
  // 쟁반 타원 안 랜덤 위치 (겹침 피해서 최대 20회 시도)
  let sx, sy;
  for(let attempt=0; attempt<20; attempt++){
    const angle = Math.random()*Math.PI*2;
    const r = Math.sqrt(Math.random())*0.75;
    sx = TRAY_CX + Math.cos(angle)*TRAY_RX*r;
    sy = TRAY_CY + Math.sin(angle)*TRAY_RY*r;
    if(countNearby(sx, sy) < MAX_OVERLAP) break;
  }
  items.push({sx, sy, e:fi.e, w:fi.w, dropT:performance.now()});
  score += toPoints(fi.w);
  // 드롭 위치를 화면 좌표로 변환해서 반짝이 효과
  const sc = svgToScene(sx, sy);
  const sceneRect = scene.getBoundingClientRect();
  spawnDropBurst(sceneRect.left + sc.x, sceneRect.top + sc.y);
  spawnScoreStars(sceneRect.left + sc.x, sceneRect.top + sc.y, toPoints(fi.w));
  removeFloorItem(fi.el);
  lastDropTime = performance.now();
}

function updateCountdown() {
  // 골든타임/카운트다운 중 타이머 숨김
  if(goldenTime || goldenCountdownActive) {
    countdownTimer.classList.remove('active');
    return;
  }

  const elapsed = performance.now() - lastDropTime;
  const remaining = Math.max(0, AUTO_DROP_DELAY - elapsed);
  const secs = Math.ceil(remaining / 1000);
  const ratio = remaining / AUTO_DROP_DELAY; // 1→0

  // 10초부터 항상 표시
  if(secs <= 10) {
    countdownTimer.classList.add('active');
    countdownText.textContent = secs;
    countdownRing.style.strokeDashoffset = ((1 - ratio) * RING_CIRCUM).toFixed(1);
    const warn = secs <= 3;
    countdownRing.classList.toggle('warn', warn);
    countdownText.classList.toggle('warn', warn);
  } else {
    countdownTimer.classList.remove('active');
  }
}

function loop() {
  if(!running) return;
  // 자동 드롭 체크
  if(performance.now() - lastDropTime > AUTO_DROP_DELAY) autoDrop();

  let danger = 0;
  if(frozen || goldenTime || goldenCountdownActive) {
    // 동결/골든타임 중: 기울기 변화 없음, 미끄러짐 없음, 게임오버 없음
    trayGroup.style.transform = `rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
    const mag = Math.sqrt(tiltX**2+tiltY**2);
    danger = Math.min(1, mag/TILT_LIMIT);
  } else {
    const {tx,ty} = computeTorque();
    const targetX = ty*4, targetY = tx*6;
    tiltX += (targetX - tiltX) * .08;
    tiltY += (targetY - tiltY) * .08;

    const clX = Math.max(-TILT_LIMIT*1.1, Math.min(TILT_LIMIT*1.1, tiltX));
    const clY = Math.max(-TILT_LIMIT*1.1, Math.min(TILT_LIMIT*1.1, tiltY));
    trayGroup.style.transform = `rotateX(${-clX}deg) rotateY(${clY}deg)`;

    const mag = Math.sqrt(tiltX**2+tiltY**2);
    const targetMag = Math.sqrt(targetX**2+targetY**2);
    // 현재 기울기와 목표 기울기를 블렌딩하여 위험도 표시
    const blended = mag * 0.4 + targetMag * 0.6;
    danger = Math.min(1, blended/TILT_LIMIT);

    if(mag >= TILT_LIMIT){ gameOver(); return; }

    // 이모지 미끄러짐 처리
    slideEmojis(danger);
  }

  updateHUD(score, danger);
  updateCountdown();
  drawEmojis();

  // 레벨 클리어 판정
  if(score >= currentGoal) { levelClear(); return; }

  if(!frozen && danger > DANGER_WARN){
    shakeTimer++;
    if(shakeTimer%6<3) trayGroup.style.transform += ` translateX(${(Math.random()-.5)*5}px)`;
  } else { shakeTimer=0; }

  rafId = requestAnimationFrame(loop);
}

// ── HUD 업데이트 ────────────────────────────────────────
function updateHUD(sc, danger) {
  const pct = Math.round(danger*100);
  document.getElementById('countVal').textContent = sc;
  document.getElementById('levelVal').textContent = level >= LEVELS.length ? 'MAX' : level;
  document.getElementById('goalVal').textContent = currentGoal === Infinity ? '∞' : currentGoal;
  const de = document.getElementById('dangerVal');
  de.textContent=pct+'%'; de.className='danger-pct'+(danger>DANGER_WARN?' danger':'');

  const mag=Math.sqrt(tiltX**2+tiltY**2);
  const angle=Math.atan2(tiltY,tiltX);
  const ratio=Math.min(1,mag/TILT_LIMIT);
  const needle=document.getElementById('tiltNeedle');
  const fill=document.getElementById('tiltFill');
  const npos=50+Math.sin(angle)*ratio*44;
  needle.style.left=npos+'%';
  const col=danger<.4?'#40C870':danger<.7?'#F4A535':'#E84040';
  needle.style.background=col;
  if(tiltY>0){fill.style.left='50%';fill.style.width=(ratio*44)+'%';}
  else{fill.style.left=(50-ratio*44)+'%';fill.style.width=(ratio*44)+'%';}
  fill.style.background=col;
  const df=document.getElementById('dangerFill');
  df.style.width=pct+'%';
  df.style.background=danger<.4?'linear-gradient(90deg,#40C870,#80e8a0)':danger<.7?'linear-gradient(90deg,#F4A535,#f8c070)':'linear-gradient(90deg,#E84040,#ff8080)';
}

// ── 레벨 클리어 ─────────────────────────────────────────
function levelClear() {
  running = false;
  cancelAnimationFrame(rafId);
  countdownTimer.classList.remove('active');

  const lcOverlay = document.getElementById('levelClearOverlay');
  const isAllClear = level >= LEVELS.length;

  if(isAllClear) {
    document.getElementById('lcIcon').textContent = '🎊';
    document.getElementById('lcTitle').textContent = 'ALL CLEAR!';
    document.getElementById('lcSub').textContent = '최종 점수: ' + score + '점';
    document.getElementById('lcNext').textContent = '';
    document.getElementById('lcCountdown').textContent = '';
    lcOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
    spawnConfetti();

    // 올클리어 → 3초 후 게임오버 화면 (랭킹 등록)
    setTimeout(() => {
      lcOverlay.classList.remove('show');
      document.body.classList.remove('no-scroll');
      // 랭킹 등록을 위해 gameOver 로직 재활용
      showGameOverScreen();
    }, 3000);
    return;
  }

  // 일반 레벨 클리어
  document.getElementById('lcIcon').textContent = '⭐'.repeat(level);
  document.getElementById('lcTitle').textContent = 'Level ' + level + ' Clear!';
  document.getElementById('lcSub').textContent = '현재 점수: ' + score + '점';
  lcOverlay.classList.add('show');
  document.body.classList.add('no-scroll');
  playSFX('levelup');
  spawnConfetti();

  let countdown = 3;
  document.getElementById('lcCountdown').textContent = countdown;
  document.getElementById('lcNext').textContent = 'Level ' + (level+1) + ' 시작까지...';

  const cdInterval = setInterval(() => {
    countdown--;
    if(countdown > 0) {
      document.getElementById('lcCountdown').textContent = countdown;
    } else {
      clearInterval(cdInterval);
      lcOverlay.classList.remove('show');
      document.body.classList.remove('no-scroll');
      // 다음 레벨 시작
      level++;
      applyLevel(level);
      items = [];
      tiltX = 0; tiltY = 0; shakeTimer = 0;
      frozen=false; if(frozenTimer){clearTimeout(frozenTimer);frozenTimer=null;}
      frostFlakes.forEach(el=>el.remove()); frostFlakes=[];
      document.getElementById('frostOverlay').classList.remove('active');
      if(goldenTime || goldenTimer) endGoldenTime();
      goldenCountdownActive = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      trayGroup.style.transition = '';
      trayGroup.style.transform = '';
      lastDropTime = performance.now();
      initFloor();
      running = true;
      loop();
    }
  }, 1000);
}

function showGameOverScreen() {
  if(score > best) {
    best = score;
    localStorage.setItem('trayBest5', best);
    document.getElementById('bestVal').textContent = best;
  }
  const finalScore = score;
  (async () => {
    const goLevelBadge = document.getElementById('goLevelBadge');
    const goCount = document.getElementById('goCount');
    const goBest = document.getElementById('goBest');
    const goSubTitle = document.getElementById('goSubTitle');
    const lvlText = level >= LEVELS.length ? 'MAX' : String(level);
    if(goLevelBadge) goLevelBadge.textContent = lvlText;
    if(goCount) goCount.textContent = finalScore;
    if(goBest) goBest.textContent = best;

    const nickArea = document.getElementById('goNickname');
    const lbArea = document.getElementById('goLeaderboard');
    const retryBtn = document.getElementById('retryBtn');
    nickArea.classList.remove('show');
    lbArea.classList.remove('show');
    document.getElementById('goNickInput').value = '';
    document.getElementById('goEmailInput').value = '';
    document.getElementById('privacyAgree').checked = false;
    document.getElementById('privacySection').classList.add('show');

    const topTen = await isTopTen(finalScore);
    if(topTen && finalScore > 0) {
      document.querySelector('.go-emoji').textContent = '🎉';
      document.querySelector('.go-title').textContent = '축하합니다!';
      if(goSubTitle) goSubTitle.textContent = '';
      document.getElementById('goNickSub').textContent = 'TOP 10 순위권에 진입했어요!';
      nickArea.classList.add('show');
      retryBtn.style.display = 'none';
      spawnConfetti();
      playSFX('winner');
      document.getElementById('goNickInput').focus();
    } else {
      document.querySelector('.go-emoji').textContent = '🔥';
      document.querySelector('.go-title').textContent = '그릴이 뒤집어졌다!';
      if(goSubTitle) goSubTitle.textContent = '10위권 밖입니다. 다시 도전해보세요!';
      const board = await loadLeaderboard();
      renderLeaderboard(board, finalScore, '');
      lbArea.classList.add('show');
      retryBtn.style.display = '';
      playSFX('end');
    }
    goOverlay.classList.add('show');
    document.body.classList.add('no-scroll');
  })();
}

// ── 게임오버 ───────────────────────────────────────────
function gameOver() {
  running=false; cancelAnimationFrame(rafId);
  stopBGM();
  playSFX('drop');
  countdownTimer.classList.remove('active');

  // 1. 캔버스의 이모지를 즉시 지움 (쟁반 위 이모지 제거)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. 쟁반 뒤집기
  trayGroup.style.transition='transform .65s cubic-bezier(.4,0,.6,1)';
  trayGroup.style.transform='rotateX(180deg) rotateY(18deg)';

  // 3. 이모지를 실제 화면 위치에서 물리 기반으로 떨어뜨리기
  //    기울기 방향으로 초기 속도 부여
  const sceneRect = scene.getBoundingClientRect();
  const flipDirX = tiltY > 0 ? 1 : -1; // rotateY → 좌우 방향

  items.forEach((it, idx) => {
    // 씬 픽셀 위치 계산
    const sc = svgToScene(it.sx, it.sy);
    const startX = sceneRect.left + sc.x;
    const startY = sceneRect.top  + sc.y;
    const fs = emojiSize(it.w);

    const el = document.createElement('div');
    el.className = 'falling-emoji';
    el.textContent = it.e;
    el.style.cssText = `
      left:${startX}px; top:${startY}px;
      font-size:${fs}px; line-height:1;
      will-change:transform,opacity;
    `;
    document.body.appendChild(el);

    // 물리: 기울기 방향으로 날아가다가 중력으로 떨어짐
    const delay = idx * 30 + Math.random()*80; // 순차 딜레이
    const vx0 = flipDirX * (4 + Math.random()*6) + (Math.random()-.5)*4;
    const vy0 = -4 - Math.random()*6; // 처음엔 위로 튀어오름
    let vx=vx0, vy=vy0, px=0, py=0;
    let rot=0, rotV=(Math.random()-.5)*25;
    let opacity=1;
    let startTime=null;

    function animFrame(ts) {
      if(!startTime) startTime=ts;
      if(ts-startTime < delay) { requestAnimationFrame(animFrame); return; }

      vy += 0.55; // 중력
      vx *= 0.98; // 공기 저항
      px += vx; py += vy;
      rot += rotV;
      opacity -= 0.012;

      el.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
      el.style.opacity = Math.max(0, opacity);

      if(opacity > 0) requestAnimationFrame(animFrame);
      else el.remove();
    }
    requestAnimationFrame(animFrame);
  });

  setTimeout(() => showGameOverScreen(), 1100);
}

// ── 쟁반 클릭(골든타임 별 수확) ─────────────────────────
// 골든타임 중 캔버스에서 직접 이벤트를 받아 렌더링 좌표와 100% 일치하는 히트 판정
let tapStartX = 0, tapStartY = 0;
dropZone.addEventListener('mousemove', () => {
  dropZone.style.cursor = (goldenTime && running) ? 'pointer' : '';
});
dropZone.addEventListener('mousedown', e => {
  tapStartX = e.clientX; tapStartY = e.clientY;
});
dropZone.addEventListener('mouseup', e => {
  if(!goldenTime || dragging) return;
  const dx = e.clientX - tapStartX, dy = e.clientY - tapStartY;
  if(dx*dx + dy*dy < 100) {
    harvestGoldenStar(e.clientX, e.clientY);
  }
});
dropZone.addEventListener('touchstart', e => {
  tapStartX = e.touches[0].clientX; tapStartY = e.touches[0].clientY;
  if(goldenTime && running) e.preventDefault();
}, {passive:false});
dropZone.addEventListener('touchend', e => {
  if(!goldenTime || dragging) return;
  const cx = e.changedTouches[0].clientX, cy = e.changedTouches[0].clientY;
  const dx = cx - tapStartX, dy = cy - tapStartY;
  if(dx*dx + dy*dy < 100) {
    e.preventDefault();
    harvestGoldenStar(cx, cy);
  }
});

// ── 이벤트 ─────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', () => { playSFX('start'); init(); });

document.getElementById('soundToggleBtn').addEventListener('click', () => {
  setMute(!soundMuted);
});

// 닉네임 저장
document.getElementById('goNickSave').addEventListener('click', async ()=>{
  const input = document.getElementById('goNickInput');
  const name = input.value.trim();
  if(!name) { alert('닉네임을 입력해주세요.'); input.focus(); return; }
  const emailInput = document.getElementById('goEmailInput');
  const email = emailInput.value.trim();
  if(!email) {
    alert('이메일 주소를 입력해주세요.');
    emailInput.focus();
    return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('올바른 이메일 주소를 입력해주세요.');
    emailInput.focus();
    return;
  }
  if(!document.getElementById('privacyAgree').checked) {
    alert('이벤트 참여를 위해 이메일 수집에 동의해주세요.');
    const checkLabel = document.querySelector('.privacy-check');
    checkLabel.classList.remove('highlight');
    void checkLabel.offsetHeight;
    checkLabel.classList.add('highlight');
    document.getElementById('privacyAgree').focus();
    return;
  }

  // 확인 팝업 표시
  document.getElementById('confirmNick').textContent = name;
  document.getElementById('confirmEmail').textContent = email;
  document.getElementById('confirmModal').classList.add('show');
});

// Enter 키로도 저장
document.getElementById('goNickInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') document.getElementById('goEmailInput').focus();
});
document.getElementById('goEmailInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') document.getElementById('goNickSave').click();
});
document.getElementById('goEmailInput').addEventListener('input', (e)=>{
  const before = e.target.value;
  e.target.value = before.replace(/[^a-zA-Z0-9@._\-+]/g, '');
  if(before !== e.target.value && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(before)) {
    showEmailTooltip('이메일주소는 한글입력이 불가합니다');
  }
});

function showEmailTooltip(msg) {
  let tip = document.getElementById('emailTooltip');
  if(!tip) {
    tip = document.createElement('div');
    tip.id = 'emailTooltip';
    tip.style.cssText = 'position:absolute;background:rgba(0,0,0,0.85);color:#ffffff;font-size:12px;padding:6px 12px;border-radius:6px;pointer-events:none;opacity:0;transition:opacity .2s;white-space:nowrap;z-index:9999;';
    document.body.appendChild(tip);
  }
  const input = document.getElementById('goEmailInput');
  const rect = input.getBoundingClientRect();
  tip.textContent = msg;
  tip.style.left = rect.left + rect.width / 2 - tip.offsetWidth / 2 + 'px';
  tip.style.top = rect.bottom + 6 + 'px';
  tip.style.opacity = '1';
  clearTimeout(tip._timer);
  tip._timer = setTimeout(() => { tip.style.opacity = '0'; }, 1500);
}

// 건너뛰기 (저장 않고 랭킹만 보기)
document.getElementById('goNickSkip').addEventListener('click', async ()=>{
  document.getElementById('goNickname').classList.remove('show');
  const board = await loadLeaderboard();
  renderLeaderboard(board, 0, '');
  document.getElementById('goLeaderboard').classList.add('show');
  document.getElementById('retryBtn').style.display = '';
});

// 모달 닫기 (공통: 닫기버튼 + 배경 클릭)
document.querySelectorAll('.custom-modal-close[data-close]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.getElementById(btn.dataset.close).classList.remove('show');
  });
});
document.querySelectorAll('.custom-modal-bg').forEach(bg=>{
  bg.addEventListener('click', (e)=>{
    if(e.target === bg) bg.classList.remove('show');
  });
});
// 유튜브 모달 닫기
// 게임방법 / 특수이모지 팝업
document.getElementById('confirmCancel').addEventListener('click', ()=>{
  document.getElementById('confirmModal').classList.remove('show');
});

document.getElementById('confirmOk').addEventListener('click', async ()=>{
  document.getElementById('confirmModal').classList.remove('show');

  const name  = document.getElementById('goNickInput').value.trim();
  const email = document.getElementById('goEmailInput').value.trim();
  const finalScore = parseInt(document.getElementById('goCount').textContent) || 0;

  const btn = document.getElementById('goNickSave');
  btn.textContent = '저장 중...';
  btn.disabled = true;

  await saveScore(name, finalScore, email);

  document.getElementById('confirmModal').classList.remove('show');
  document.getElementById('goNickname').classList.remove('show');

  const board = await loadLeaderboard();
  renderLeaderboard(board, finalScore, name);
  document.getElementById('goLeaderboard').classList.add('show');
  document.getElementById('retryBtn').style.display = '';

  btn.textContent = '저장';
  btn.disabled = false;
});

document.getElementById('howToPlayBtn').addEventListener('click', ()=>{
  document.getElementById('howToPlayModal').classList.add('show');
});
document.getElementById('specialInfoBtn').addEventListener('click', ()=>{
  document.getElementById('specialInfoModal').classList.add('show');
});

document.getElementById('retryBtn').addEventListener('click', ()=>{
  // 낙하 중인 이모지 제거
  document.querySelectorAll('.falling-emoji').forEach(el=>el.remove());
  // 랭킹 UI 초기화
  document.getElementById('goNickname').classList.remove('show');
  document.getElementById('goLeaderboard').classList.remove('show');
  document.getElementById('retryBtn').style.display = '';
  playSFX('start');
  init();
});
window.addEventListener('resize', ()=>{ if(running) syncCanvas(); });