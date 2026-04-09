// ======================= MQTT SETUP =======================
const mqttHost = "wss://8aba4d703c304d2b9abd3f4bfa8b21f8.s1.eu.hivemq.cloud:8884/mqtt";
const mqttUser = "ikbalarisandi";
const mqttPass = "Percobaan1";

const client = mqtt.connect(mqttHost, {
  username: mqttUser,
  password: mqttPass,
  protocol: 'wss',
  reconnectPeriod: 3000
});

// Variabel untuk menyimpan data terbaru
let currentSuhu = 32.1;
let currentHum = 85.0;

// Elemen DOM
const suhuSpan = document.getElementById("suhuValue");
const humSpan = document.getElementById("humValue");
const pemanasStateSpan = document.getElementById("pemanasState");
const kipasStateSpan = document.getElementById("kipasState");
const suhuStatusBadge = document.getElementById("suhuStatusBadge");
const suhuStatusText = document.getElementById("suhuStatusText");
const humStatusBadge = document.getElementById("humStatusBadge");
const humStatusText = document.getElementById("humStatusText");
const mqttStatusSpan = document.getElementById("mqttStatus");
const faseTextSpan = document.getElementById("faseText");
const timerProgressSpan = document.getElementById("timerProgress");

// Fungsi update tampilan suhu, kelembapan, relay (pemanas & kipas)
function updateDashboard(suhu, hum) {
  // Update angka
  suhuSpan.innerText = suhu.toFixed(1);
  humSpan.innerText = Math.floor(hum);

  // ------------------- SUHU STATUS -------------------
  if (suhu >= 28.0 && suhu <= 33.0) {
    suhuStatusBadge.innerText = "Normal - Ideal";
    suhuStatusText.innerText = "Normal - Ideal";
    suhuStatusBadge.style.background = "#15803d";
  } else if (suhu < 28.0) {
    suhuStatusBadge.innerText = "Dingin";
    suhuStatusText.innerText = "Di bawah optimal";
    suhuStatusBadge.style.background = "#1e3a8a";
  } else {
    suhuStatusBadge.innerText = "Panas";
    suhuStatusText.innerText = "Di atas ideal";
    suhuStatusBadge.style.background = "#9b2c1d";
  }

  // ------------------- KELEMBAPAN STATUS -------------------
  if (hum >= 75 && hum <= 90) {
    humStatusBadge.innerText = "Optimal";
    humStatusText.innerText = "Optimal";
    humStatusBadge.style.background = "#15803d";
  } else if (hum < 75) {
    humStatusBadge.innerText = "Kering";
    humStatusText.innerText = "Perlu lembabkan";
    humStatusBadge.style.background = "#854d0e";
  } else {
    humStatusBadge.innerText = "Terlalu Lembab";
    humStatusText.innerText = "Waspada jamur";
    humStatusBadge.style.background = "#b91c1c";
  }

  // =============== LOGIKA RELAY (PEMANAS & KIPAS) ===============
  let pemanasOn = false;
  let kipasOn = false;

  // Pemanas: jika suhu di bawah 29.0 derajat
  if (suhu < 29.0) {
    pemanasOn = true;
  } else {
    pemanasOn = false;
  }

  // Kipas: jika suhu terlalu tinggi (>=31.5°C) atau kelembapan > 88%
  if (suhu >= 31.5 || hum > 88) {
    kipasOn = true;
  } else {
    kipasOn = false;
  }

  // Update tampilan relay
  if (pemanasOn) {
    pemanasStateSpan.innerText = "ON";
    pemanasStateSpan.classList.add("relay-on");
    pemanasStateSpan.classList.remove("relay-off");
  } else {
    pemanasStateSpan.innerText = "OFF";
    pemanasStateSpan.classList.add("relay-off");
    pemanasStateSpan.classList.remove("relay-on");
  }

  if (kipasOn) {
    kipasStateSpan.innerText = "ON";
    kipasStateSpan.classList.add("relay-on");
    kipasStateSpan.classList.remove("relay-off");
  } else {
    kipasStateSpan.innerText = "OFF";
    kipasStateSpan.classList.add("relay-off");
    kipasStateSpan.classList.remove("relay-on");
  }

  // Update fase inkubasi & timer progress
  updateFaseAndTimer(suhu, hum);
}

// Simulasi waktu proses inkubasi
function updateFaseAndTimer(suhu, hum) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  let totalMenit = hours * 60 + minutes;
  let jamProgres = (totalMenit % (24 * 60)) / 60;
  let timerString = `${Math.floor(jamProgres)}h ${Math.floor((jamProgres % 1) * 60)}m / 24h`;

  if (jamProgres < 24) {
    faseTextSpan.innerHTML = `Inkubasi (Aktif) <i class="fas fa-seedling"></i>`;
    timerProgressSpan.innerText = timerString;
  } else {
    faseTextSpan.innerHTML = `Panen siap <i class="fas fa-check-circle"></i>`;
    timerProgressSpan.innerText = `24h / 24h (Selesai)`;
  }
}

