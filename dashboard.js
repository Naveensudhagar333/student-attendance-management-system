// dashboard.js
// Advanced dashboard: photo upload (base64), edit/delete, QR scanner hook, voice, chart, multi-class

// reuse Utils helper (utils.js)
const CLASSES_KEY = "classes";
const ATT_KEY = "attendance";
let classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || {};
let attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || {};
let currentClass = Object.keys(classes)[0] || null;
let chart = null;

// UI helpers
const q = s => document.querySelector(s);
const qs = s => document.querySelectorAll(s);

function persist() {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  localStorage.setItem(ATT_KEY, JSON.stringify(attendance));
}

function populateClassSelect() {
  const sel = q("#classSelect");
  sel.innerHTML = "";
  Object.keys(classes).forEach(c => {
    const o = document.createElement("option"); o.value = c; o.textContent = c;
    sel.appendChild(o);
  });
  sel.value = currentClass;
}

function toggleProfile() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const menu = q("#profileMenu");
  if (menu.classList.contains("hide")) {
    menu.classList.remove("hide");
    menu.innerHTML = `<div><b>${user.user}</b></div><div>${user.role}</div><hr/>
      <button onclick="logout()">Logout</button>`;
  } else menu.classList.add("hide");
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// class mgmt
function openAddClass() {
  showModal("Add Class", `<input id="newClassName" placeholder="Class name" />
    <div style="margin-top:10px"><button onclick="confirmAddClass()">Add</button></div>`);
}
function confirmAddClass(){
  const name = q("#newClassName").value.trim();
  if(!name) return alert("Enter name");
  if(classes[name]) return alert("Class exists");
  classes[name] = []; currentClass = name; persist(); populateClassSelect(); closeModal(); loadStudents(); updateStats(); drawChart();
}

function changeClass() {
  currentClass = q("#classSelect").value;
  loadStudents(); updateStats(); drawChart();
}

// students
function addStudent() {
  const name = q("#sName").value.trim();
  const roll = q("#sRoll").value.trim();
  const file = q("#sPhoto").files[0];
  if(!name || !roll) return alert("Enter name and roll");
  if(classes[currentClass].some(s=>s.roll===roll)) return alert("Roll exists");
  if(file){
    const reader = new FileReader();
    reader.onload = (e)=> {
      classes[currentClass].push({ roll, name, photo: e.target.result });
      persist(); q("#sName").value=""; q("#sRoll").value=""; q("#sPhoto").value=""; loadStudents(); updateStats(); drawChart();
    };
    reader.readAsDataURL(file);
  } else {
    classes[currentClass].push({ roll, name, photo: null });
    persist(); q("#sName").value=""; q("#sRoll").value=""; loadStudents(); updateStats(); drawChart();
  }
}

function loadStudents(filter="") {
  const tbody = q("#studentTable tbody"); tbody.innerHTML="";
  (classes[currentClass]||[]).forEach((s,i)=>{
    if(filter && !(s.name.toLowerCase().includes(filter) || s.roll.toLowerCase().includes(filter))) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.roll}</td>
      <td>${s.name}</td>
      <td>${s.photo? `<img src="${s.photo}" class="thumb">` : "-"}</td>
      <td>
        <button onclick="openStudentModal(${i})">View</button>
        <button onclick="editStudent(${i})">Edit</button>
        <button onclick="deleteStudent(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editStudent(i){
  const s = classes[currentClass][i];
  showModal("Edit Student", `
    <input id="editName" value="${s.name}" />
    <input id="editRoll" value="${s.roll}" />
    <input type="file" id="editPhoto" accept="image/*" />
    <div style="margin-top:10px"><button onclick="confirmEdit(${i})">Save</button></div>
  `);
}
function confirmEdit(i){
  const newName = q("#editName").value.trim();
  const newRoll = q("#editRoll").value.trim();
  if(!newName||!newRoll) return alert("Enter both");
  if(classes[currentClass].some((st,idx)=>st.roll===newRoll && idx!==i)) return alert("Roll exists");
  const file = q("#editPhoto").files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = e=> {
      classes[currentClass][i].name = newName;
      classes[currentClass][i].roll = newRoll;
      classes[currentClass][i].photo = e.target.result;
      persist(); closeModal(); loadStudents(); updateStats(); drawChart();
    };
    reader.readAsDataURL(file);
  } else {
    classes[currentClass][i].name=newName; classes[currentClass][i].roll=newRoll;
    persist(); closeModal(); loadStudents(); updateStats(); drawChart();
  }
}

function deleteStudent(i){
  if(!confirm("Delete student?")) return;
  const roll = classes[currentClass][i].roll;
  classes[currentClass].splice(i,1);
  // remove roll attendance
  Object.keys(attendance).forEach(date=>{
    if(attendance[date] && attendance[date][currentClass]) delete attendance[date][currentClass][roll];
  });
  persist(); loadStudents(); updateStats(); drawChart();
}

function openStudentModal(i){
  if(i===null) return;
  const s = classes[currentClass][i];
  const perc = Utils.getStudentPercent(attendance, currentClass, s.roll);
  showModal("Student Profile", `<p><b>Roll:</b> ${s.roll}</p><p><b>Name:</b> ${s.name}</p>
    <p><b>Attendance %:</b> ${isNaN(perc) ? "N/A" : perc + "%"}</p>
    ${s.photo? `<img src="${s.photo}" style="width:120px;border-radius:8px"/>` : ""}
  `);
}

