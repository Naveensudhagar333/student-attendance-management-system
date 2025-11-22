// reports.js: builds simple aggregated reports
const CLASSES_KEY = "classes";
const ATT_KEY = "attendance";
let classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || {};
let attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || {};

function populateReportClass(){
  const sel = q("#rClass"); sel.innerHTML="";
  Object.keys(classes).forEach(c=> sel.innerHTML += `<option value="${c}">${c}</option>`);
}
function buildReports(){
  const cls = q("#rClass").value;
  const from = q("#rFrom").value; const to = q("#rTo").value;
  if(!cls) return;
  // default one month
  let start = from || (()=>{const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10);})();
  let end = to || new Date().toISOString().slice(0,10);
  const dates = Utils.datesBetween(start,end);
  // summary: percent per date
  const labels = []; const data=[];
  dates.forEach(date=>{
    labels.push(date);
    const present = attendance[date] && attendance[date][cls] ? Object.values(attendance[date][cls]).filter(Boolean).length : 0;
    data.push(present);
  });
  // chart
  const ctx = q("#repChart").getContext("2d");
  if(window.repChart) window.repChart.destroy();
  window.repChart = new Chart(ctx, { type:"bar", data:{labels, datasets:[{label:"Present", data, backgroundColor:"#79c0ff"}]}});
  // table
  let html=`<table><tr><th>Date</th><th>Present</th><th>Absent</th></tr>`;
  dates.forEach(date=>{
    const present = attendance[date] && attendance[date][cls] ? Object.values(attendance[date][cls]).filter(Boolean).length : 0;
    const total = (classes[cls]||[]).length; html += `<tr><td>${date}</td><td>${present}</td><td>${total-present}</td></tr>`;
  });
  html += `</table>`;
  q("#reportTableWrap").innerHTML = html;
}
function q(s){ return document.querySelector(s); }
(function init(){
  classes = JSON.parse(localStorage.getItem(CLASSES_KEY)) || classes;
  attendance = JSON.parse(localStorage.getItem(ATT_KEY)) || attendance;
  populateReportClass();
  const today = new Date().toISOString().slice(0,10);
  q("#rTo").value = today;
  const d = new Date(); d.setMonth(d.getMonth()-1);
  q("#rFrom").value = d.toISOString().slice(0,10);
  buildReports();
})();