// Fungsi update jam real-time
function updateRealTimeClock() {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = days[now.getDay()];
  const tanggal = now.getDate();
  const bulan = now.toLocaleString('id-ID', { month: 'short' }).toUpperCase();
  const tahun = now.getFullYear();
  let jam = now.getHours().toString().padStart(2, '0');
  let menit = now.getMinutes().toString().padStart(2, '0');
  let detik = now.getSeconds().toString().padStart(2, '0');
  const dateTimeString = `${dayName}, ${tanggal} ${bulan} ${tahun} - ${jam}:${menit}:${detik}`;
  document.getElementById("liveDateTime").innerText = dateTimeString;
}

// ========= TREN DATA 12 JAM TERAKHIR =========
let historySuhu = [30.2, 31.1, 32.5, 31.8, 32.0, 32.1];
let historyHum = [82, 84, 86, 85, 84, 85];

function updateTrendBars(suhuBaru, humBaru) {
  historySuhu.push(suhuBaru);
  historyHum.push(humBaru);
  if (historySuhu.length > 6) historySuhu.shift();
  if (historyHum.length > 6) historyHum.shift();
  renderTrendChart();
}

function renderTrendChart() {
  const container = document.getElementById("trendBarsContainer");
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < historySuhu.length; i++) {
    const suhuVal = historySuhu[i];
    const humVal = historyHum[i];
    const suhuHeight = (suhuVal / 38) * 70;
    const humHeight = (humVal / 95) * 70;

    const barDiv = document.createElement("div");
    barDiv.className = "bar-item";
    barDiv.innerHTML = `
      <div style="display:flex; gap:4px; width:100%; align-items:flex-end; justify-content:center; height:70px;">
        <div style="background:#f97316; width:35%; border-radius:8px; height:${suhuHeight}px;"></div>
        <div style="background:#38bdf8; width:35%; border-radius:8px; height:${humHeight}px;"></div>
      </div>
      <div class="bar-label">${i * 2}jam</div>
      <div style="font-size:9px;">${suhuVal.toFixed(1)}°/${Math.round(humVal)}%</div>
    `;
    container.appendChild(barDiv);
  }
}

// MQTT Event handler
client.on("connect", () => {
  console.log("MQTT Connected ke HiveMQ Cloud");
  mqttStatusSpan.innerText = "ONLINE";
  mqttStatusSpan.style.background = "#15803d";
  client.subscribe("esp32/dht11", (err) => {
    if (!err) console.log("Subscribe ke esp32/dht11");
  });
});

client.on("error", (err) => {
  console.error("MQTT error", err);
  mqttStatusSpan.innerText = "OFFLINE";
  mqttStatusSpan.style.background = "#b91c1c";
});

client.on("message", (topic, message) => {
  try {
    let payloadStr = message.toString();
    let data = JSON.parse(payloadStr);
    let suhu = parseFloat(data.suhu || data.temperature || data.temp);
    let hum = parseFloat(data.hum || data.humidity);

    if (isNaN(suhu)) suhu = currentSuhu;
    if (isNaN(hum)) hum = currentHum;

    if (suhu >= 0 && suhu <= 60) currentSuhu = suhu;
    if (hum >= 0 && hum <= 100) currentHum = hum;

    updateDashboard(currentSuhu, currentHum);
    updateTrendBars(currentSuhu, currentHum);
  } catch (e) {
    console.warn("Parse error atau payload bukan JSON:", e);
  }
});

// Fallback simulasi jika koneksi gagal
function fallbackSimulation() {
  setInterval(() => {
    if (!client.connected) {
      let perubahanSuhu = (Math.random() - 0.5) * 0.4;
      let perubahanHum = (Math.random() - 0.5) * 1.2;
      let newSuhu = currentSuhu + perubahanSuhu;
      let newHum = currentHum + perubahanHum;
      newSuhu = Math.min(37, Math.max(24, newSuhu));
      newHum = Math.min(94, Math.max(65, newHum));
      currentSuhu = newSuhu;
      currentHum = newHum;
      updateDashboard(currentSuhu, currentHum);
      updateTrendBars(currentSuhu, currentHum);
    }
  }, 7500);
}

// Inisialisasi
setInterval(updateRealTimeClock, 1000);
updateRealTimeClock();
updateDashboard(32.1, 85.0);
renderTrendChart();
updateTrendBars(32.1, 85);

setInterval(() => {
  if (currentSuhu) updateFaseAndTimer(currentSuhu, currentHum);
  else updateFaseAndTimer(32.0, 85);
}, 60000);

setTimeout(() => {
  if (!client.connected || currentSuhu === 32.1 && currentHum === 85.0) {
    fallbackSimulation();
  }
}, 4000);

window.addEventListener('load', () => {
  renderTrendChart();
});
