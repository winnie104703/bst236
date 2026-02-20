/* Valentine Pac-Man
  Simple HTML5 canvas tile-based implementation.
  Controls: Arrow keys / WASD
*/
  /* Valentine Pac-Man
     Simple HTML5 canvas tile-based implementation.
     Controls: Arrow keys / WASD
  */
  (function(){
    const canvas = document.getElementById('gameCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    // Config
    const TILE = 24; // pixels
    const COLS = Math.floor(canvas.width / TILE);
    const ROWS = Math.floor(canvas.height / TILE);
    const FPS = 60;

    // Simple map: 0=empty/pellet, 1=wall
    // We'll generate a border with some internal walls for demo
    let map = [];
    function makeMap(){
      map = new Array(ROWS).fill(0).map(()=>new Array(COLS).fill(0));
      for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLS;c++){
          if(r===0||c===0||r===ROWS-1||c===COLS-1) map[r][c]=1;
          else if((r%4===0 && c%4!==0) || (c%6===0 && r%6!==0)) map[r][c]=1;
          else map[r][c]=0;
        }
      }
      // carve a small house in center for ghosts
      const hr = Math.floor(ROWS/2)-1, hc=Math.floor(COLS/2)-2;
      for(let r=hr;r<hr+3;r++) for(let c=hc;c<hc+5;c++) map[r][c]=0;
    }

    makeMap();

    // Ensure all empty tiles are reachable from the player's start position by carving minimal paths
    function ensureConnectivity(){
      const startR = Math.floor(ROWS/2)+3, startC = Math.floor(COLS/2);
      const inBounds = (r,c)=> r>=0 && c>=0 && r<ROWS && c<COLS;
      const reachable = new Set();
      // BFS on walkable tiles
      if(isWalkable(startR,startC)){
        const q=[[startR,startC]]; reachable.add(startR+','+startC);
        for(let i=0;i<q.length;i++){
          const [r,c]=q[i];
          const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
          for(const d of deltas){ const nr=r+d[1], nc=c+d[0]; if(inBounds(nr,nc) && isWalkable(nr,nc) && !reachable.has(nr+','+nc)){ reachable.add(nr+','+nc); q.push([nr,nc]); } }
        }
      }
      // collect all empty tiles (pellet candidates)
      const empties = [];
      for(let r=1;r<ROWS-1;r++) for(let c=1;c<COLS-1;c++) if(map[r][c]===0) empties.push([r,c]);
      // find empties not reachable and carve path from them to nearest reachable
      let unreached = empties.filter(([r,c])=>!reachable.has(r+','+c));
      while(unreached.length>0){
        const [ur,uc] = unreached.pop();
        // BFS from unreachable, allow traversal through walls to find nearest reachable tile
        const visited = Array.from({length:ROWS},()=>new Array(COLS).fill(false));
        const parent = Array.from({length:ROWS},()=>new Array(COLS).fill(null));
        const q=[[ur,uc]]; visited[ur][uc]=true; let found=null;
        for(let i=0;i<q.length;i++){
          const [r,c]=q[i];
          if(reachable.has(r+','+c)){ found=[r,c]; break; }
          const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
          for(const d of deltas){ const nr=r+d[1], nc=c+d[0]; if(inBounds(nr,nc) && !visited[nr][nc]){ visited[nr][nc]=true; parent[nr][nc]=[r,c]; q.push([nr,nc]); } }
        }
        if(!found) break;
        // carve path from found back to original unreachable
        let cur = found;
        while(!(cur[0]===ur && cur[1]===uc)){
          const [r,c] = cur;
          if(map[r][c]===1) map[r][c]=0;
          reachable.add(r+','+c);
          cur = parent[cur[0]][cur[1]];
        }
        reachable.add(ur+','+uc);
        // recompute unreached
        unreached = empties.filter(([r,c])=>!reachable.has(r+','+c));
      }
    }

    // pellets set where map==0
    let pellets = new Set();
    function seedPellets(){
      pellets.clear();
      for(let r=1;r<ROWS-1;r++) for(let c=1;c<COLS-1;c++){
        if(map[r][c]===0) pellets.add(r+','+c);
      }
    }
    seedPellets();

    // Rose power-up
    let rosePos = null;
    function spawnRose(){
      const arr = Array.from(pellets).filter(p=>p!==null);
      if(arr.length===0) return;
      const pick = arr[Math.floor(Math.random()*arr.length)];
      const parts = pick.split(',').map(Number);
      rosePos = {r:parts[0], c:parts[1]};
    }

    // Entities
    const pac = {r:Math.floor(ROWS/2)+3, c:Math.floor(COLS/2), dir:[0,0], facing:[-1,0], powered:0, lives:3, score:0,
           mouth:0, mouthDir:1, invul:0};

    function isWalkable(r,c){
      if(r<0||c<0||r>=ROWS||c>=COLS) return false;
      return map[r][c]===0;
    }

    function clampPos(obj){
      if(obj.r === undefined || obj.c === undefined) return;
      if(!Number.isFinite(obj.r) || !Number.isFinite(obj.c)){
        console.warn('Non-finite position', obj);
        obj.r = Math.round(Math.max(0,Math.min(ROWS-1, obj.r||0)));
        obj.c = Math.round(Math.max(0,Math.min(COLS-1, obj.c||0)));
      }
      obj.r = Math.round(obj.r); obj.c = Math.round(obj.c);
      if(obj.r < 0) obj.r = 0; if(obj.r >= ROWS) obj.r = ROWS-1;
      if(obj.c < 0) obj.c = 0; if(obj.c >= COLS) obj.c = COLS-1;
    }

    function findNearestWalkable(r,c){
      const inBounds = (rr,cc)=> rr>=0 && cc>=0 && rr<ROWS && cc<COLS;
      const visited = Array.from({length:ROWS},()=>new Array(COLS).fill(false));
      const q = [[r,c]]; if(inBounds(r,c)) visited[r][c]=true; let idx=0;
      while(idx<q.length){
        const [cr,cc] = q[idx++];
        if(inBounds(cr,cc) && isWalkable(cr,cc)) return [cr,cc];
        const deltas = [[1,0],[-1,0],[0,1],[0,-1]];
        for(const d of deltas){ const nr=cr+d[1], nc=cc+d[0]; if(inBounds(nr,nc) && !visited[nr][nc]){ visited[nr][nc]=true; q.push([nr,nc]); } }
      }
      return [Math.floor(ROWS/2), Math.floor(COLS/2)];
    }

    // Ghosts
    const ghosts = [];
    const GHOST_MOVE_DELAY = 4; // ticks to wait between ghost moves (increase to slow ghosts)
    function spawnGhosts(){
      ghosts.length=0;
      const centerR = Math.floor(ROWS/2), centerC = Math.floor(COLS/2);
      const coords = [[centerR,centerC-1],[centerR,centerC+1],[centerR-1,centerC],[centerR+1,centerC]];
      for(let i=0;i<coords.length;i++){
        let [gr,gc] = coords[i];
        if(!isWalkable(gr,gc)){
          const found = findNearestWalkable(gr,gc); gr = found[0]; gc = found[1];
        }
        ghosts.push({r:gr, c:gc, dir:[0,0], alive:true, respawn:0, wait: Math.floor(Math.random()*GHOST_MOVE_DELAY)});
      }
    }
    spawnGhosts();

    // initialize visual animation state for ghosts
    for(const g of ghosts){ g.bob = Math.random()*Math.PI*2; }

    // Hearts (projectiles)
    const hearts = [];

    // Input
    const keys = {};
    let lastMoveTime = 0;
    const MOVE_INTERVAL = 220; // ms between discrete tile moves when holding a key

    window.addEventListener('keydown', e => {
      // ignore repeated keydown edges by using the stored state
      if (!keys[e.key]) {
        keys[e.key] = true;
        // allow immediate move on fresh press by resetting lastMoveTime
        lastMoveTime = 0;
      }
      e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });

    // HUD elements
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const powerEl = document.getElementById('power');
    const startOverlay = document.getElementById('startOverlay');

    // Game loop
    let last = performance.now();
    let acc = 0;
    let running = false;

    function start(){
      // Start a fresh game: regenerate map, ensure connectivity, seed pellets and spawn ghosts
      running = true;
      pac.score = 0; pac.lives = 3; pac.powered = 0;
      makeMap();
      ensureConnectivity();
      seedPellets();
      spawnGhosts();
      // reset pac starting position
      pac.r = Math.floor(ROWS/2) + 3; pac.c = Math.floor(COLS/2);
      rosePos = null; hearts.length = 0; updateHUD();
      // reset timing so the loop starts cleanly after restart
      last = performance.now(); acc = 0; lastMoveTime = 0;
      const pbtn = document.getElementById('pauseBtn'); if(pbtn) pbtn.textContent = 'Pause';
      // once a game is started, the Start button becomes a Restart control
      const sbtn = document.getElementById('startBtn'); if(sbtn) sbtn.textContent = 'Restart';
      if(startOverlay && startOverlay.parentNode) startOverlay.style.display='none';
      requestAnimationFrame(loop);
    }

    // debug panel removed for production
    function resume(){
      if(running) return;
      running = true;
      last = performance.now(); acc = 0; lastMoveTime = performance.now();
      const pbtn = document.getElementById('pauseBtn'); if(pbtn) pbtn.textContent = 'Pause';
      requestAnimationFrame(loop);
    }

    function togglePause(){
      const pbtn = document.getElementById('pauseBtn');
      if(running){ running = false; if(pbtn) pbtn.textContent = 'Resume'; }
      else { resume(); if(pbtn) pbtn.textContent = 'Pause'; }
    }

    const _startBtn = document.getElementById('startBtn'); if(_startBtn) _startBtn.addEventListener('click', ()=> start());
    const _pauseBtn = document.getElementById('pauseBtn'); if(_pauseBtn) _pauseBtn.addEventListener('click', ()=> togglePause());

    function showStartOverlay(){ if(startOverlay) startOverlay.style.display = 'flex'; }
    function hideStartOverlay(){ if(startOverlay) startOverlay.style.display = 'none'; }

    function loop(now){
      if(!running) return;
      const dt = now - last; last = now; acc += dt;
      const step = 1000/10; // logic ticks per sec (10)
      while(acc>=step){ update(step/1000); acc-=step; }
      render();
      requestAnimationFrame(loop);
    }

    function update(dt){
      handleInput();
      // move pacman discretely based on MOVE_INTERVAL to avoid multi-tile jumps on single keypress
      const now = performance.now();
      if ((pac.dir[0] || pac.dir[1]) && (now - lastMoveTime >= MOVE_INTERVAL)) {
        const nr = pac.r + pac.dir[1] * 1; // note: dir stores [dx,dy]
        const nc = pac.c + pac.dir[0] * 1;
        if (isWalkable(nr, nc)) { pac.r = nr; pac.c = nc; }
        // ensure pac remains clamped to the grid
        clampPos(pac);
        lastMoveTime = now;
      }
      // Pellets
      const key = pac.r+','+pac.c;
      if(pellets.has(key)){
        pellets.delete(key); pac.score+=10; updateHUD();
      }
      // Rose pickup
      if(rosePos && pac.r===rosePos.r && pac.c===rosePos.c){
        pac.powered = 6; // seconds
        rosePos=null;
        pac.score+=50; updateHUD();
      }
      // Powered state
      if(pac.powered>0){
        pac.powered -= dt; if(pac.powered<0) pac.powered=0;
        // spawn hearts continuously (simple rate)
        if(Math.random()<0.4) spawnHeart();
      }
      // invulnerability ticks (counts down per logic tick)
      if(pac.invul>0) pac.invul--;

      // animate mouth
        pac.mouth += pac.mouthDir * (dt*3);
        if(pac.mouth > 0.45){ pac.mouth = 0.45; pac.mouthDir = -1; }
        if(pac.mouth < 0){ pac.mouth = 0; pac.mouthDir = 1; }

      // ghost bobbing updates
      for(const g of ghosts){ g.bob = (g.bob || 0) + dt*6; }

      // hearts movement
      for(let i=hearts.length-1;i>=0;i--){
        const h = hearts[i];
        h.ticks--;
        if(h.ticks<=0){ hearts.splice(i,1); continue; }
        h.x += h.dx; h.y += h.dy;
        // tile collision check
        const hr = Math.round(h.y); const hc = Math.round(h.x);
        if(hr<0||hc<0||hr>=ROWS||hc>=COLS){ hearts.splice(i,1); continue; }
        if(!isWalkable(hr,hc)){ hearts.splice(i,1); continue; }
        // ghost collisions
        for(let g of ghosts){ if(g.alive && g.r===hr && g.c===hc){ g.alive=false; g.respawn=30; hearts.splice(i,1); pac.score+=100; updateHUD(); break; } }
      }

      // ghost AI
      for(let g of ghosts){
        if(!g.alive){ g.respawn--; if(g.respawn<=0){ g.alive=true; const found = findNearestWalkable(Math.floor(ROWS/2), Math.floor(COLS/2)); g.r = found[0]; g.c = found[1]; g.wait = GHOST_MOVE_DELAY; } continue; }
        // choose direction toward pacman with some randomness
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        dirs.sort((a,b)=>{ const da=Math.abs((g.r+a[1])-pac.r)+Math.abs((g.c+a[0])-pac.c); const db=Math.abs((g.r+b[1])-pac.r)+Math.abs((g.c+b[0])-pac.c); return da-db; });
        let chosen = null;
        for(let d of dirs){ const nr=g.r+d[1], nc=g.c+d[0]; if(isWalkable(nr,nc) && Math.random()>0.1){ chosen=d; break; } }
        if (g.wait > 0) { g.wait--; }
        else {
          if(chosen) { g.r += chosen[1]; g.c += chosen[0]; clampPos(g); }
          g.wait = GHOST_MOVE_DELAY;
        }
        // collision with pac
        if (g.r === pac.r && g.c === pac.c) {
          // ignore collisions while pac is temporarily invulnerable (just respawned)
          if (pac.invul>0) continue;
          if (pac.powered > 0) { g.alive = false; g.respawn = 30; g.wait = GHOST_MOVE_DELAY; pac.score += 100; updateHUD(); }
          else {
            pac.lives--; updateHUD();
            if (pac.lives <= 0) {
              running = false;
              showGameOver(pac.score);
              return; // stop processing further ghosts this tick
            } else {
              // respawn pac on nearest walkable tile and grant short invulnerability
              const found = findNearestWalkable(Math.floor(ROWS/2)+3, Math.floor(COLS/2)); pac.r = found[0]; pac.c = found[1];
              pac.invul = 30; // logic ticks of invulnerability
            }
          }
        }
      }

      // occasionally spawn rose
      if(!rosePos && Math.random()<0.02) spawnRose();
    }

    function spawnHeart(){
      const fx = pac.facing[0], fy = pac.facing[1];
      if(fx===0 && fy===0) return;
      hearts.push({x:pac.c, y:pac.r, dx:fx, dy:fy, ticks:12});
    }

    function handleInput(){
      // prefer arrow or WASD
      if(keys['ArrowLeft']||keys['a']||keys['A']) { pac.dir=[-1,0]; pac.facing=[-1,0]; }
      else if(keys['ArrowRight']||keys['d']||keys['D']) { pac.dir=[1,0]; pac.facing=[1,0]; }
      else if(keys['ArrowUp']||keys['w']||keys['W']) { pac.dir=[0,-1]; pac.facing=[0,-1]; }
      else if(keys['ArrowDown']||keys['s']||keys['S']) { pac.dir=[0,1]; pac.facing=[0,1]; }
    }

    function updateHUD(){ if(scoreEl) scoreEl.textContent = pac.score; if(livesEl) livesEl.textContent = pac.lives; if(powerEl) powerEl.textContent = Math.ceil(pac.powered); }

    function render(){
      // (debug visuals removed for production)
      // background
      const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
      bgGrad.addColorStop(0,'#071733'); bgGrad.addColorStop(1,'#031022');
      ctx.fillStyle = bgGrad; ctx.fillRect(0,0,canvas.width,canvas.height);
      // draw tiles
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
        const x=c*TILE, y=r*TILE;
        if(map[r][c]===1){
          // wall tile with subtle highlight
          ctx.fillStyle='#13263f'; ctx.fillRect(x,y,TILE,TILE);
          ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
        } else {
          // pellet
          if(pellets.has(r+','+c)){
            const cx = x+TILE/2, cy = y+TILE/2;
            ctx.fillStyle='rgba(255,230,150,0.95)'; ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fill();
          }
        }
      }
      // decorative garden border
      drawGardenBorder();

      // rose (draw larger, clearer rose graphic)
      if(rosePos){
        const rx = rosePos.c*TILE+TILE/2, ry = rosePos.r*TILE+TILE/2;
        // pulsing rose (bigger for clarity)
        const pulse = 1 + 0.12*Math.sin(Date.now()/180);
        drawRose(rx,ry,TILE*0.7*pulse,'#ff2b6d');
      }

      // hearts
      for(let h of hearts){ drawHeart(h.x*TILE+TILE/2, h.y*TILE+TILE/2, TILE/4,'#ff9ab8'); }

      // pac-man (3D-ish with mouth)
        drawPac(pac.c*TILE+TILE/2, pac.r*TILE+TILE/2, TILE/2-2);

      // bees (replacing ghosts)
      for(const g of ghosts){ if(!g.alive) continue; drawBee(g); }
    }
  
    // draw a Pac-Man with mouth and slight shading
    function drawPac(cx,cy,radius){
      const angle = Math.atan2(pac.facing[1], pac.facing[0]);
      const m = pac.mouth * 0.8; // mouth opening
      const start = angle + m;
      const end = angle + Math.PI*2 - m;
      // body gradient
      const g = ctx.createRadialGradient(cx-radius/3, cy-radius/3, radius*0.1, cx, cy, radius);
      g.addColorStop(0,'#fff176'); g.addColorStop(1,'#ffd400');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,radius,start,end); ctx.closePath(); ctx.fill();
      // eye
      const ex = cx + Math.cos(angle)*radius*0.25 - Math.sin(angle)*radius*0.15;
      const ey = cy + Math.sin(angle)*radius*0.25 + Math.cos(angle)*radius*0.15;
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ex,ey,radius*0.12,0,Math.PI*2); ctx.fill();
    }

    // draw a bee guardian (replaces ghosts)
    function drawBee(g){
      const x = g.c*TILE + TILE/2, y = g.r*TILE + TILE/2;
      const bob = Math.sin(g.bob)*3;
      ctx.save(); ctx.translate(x, y + bob);
      // body (oval)
      ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.ellipse(0,0,TILE*0.36,TILE*0.28,0,0,Math.PI*2); ctx.fill();
      // stripes
      ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-TILE*0.18,-TILE*0.18,TILE*0.36,TILE*0.12);
      ctx.fillRect(-TILE*0.18, -TILE*0.02, TILE*0.36, TILE*0.12);
      // wings
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-TILE*0.22,-TILE*0.32,TILE*0.18,TILE*0.12, -0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(TILE*0.22,-TILE*0.32,TILE*0.18,TILE*0.12, 0.4,0,Math.PI*2); ctx.fill();
      // stinger
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.moveTo(TILE*0.36,0); ctx.lineTo(TILE*0.5, -4); ctx.lineTo(TILE*0.5,4); ctx.closePath(); ctx.fill();
      // eyes (small)
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-TILE*0.12,-TILE*0.02,TILE*0.06,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(TILE*0.12,-TILE*0.02,TILE*0.06,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

  function drawHeart(cx,cy,size,color){
    ctx.save(); ctx.translate(cx,cy); ctx.scale(size/24,size/24);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0,6);
    ctx.bezierCurveTo(0,-2, -12,-2, -12,6);
    ctx.bezierCurveTo(-12,14, 0,20, 0,28);
    ctx.bezierCurveTo(0,20, 12,14, 12,6);
    ctx.bezierCurveTo(12,-2, 0,-2, 0,6);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawRose(cx,cy,size,color){
    ctx.save(); ctx.translate(cx,cy);
    const s = size/40;
    // stem
    ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.moveTo(0, size*0.4); ctx.lineTo(0, size*0.9); ctx.stroke();
    // leaves
    ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.ellipse(-size*0.18,size*0.65,size*0.12,size*0.06, -0.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size*0.18,size*0.65,size*0.12,size*0.06, 0.5,0,Math.PI*2); ctx.fill();
    // petals - layered petals using arcs for a clearer rose look
    const petalColors = [color, '#ff6ea3', '#ff4b85'];
    for(let i=0;i<6;i++){
      const angle = (i/6)*Math.PI*2;
      const rx = Math.cos(angle)*s*4*0.9;
      const ry = Math.sin(angle)*s*2 - s*2;
      const petalRadius = Math.max(2, size*0.22 - i*s*2);
      ctx.beginPath(); ctx.fillStyle = petalColors[i%petalColors.length]; ctx.ellipse(rx, ry, petalRadius, petalRadius*0.7, angle*0.4, 0, Math.PI*2); ctx.fill();
    }
    // center swirl
    ctx.fillStyle = '#ff4978';
    ctx.beginPath(); ctx.arc(0, -s*2, size*0.14, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // draw decorative garden border/vines around the canvas edges
  function drawGardenBorder(){
    try{
      ctx.save();
      const pad = 6;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(18,85,45,0.8)';
      // rounded border
      roundRect(ctx, pad, pad, canvas.width - pad*2, canvas.height - pad*2, 8);
      ctx.stroke();
      // small vine segments along left/top edges
      ctx.fillStyle = 'rgba(30,120,60,0.9)';
      for(let x=pad+12;x<canvas.width-pad-12;x+=28){
        leaf(ctx, x, pad+6, 6, -0.6);
        leaf(ctx, x, canvas.height-pad-6, 6, 0.6);
      }
      for(let y=pad+18;y<canvas.height-pad-18;y+=34){
        leaf(ctx, pad+6, y, 6, 1.2);
        leaf(ctx, canvas.width-pad-6, y, 6, -1.2);
      }
      ctx.restore();
    }catch(e){ /* non-fatal */ }
  }

  function leaf(ctx,x,y,size,rot){ ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0,0,size,size*0.6,0,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // start automatically
  updateHUD();
  // Draw an initial themed background and show the start overlay so user knows to click Start
  render();
  showStartOverlay();
  // Game over modal helper
  function showGameOver(score){
    // create overlay
    const overlay = document.createElement('div');
    overlay.id = 'gameOverModal';
    Object.assign(overlay.style, {
      position: 'fixed', left:0, right:0, top:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.6)', zIndex:9999
    });
    const box = document.createElement('div');
    Object.assign(box.style, { background:'#fff', padding:'20px', borderRadius:'8px', textAlign:'center', minWidth:'260px' });
    const h = document.createElement('h2'); h.textContent = 'Game Over';
    const p = document.createElement('p'); p.textContent = 'Score: '+score;
    const restart = document.createElement('button'); restart.textContent = 'Restart'; restart.style.marginRight='8px';
    const close = document.createElement('button'); close.textContent = 'Close';
    box.appendChild(h); box.appendChild(p); box.appendChild(restart); box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanup(){ const ex = document.getElementById('gameOverModal'); if(ex && ex.parentNode) ex.parentNode.removeChild(ex); }
    // ensure existing modal removed before adding new
    cleanup();
    // attach once listeners so duplicate handlers won't accumulate
    restart.addEventListener('click', ()=>{ cleanup(); start(); }, { once:true });
    close.addEventListener('click', ()=>{ cleanup(); }, { once:true });
  }

})();
