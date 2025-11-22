// attendance.js — shares storage keys
const CLASSES_KEY = "classes";
const ATT_KEY = "attendance";
let classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || {};
let attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || {};
let currentClass = Object.keys(classes)[0] || null;

function persist(){
  localStorage.setItem(ATT_KEY, JSON.stringify(attendance));
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

function populateClassSelectAtt(){
  const sel = document.getElementById("classSelectAtt");
  sel.innerHTML = "";
  Object.keys(classes).forEach(c=>{
    const opt = document.createElement("option"); opt.value=c; opt.textContent=c; sel.appendChild(opt);
  });
  sel.value = currentClass;
}

function changeClassAtt(){
  currentClass = document.getElementById("classSelectAtt").value;
  loadAttendance();
}

function loadAttendance(){
  const date = document.getElementById("attDate").value;
  if(!date) return;
  attendance[date] = attendance[date] || {};
  attendance[date][currentClass] = attendance[date][currentClass] || {};
  const tbody = document.querySelector("#attTable tbody");
  tbody.innerHTML = "";
  (classes[currentClass] || []).forEach(s=>{
    const checked = attendance[date][currentClass][s.roll] ? "checked" : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.roll}</td><td>${s.name}</td><td><input type="checkbox" ${checked} onchange="toggle('${date}','${s.roll}', this.checked)"></td>`;
    tbody.appendChild(tr);
  });
}

function toggle(date, roll, val){
  attendance[date] = attendance[date] || {};
  attendance[date][currentClass] = attendance[date][currentClass] || {};
  attendance[date][currentClass][roll] = !!val;
  persist();
  // voice
  if(val) { Utils.speak(`${roll} marked present`); }
}

function markAllPresent(){
  const date = document.getElementById("attDate").value; if(!date) return alert("Select date");
  attendance[date] = attendance[date] || {}; attendance[date][currentClass] = attendance[date][currentClass] || {};
  (classes[currentClass] || []).forEach(s => attendance[date][currentClass][s.roll] = true);
  persist(); loadAttendance();
}

function exportCSV(){
  const date = document.getElementById("attDate").value; if(!date) return alert("Select date");
  let csv = "roll,name,present\n";
  (classes[currentClass] || []).forEach(s=>{
    const val = attendance[date] && attendance[date][currentClass] && attendance[date][currentClass][s.roll] ? "Yes" : "No";
    csv += `${s.roll},${s.name},${val}\n`;
  });
  Utils.downloadBlob(csv, `attendance-${currentClass}-${date}.csv`);
}

function printAttendance(){
  const date = document.getElementById("attDate").value; if(!date) return alert("Select date");
  let html = `<h2>Attendance ${currentClass} - ${date}</h2><table border="1" cellpadding="6"><tr><th>Roll</th><th>Name</th><th>Present</th></tr>`;
  (classes[currentClass] || []).forEach(s=>{
    const val = attendance[date] && attendance[date][currentClass] && attendance[date][currentClass][s.roll] ? "Yes":"No";
    html += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${val}</td></tr>`;
  });
  html += `</table>`;
  const w = window.open("", "_blank"); w.document.write(`<html><head><title>Print</title></head><body>${html}</body></html>`); w.print(); w.close();
}

// init
(function init(){
  classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || classes;
  attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || attendance;
  currentClass = currentClass || Object.keys(classes)[0];
  populateClassSelectAtt();
  const d = new Date().toISOString().slice(0,10);
  document.getElementById("attDate").value = d;
  loadAttendance();
})();
