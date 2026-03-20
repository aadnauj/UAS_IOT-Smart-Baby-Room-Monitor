// Import Firebase SDK 
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged        
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smart-plant-green-house.firebaseapp.com",
  projectId: "smart-plant-green-house",
  storageBucket: "smart-plant-green-house.firebasestorage.app",
  messagingSenderId: "978210883222",
  appId: "1:978210883222:web:481a78ff79dba5257864b7",
  databaseURL: "https://smart-plant-green-house-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Init
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// Elements
const loginFormEl = document.getElementById("loginForm");
const dashboardEl = document.getElementById("dashboard");
const loginBtn    = document.getElementById("loginBtn");
const logoutBtn   = document.getElementById("logoutBtn");

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginFormEl.style.display = "none";
    dashboardEl.style.display = "block";
    listenToSensors();
  } else {
    loginFormEl.style.display = "flex";
    dashboardEl.style.display = "none";
  }
});

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const pass  = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, pass)
    .catch(err => alert("Login gagal: " + err.message));
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// ===== HERO STATE =====
let currentMetric = "temperature"; 
let tempVal = 0, tempStatus = "Normal";
let humidityVal = 0, humidityStatus = "Normal";
let statusVal = "NYAMAN", statusDesc = "Kondisi Aman";

// Elements hero
const heroCircle   = document.getElementById("heroCircle");
const heroValueEl  = document.getElementById("heroValue");
const heroLabelEl  = document.getElementById("heroLabel");
const heroStatusEl = document.getElementById("heroStatus");

// ===== UI LOGIC =====
function moveCircleTo(metric) {
  if (!heroCircle) return;

  if (metric === "temperature") heroCircle.style.left = "16%";
  else if (metric === "humidity") heroCircle.style.left = "50%";
  else if (metric === "status") heroCircle.style.left = "84%";
}

function refreshHero() {
  moveCircleTo(currentMetric);

  const circleIconEl = document.querySelector(".circle-icon");

  if (currentMetric === "temperature") {
    heroValueEl.innerHTML = tempVal + '<span class="metric-unit">°C</span>';
    heroLabelEl.textContent = "Suhu Ruangan";
    heroStatusEl.textContent = tempStatus;
    if (circleIconEl) circleIconEl.textContent = "🌡️";
  }

  if (currentMetric === "humidity") {
    heroValueEl.innerHTML = humidityVal + '<span class="metric-unit">%</span>';
    heroLabelEl.textContent = "Kelembapan Udara";
    heroStatusEl.textContent = humidityStatus;
    if (circleIconEl) circleIconEl.textContent = "💧";
  }

  if (currentMetric === "status") {
    heroValueEl.innerHTML = statusVal;
    heroLabelEl.textContent = "Status Ruangan";
    heroStatusEl.textContent = statusDesc;
    if (circleIconEl) circleIconEl.textContent = "🏠";
  }
}

// ===== SENSOR =====
function listenToSensors() {
  const sensorRef = ref(db, "iot");

  onValue(sensorRef, (snapshot) => {
    const d = snapshot.val() || {};
    updateTemperature(d.temperature ?? 0);
    updateHumidity(d.humidity ?? 0);
    updateStatus(d.status ?? "NYAMAN");
  });
}

function updateTemperature(value) {
  tempVal = value;

  if (value < 18 || value > 30) tempStatus = "Bahaya";
  else if (value <= 20) tempStatus = "Sejuk";
  else if (value <= 27) tempStatus = "Optimal";
  else tempStatus = "Hangat";

  document.getElementById("temperatureValue").innerText = value;
  document.getElementById("temperatureStatus").innerText = tempStatus;

  refreshHero();
}

function updateHumidity(value) {
  humidityVal = value;

  if (value < 30 || value > 70) humidityStatus = "Bahaya";
  else if (value < 40) humidityStatus = "Rendah";
  else if (value <= 60) humidityStatus = "Optimal";
  else humidityStatus = "Tinggi";

  document.getElementById("humidityValue").innerText = value;
  document.getElementById("humidityStatus").innerText = humidityStatus;

  refreshHero();
}

function updateStatus(value) {
  statusVal = value;

  if (value === "BAHAYA") statusDesc = "Kondisi Berbahaya";
  else if (value === "WASPADA") statusDesc = "Perlu Perhatian";
  else statusDesc = "Kondisi Aman";

  document.getElementById("statusText").innerText = value;
  document.getElementById("statusDesc").innerText = statusDesc;

  refreshHero();
}

// CLICK HANDLER
document.querySelectorAll(".metric-toggle").forEach(card => {
  card.addEventListener("click", () => {
    currentMetric = card.dataset.metric;
    refreshHero();
  });
});

refreshHero();