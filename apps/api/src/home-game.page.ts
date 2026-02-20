export const HOME_GAME_PAGE_HTML = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RideMyCity Runner</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        background: radial-gradient(circle at 20% 20%, #1f2937, #0b1020 50%, #020617);
        color: #e5e7eb;
      }
      .game-shell {
        width: min(920px, 96vw);
        padding: 18px;
        border-radius: 14px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.85);
        box-shadow: 0 12px 28px rgba(2, 6, 23, 0.45);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 12px;
      }
      .header h1 {
        margin: 0;
        font-size: 20px;
        color: #f8fafc;
      }
      .header p {
        margin: 0;
        font-size: 13px;
        color: #93c5fd;
      }
      canvas {
        width: 100%;
        display: block;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: linear-gradient(#1d4ed8 0%, #0f172a 44%, #111827 44%, #111827 100%);
      }
      .help {
        margin-top: 10px;
        font-size: 13px;
        color: #cbd5e1;
      }
      .kbd {
        display: inline-block;
        border: 1px solid rgba(148, 163, 184, 0.45);
        border-bottom-width: 2px;
        border-radius: 6px;
        padding: 1px 6px;
        margin: 0 2px;
        background: rgba(15, 23, 42, 0.9);
      }
    </style>
  </head>
  <body>
    <section class="game-shell">
      <div class="header">
        <h1>RideMyCity Runner</h1>
        <p>Bici vs. piedras y pozos</p>
      </div>
      <canvas id="game" width="880" height="320" aria-label="Juego de bicicleta"></canvas>
      <p class="help">Salta con <span class="kbd">Espacio</span>, <span class="kbd">↑</span> o clic/tap. Reinicia con <span class="kbd">R</span>.</p>
    </section>
    <script>
      (function () {
        var canvas = document.getElementById('game');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var GROUND_Y = 250;
        var GRAVITY = 0.58;
        var JUMP_VELOCITY = -11.8;
        var BASE_SPEED = 5.2;

        var bike = { x: 120, y: GROUND_Y - 34, w: 64, h: 34, vy: 0, onGround: true };
        var game = { score: 0, best: 0, speed: BASE_SPEED, running: true, tick: 0 };
        var obstacles = [];

        function spawnObstacle() {
          var kind = Math.random() < 0.6 ? 'rock' : 'pit';
          if (kind === 'rock') {
            var size = 18 + Math.random() * 16;
            obstacles.push({ kind: kind, x: canvas.width + 20, y: GROUND_Y - size, w: size, h: size });
            return;
          }
          var width = 46 + Math.random() * 48;
          obstacles.push({ kind: kind, x: canvas.width + 20, y: GROUND_Y, w: width, h: 10 });
        }

        function jump() {
          if (!game.running || !bike.onGround) return;
          bike.vy = JUMP_VELOCITY;
          bike.onGround = false;
        }

        function resetGame() {
          game.running = true;
          game.score = 0;
          game.speed = BASE_SPEED;
          obstacles.length = 0;
          bike.y = GROUND_Y - bike.h;
          bike.vy = 0;
          bike.onGround = true;
        }

        function intersects(a, b) {
          return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        }

        function bikeHitbox() {
          return { x: bike.x + 8, y: bike.y + 4, w: bike.w - 16, h: bike.h - 4 };
        }

        function update() {
          if (!game.running) return;

          game.tick += 1;
          game.score += 0.09;
          game.speed = BASE_SPEED + Math.min(7, game.score / 45);

          bike.vy += GRAVITY;
          bike.y += bike.vy;
          if (bike.y >= GROUND_Y - bike.h) {
            bike.y = GROUND_Y - bike.h;
            bike.vy = 0;
            bike.onGround = true;
          }

          if (game.tick % 65 === 0 && Math.random() > 0.2) {
            spawnObstacle();
          }

          for (var i = obstacles.length - 1; i >= 0; i -= 1) {
            var obs = obstacles[i];
            obs.x -= game.speed;
            if (obs.x + obs.w < -20) {
              obstacles.splice(i, 1);
              continue;
            }

            if (obs.kind === 'rock' && intersects(bikeHitbox(), obs)) {
              game.running = false;
            }

            if (obs.kind === 'pit') {
              var frontWheelX = bike.x + bike.w - 10;
              var rearWheelX = bike.x + 12;
              var overPit = (frontWheelX > obs.x && frontWheelX < obs.x + obs.w) ||
                (rearWheelX > obs.x && rearWheelX < obs.x + obs.w);
              if (overPit && bike.onGround) {
                game.running = false;
              }
            }
          }

          if (!game.running) {
            game.best = Math.max(game.best, Math.floor(game.score));
          }
        }

        function drawSky() {
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(0, 0, canvas.width, GROUND_Y);
        }

        function drawGround() {
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
          ctx.fillStyle = '#1f2937';
          for (var x = -40; x < canvas.width + 40; x += 40) {
            var laneX = x - ((game.tick * game.speed) % 40);
            ctx.fillRect(laneX, GROUND_Y + 22, 20, 4);
          }
        }

        function drawBike() {
          var rearX = bike.x + 14;
          var frontX = bike.x + bike.w - 14;
          var wheelY = bike.y + bike.h - 2;

          var cx = bike.x + bike.w * 0.52; // centro del cuadro
          var topY = bike.y + 12;

          // Animación: giro de ruedas según velocidad y tick
          var spin = -(game.tick * game.speed) / 26;

          function wheel(x, y, r) {
            // neumático
            ctx.strokeStyle = '#0b1220';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();

            // aro
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r - 2, 0, Math.PI * 2);
            ctx.stroke();

            // centro
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(x, y, 2.2, 0, Math.PI * 2);
            ctx.fill();

            // rayos (rotando)
            ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
            ctx.lineWidth = 1;
            for (var i = 0; i < 6; i += 1) {
              var a = spin + (Math.PI * 2 * i) / 6;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
              ctx.stroke();
            }
          }

          // ruedas
          wheel(rearX, wheelY, 11);
          wheel(frontX, wheelY, 11);

          // sombras/relieve simple del cuadro
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // cuadro (más "bicicleta")
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 4;

          // puntos del cuadro
          var bbX = cx + 4;          // caja pedalera
          var bbY = wheelY - 6;
          var seatX = cx - 12;
          var seatY = topY + 2;
          var headX = frontX - 4;
          var headY = wheelY - 20;

          ctx.beginPath();
          // triángulo trasero
          ctx.moveTo(rearX, wheelY);
          ctx.lineTo(bbX, bbY);
          ctx.lineTo(seatX, seatY);
          ctx.lineTo(rearX, wheelY);

          // tubo superior a dirección
          ctx.moveTo(seatX, seatY);
          ctx.lineTo(headX, headY);

          // tubo inferior a dirección
          ctx.moveTo(bbX, bbY);
          ctx.lineTo(headX, headY);

          // horquilla a rueda delantera
          ctx.moveTo(headX, headY);
          ctx.lineTo(frontX, wheelY);

          ctx.stroke();

          // bielas/pedal
          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(bbX, bbY, 4, 0, Math.PI * 2);
          ctx.stroke();

          var pedalRate = Math.min(0.95, 0.45 + game.speed * 0.07);
          var base = (game.tick * pedalRate) / 10;
          var crankA = base + Math.sin(base) * 0.12;
          var pedalX = bbX + Math.cos(crankA) * 10;
          var pedalY = bbY + Math.sin(crankA) * 10;
          ctx.beginPath();
          ctx.moveTo(bbX, bbY);
          ctx.lineTo(pedalX, pedalY);
          ctx.stroke();

          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pedalX - 4, pedalY);
          ctx.lineTo(pedalX + 4, pedalY);
          ctx.stroke();

          // asiento + manubrio
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          // asiento
          ctx.moveTo(seatX - 2, seatY - 10);
          ctx.lineTo(seatX - 2, seatY - 2);
          ctx.moveTo(seatX - 10, seatY - 12);
          ctx.lineTo(seatX + 6, seatY - 12);

          // manubrio
          ctx.moveTo(headX + 2, headY - 10);
          ctx.lineTo(headX - 2, headY);
          ctx.moveTo(headX - 14, headY - 10);
          ctx.lineTo(headX + 10, headY - 10);
          ctx.stroke();

          // ciclista (simple pero “humano”)
          var riderLean = bike.onGround ? 0.0 : -0.12;

          var hipX = cx - 2;
          var hipY = seatY - 6;

          var shoulderX = hipX + 10;
          var shoulderY = hipY - 16;

          var headXr = shoulderX + 10;
          var headYr = shoulderY - 10;

          // cabeza
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(headXr, headYr, 5, 0, Math.PI * 2);
          ctx.fill();

          // torso
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(shoulderX, shoulderY);
          ctx.lineTo(hipX, hipY);
          ctx.stroke();

          // brazos al manubrio
          var gripX = headX - 6;
          var gripY = headY - 10;

          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(shoulderX + 2, shoulderY + 2);
          ctx.lineTo(gripX - 2, gripY + 2);
          ctx.stroke();

          // piernas pedaleando (dos líneas alternadas)
          var legA = crankA + riderLean;
          var knee1X = hipX + Math.cos(legA) * 10;
          var knee1Y = hipY + 10 + Math.sin(legA) * 6;

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          // pierna 1: cadera -> rodilla -> pedal
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(knee1X, knee1Y);
          ctx.lineTo(pedalX, pedalY);
          ctx.stroke();

          // pierna 2 (opuesta)
          var pedal2X = bbX + Math.cos(crankA + Math.PI) * 10;
          var pedal2Y = bbY + Math.sin(crankA + Math.PI) * 10;
          var knee2X = hipX + Math.cos(legA + Math.PI) * 10;
          var knee2Y = hipY + 10 + Math.sin(legA + Math.PI) * 6;

          ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(knee2X, knee2Y);
          ctx.lineTo(pedal2X, pedal2Y);
          ctx.stroke();
        }

        function drawObstacles() {
          for (var i = 0; i < obstacles.length; i += 1) {
            var obs = obstacles[i];
            if (obs.kind === 'rock') {
              ctx.fillStyle = '#9ca3af';
              ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
              continue;
            }
            ctx.fillStyle = '#020617';
            ctx.fillRect(obs.x, GROUND_Y, obs.w, canvas.height - GROUND_Y);
          }
        }

        function drawHud() {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 18px system-ui';
          ctx.fillText('Puntos: ' + Math.floor(game.score), 16, 30);
          ctx.fillText('Record: ' + game.best, 16, 54);

          if (!game.running) {
            ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.font = 'bold 30px system-ui';
            ctx.fillText('Te caíste', canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = '16px system-ui';
            ctx.fillText('Presiona R para reiniciar', canvas.width / 2, canvas.height / 2 + 22);
            ctx.textAlign = 'start';
          }
        }

        function loop() {
          update();
          drawSky();
          drawGround();
          drawObstacles();
          drawBike();
          drawHud();
          requestAnimationFrame(loop);
        }

        window.addEventListener('keydown', function (event) {
          if (event.code === 'Space' || event.code === 'ArrowUp') {
            event.preventDefault();
            jump();
          }
          if (event.code === 'KeyR') {
            resetGame();
          }
        });
        canvas.addEventListener('mousedown', jump);
        canvas.addEventListener('touchstart', function (event) {
          event.preventDefault();
          jump();
        }, { passive: false });

        loop();
      })();
    </script>
  </body>
</html>`;
