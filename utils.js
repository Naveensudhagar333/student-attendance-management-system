// utils.js - shared helpers
const Utils = {
  ensureDemoData: function(){
    if(!localStorage.getItem("classes")){
      const demo = {
        "Class A": [
          {roll:"A01", name:"Naveen", photo:null},
          {roll:"A02", name:"Ramesh", photo:null},
          {roll:"A03", name:"Meera", photo:null}
        ],
        "Class B": [
          {roll:"B01", name:"Arun", photo:null},
          {roll:"B02", name:"Kavya", photo:null}
        ]
      };
      localStorage.setItem("classes", JSON.stringify(demo));
    }
    if(!localStorage.getItem("attendance")){
      localStorage.setItem("attendance", JSON.stringify({}));
    }
  },

  downloadBlob: function(text, filename="data.txt", mime="text/csv"){
    const blob = new Blob([text], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  datesBetween: function(start, end){
    const a = new Date(start), b = new Date(end);
    const out = [];
    for(let d = new Date(a); d<=b; d.setDate(d.getDate()+1)) out.push(new Date(d).toISOString().slice(0,10));
    return out;
  },

  getStudentPercent: function(attendanceObj, cls, roll){
    const dates = Object.keys(attendanceObj || {});
    if(dates.length === 0) return NaN;
    let tot=0, pres=0;
    dates.forEach(date=>{
      if(attendanceObj[date] && attendanceObj[date][cls]){
        tot++;
        if(attendanceObj[date][cls][roll]) pres++;
      }
    });
    return tot ? Math.round((pres/tot)*100) : NaN;
  },

  speak: function(text){
    try{ const s = new SpeechSynthesisUtterance(text); speechSynthesis.speak(s); }catch(e){}
  }
};