// search
function searchStudent(){
  const qv = q("#search").value.trim().toLowerCase();
  loadStudents(qv);
}

// stats + chart
function todayDate(){ return new Date().toISOString().slice(0,10); }
function updateStats(){
  const list = classes[currentClass] || [];
  q("#totalStudents").textContent = list.length;
  const date = todayDate();
  const attForDate = (attendance[date] && attendance[date][currentClass]) || {};
  const present = list.filter(s => attForDate[s.roll]).length;
  q("#presentToday").textContent = present;
  q("#absentToday").textContent = list.length - present;
  q("#attPercent").textContent = list.length ? Math.round((present/list.length)*100)+"%" : "0%";
}

function drawChart(){
  const labels = []; const presentCounts=[];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    labels.push(key);
    const val = attendance[key] && attendance[key][currentClass] ? Object.values(attendance[key][currentClass]).filter(Boolean).length : 0;
    presentCounts.push(val);
  }
  const ctx = q("#attChart").getContext("2d");
  if(chart) chart.destroy();
  chart = new Chart(ctx, { type: "line", data:{labels, datasets:[{label:"Present", data:presentCounts, borderColor:"#58a6ff", backgroundColor:"rgba(88,166,255,0.08)", tension:0.25}]}, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
}

// export / import
function exportStudentsCSV(){
  const list = classes[currentClass] || []; let csv="roll,name\n";
  list.forEach(s=> csv += `${s.roll},${s.name}\n`);
  Utils.downloadBlob(csv, `students-${currentClass}.csv`);
}
function exportFullBackup(){
  const payload = { classes, attendance };
  const json = JSON.stringify(payload, null, 2);
  Utils.downloadBlob(json, `attendance-backup-${new Date().toISOString().slice(0,10)}.json`, "application/json");
}
function openImportModal(){
  showModal("Import Backup JSON", `<textarea id="importArea" style="width:100%;height:160px;" placeholder='Paste backup JSON here'></textarea>
    <div style="margin-top:8px"><button onclick="importBackup()">Import</button></div>`);
}
function importBackup(){
  try{
    const raw = q("#importArea").value.trim(); if(!raw) return alert("Paste JSON");
    const payload = JSON.parse(raw);
    if(payload.classes) classes = payload.classes;
    if(payload.attendance) attendance = payload.attendance;
    persist(); closeModal(); populateClassSelect(); loadStudents(); updateStats(); drawChart(); alert("Imported");
  }catch(e){ alert("Invalid JSON"); }
}

// QR Scanner
let qrStream=null;
let qrScanId=null;
function openQRScanner(){
  q("#qrLayer").classList.remove("hide");
  const video = q("#qrVideo");
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(stream=>{
    qrStream = stream; video.srcObject = stream; video.setAttribute("playsinline", true); video.play();
    qrScanLoop();
  }).catch(e=> alert("Camera access required"));
}
function qrScanLoop(){
  const video = q("#qrVideo");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  qrScanId = requestAnimationFrame(qrScanLoop);
  if(video.readyState === video.HAVE_ENOUGH_DATA){
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const imgData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const code = jsQR(imgData.data, canvas.width, canvas.height);
    if(code){
      const roll = code.data.trim();
      markPresentByRoll(roll);
      speak(`${roll} marked present`);
      closeQRScanner();
    }
  }
}
function closeQRScanner(){
  cancelAnimationFrame(qrScanId);
  if(qrStream){ qrStream.getTracks().forEach(t=>t.stop()); qrStream=null; }
  q("#qrLayer").classList.add("hide");
}

// voice
function speak(text){
  try{ const s = new SpeechSynthesisUtterance(text); speechSynthesis.speak(s); }catch(e){}
}
function voiceTest(){ speak("Voice feedback initialized. Say attendance confirmed."); }

// helper mark
function markPresentByRoll(roll){
  const date = todayDate();
  attendance[date] = attendance[date] || {};
  attendance[date][currentClass] = attendance[date][currentClass] || {};
  attendance[date][currentClass][roll] = true;
  persist(); updateStats(); drawChart();
}

// print
function printStudents(){
  const list = classes[currentClass] || [];
  let html = `<h2>Students - ${currentClass}</h2><table border="1" cellpadding="6"><tr><th>Roll</th><th>Name</th></tr>`;
  list.forEach(s=> html += `<tr><td>${s.roll}</td><td>${s.name}</td></tr>`);
  html += `</table>`;
  const w = window.open("", "_blank"); w.document.write(`<html><head><title>Print</title></head><body>${html}</body></html>`); w.print(); w.close();
}

// modal helpers
function showModal(title, html){ q("#modal").classList.remove("hide"); q("#modalTitle").textContent=title; q("#modalBody").innerHTML=html;}
function closeModal(){ q("#modal").classList.add("hide"); q("#modalBody").innerHTML=""; }

// init
(function init(){
  classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || classes;
  attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || attendance;
  currentClass = currentClass || Object.keys(classes)[0];
  populateClassSelect();
  loadStudents(); updateStats(); drawChart();
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if(user) q("#avatarInitial").textContent = user.user.charAt(0).toUpperCase();
})();
