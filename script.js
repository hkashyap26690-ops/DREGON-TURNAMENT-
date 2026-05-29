function setText(id, text){
  let el = document.getElementById(id);
  if(el){
    el.innerText = text;
  }
}

const CLOUD_NAME = "dqiofruox";
const UPLOAD_PRESET = "ff_upload";

async function uploadImage(file){

  let formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try{
    let res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    if(!res.ok){
      alert("Upload failed ❌");
      return null;
    }

    let data = await res.json(); // ✔ सिर्फ यही use करो

    console.log("Cloudinary:", data);

    return data.secure_url || null;

  }catch(e){
    console.log(e);
    alert("Upload error ❌");
    return null;
  }
}

// 🔥 Firebase Config
firebase.initializeApp({
apiKey: "AIzaSyAuHU5TQOh_xzqbDTR5hmi9sp3cF6J5s-s",
authDomain: "ff-turnament-51357.firebaseapp.com",
projectId: "ff-turnament-51357"
});

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
.then(() => {
  console.log("Persistence Enabled ✅");
})
.catch((error) => {
  console.log(error);
});

const db = firebase.firestore();

const currentId = new URLSearchParams(window.location.search).get("id");


// 🔐 GOOGLE LOGIN
function login(){

  let provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithRedirect(provider);

}

firebase.auth().getRedirectResult()
.catch((error) => {
  console.log(error);
});

// 🚪 LOGOUT
function logout(){

  firebase.auth().signOut()
  .then(()=>{
    alert("Logged out ✅");
  });

}

firebase.auth().onAuthStateChanged(user => {

  let loginPage = document.getElementById("loginPage");
  let app = document.getElementById("app");
  let withdrawPage = document.getElementById("withdrawPage");
  let profilePage = document.getElementById("profilePage");

  

    if(user){

    console.log("USER LOGIN SUCCESS");

    let loginPage = document.getElementById("loginPage");
    let app = document.getElementById("app");

    if(loginPage){
      loginPage.style.display = "none";
    }

    if(app){
      app.style.display = "block";
    }


    // 💸 WITHDRAW HISTORY
if(document.getElementById("withdrawHistory")){

  db.collection("withdraw")
  .where("user","==", user.email)
  .onSnapshot(snap => {

    let html = "";

    snap.forEach(doc => {

      let w = doc.data();

      html += `
        <div class="tour-card">
          ₹${w.amount} - ${w.status}
        </div>
      `;

    });

    document.getElementById("withdrawHistory").innerHTML = html;

  });

}

  
    loadTournaments();

    setText("userEmail", user.email);

    let name = localStorage.getItem("name") || "Player";
    setText("userName", name);

    let avatar = document.getElementById("avatar");

    if(avatar){
      avatar.innerText = name.charAt(0).toUpperCase();
    }

  } else {

    if(loginPage) loginPage.style.display="block";
    if(app) app.style.display="none";
    if(withdrawPage) withdrawPage.style.display="none";
    if(profilePage) profilePage.style.display="none";

  }

});

  

// 📦 LOAD TOURNAMENTS
function loadTournaments(){
  
let user = firebase.auth().currentUser;
if(!user || !user.email) return;

db.collection("tournaments").onSnapshot(async snap=>{
let html = "";

for(const doc of snap.docs){
let t = doc.data();

let btn = "JOIN";  

let q = await db.collection("joins")  
  .where("user","==",user.email)  
  .where("tournament","==",doc.id)  
  .get();  

if(!q.empty){  
  let status = q.docs[0].data().status;  

  if(status=="pending") btn="PENDING ⏳";  
  if(status=="joined") btn="JOINED ✅";  
  if(status=="rejected") btn="REJECTED ❌";  
}  

// ✅ HTML BUILD  
html += `  
<div class="tour-card">  
  <img src="${t.img}" width="100%">  

  <h3>${t.name}</h3>  

  <p>${t.type} | ${t.map}</p>  

  <p>Entry: ₹${t.entry}</p>  
  <p>Prize: ₹${t.prize}</p>  
  <p>Per Kill: ₹${t.perKill}</p>  
  <p>Time: ${t.time || ""}</p>  

  <button onclick="openTour('${doc.id}')">${btn}</button>  
</div>  
`;

}

// 🔥 IMPORTANT: loop ke bahar
let box = document.getElementById("tournaments");

if(box){
  box.innerHTML = html;
}

});

}




// ✅ APPROVE
function approve(id){
db.collection("joins").doc(id).update({ status:"joined" });
}

// ❌ REJECT
function reject(id){
db.collection("joins").doc(id).update({ status:"rejected" });
}

// 🗑 DELETE JOIN
function deleteJoin(id){
db.collection("joins").doc(id).delete();
}

// 🎮 ADD ROOM
function addRoom(){
let id = document.getElementById("tId").value;

if(!id){
alert("Select Tournament ❌");
return;
}

db.collection("tournaments").doc(id).update({
roomId: document.getElementById("roomId").value,
roomPass: document.getElementById("roomPass").value
});

alert("Room Added ✅");
}

function addTournament(){

  let name = document.getElementById("name").value;
  let img = document.getElementById("img").value;
  let type = document.getElementById("type").value;
  let version = document.getElementById("version").value;
  let map = document.getElementById("map").value;

  if(!name || !img || !type || !version || !map){
    alert("Fill all fields ❌");
    return;
  }

  db.collection("tournaments").add({
    name,
    img,
    type,
    version,
    map,
    entry: document.getElementById("entry").value,
    prize: document.getElementById("prize").value,
    perKill: document.getElementById("perkill").value,
    maxPlayers: parseInt(document.getElementById("max").value),
    roomId: "",
    roomPass: "",
    time: document.getElementById("time").value
  }).then(()=>{
    alert("Tournament Added ✅");
  });

}  

// 🎯 RESULT ADMIN

function loadResultAdmin(){

db.collection("joins")
.where("status","==","joined")
.onSnapshot(snap => {

  let html = "";

  snap.forEach(doc => {
    let j = doc.data();

    html += `
    <div class="tour-card">
      <b>${j.user}</b><br>

      Kill: <input id="k_${doc.id}" placeholder="0">
      Code: <input id="c_${doc.id}" placeholder="1234">

      <button onclick="saveResult('${doc.id}')">Save</button>
    </div>
    `;
  });

  let el = document.getElementById("resultAdmin");
  if(el){
    el.innerHTML = html;
  }

});

}

function saveResult(id){

let killEl = document.getElementById("k_"+id);
let codeEl = document.getElementById("c_"+id);

if(!killEl || !codeEl){
  alert("Input missing ❌");
  return;
}

let kills = killEl.value;
let code = codeEl.value;

db.collection("joins").doc(id).update({
  kills: kills,
  code: code
});

alert("Result Saved ✅");
}


function loadPlayersByTournament(){

let tId = document.getElementById("tournamentSelect").value;

if(!tId){
document.getElementById("resultsList").innerHTML = "";
return;
}

db.collection("joins")
.where("tournament","==",tId)
.where("status","==","joined")
.onSnapshot(snap=>{

let html = "";  

snap.forEach(doc=>{  
  let j = doc.data();  

  html += `  
  <div class="tour-card">  

    <b>👤 ${j.user}</b><br>  

    🎮 FF Name: ${j.ffname || "N/A"}<br>  
    🆔 FF ID: ${j.ffid || "N/A"}<br><br>  

    🔫 Kill:<br>  
    <input id="k_${doc.id}" placeholder="Enter kills"   
    style="width:100%; padding:8px;"><br><br>  

    🆔 Match ID:<br>  
    <input id="c_${doc.id}" placeholder="Enter match ID"   
    style="width:100%; padding:8px;"><br><br>  

    <button onclick="saveResult('${doc.id}')">  
    Save Result ✅  
    </button>  

  </div>  
  `;  
});  

document.getElementById("playersList").innerHTML = html;

});

}


async function submitResult(){

let user = firebase.auth().currentUser;

let killFile = document.getElementById("killImg").files[0];
let qrFile = document.getElementById("qrImg").files[0];
let matchId = document.getElementById("matchId").value;

if(!killFile || !qrFile || !matchId){
alert("Fill all fields ❌");
return;
}

let killUrl = await uploadImage(killFile);
let qrUrl = await uploadImage(qrFile);

await db.collection("results").add({
user: user.email,
killImg: killUrl,
qrImg: qrUrl,
matchId: matchId,
status: "pending",
time: Date.now()
});

alert("Result Submitted ✅");
}


function updateResult(id,status){
db.collection("results").doc(id).update({status});
}

function deleteResult(id){
db.collection("results").doc(id).delete();
}



function updateWithdraw(id,status){
db.collection("withdraw").doc(id).update({status});
}

function deleteWithdraw(id){
db.collection("withdraw").doc(id).delete();
}

function goHome(){
window.location.href = "index.html";
}

function goWithdraw(){
window.location.href = "withdraw.html";
}

function goProfile(){
window.location.href = "profile.html";
}

function openTour(id){
  window.location.href = "tournament.html?id=" + id;
}


// 👤 NAME CHANGE
function openEditName(){
let newName = prompt("Enter your name");

if(newName && newName.trim() !== ""){
localStorage.setItem("name", newName.trim());

setText("userName", newName.trim());

let firstLetter = newName.trim().charAt(0).toUpperCase();  
setText("avatar", firstLetter);

}
}

// 📜 RULES BUTTON
function openRules(){
alert(`
📜 RULES:

1. Fake screenshot = ban ❌


2. Payment proof must be clear ✅


3. No abuse ❌


4. Admin decision final ✅
`);
}
function openEditPage(){
window.location.href = "editProfile.html";
}



function openRulesPage(){
window.location.href = "rules.html";
}

function goBack(){
window.history.back();
}

function openResults(){
window.location.href = "results.html";
}

// 🎮 LOAD TOURNAMENTS
if(document.getElementById("tournamentSelect")){
  db.collection("tournaments").onSnapshot(snap => {

    let html = `<option value="">Select Tournament</option>`;

    snap.forEach(doc => {
      let t = doc.data();
      html += `<option value="${doc.id}">${t.name}</option>`;
    });

    document.getElementById("tournamentSelect").innerHTML = html;

  });
}

function goAdminHome(){
window.location.href = "admin.html";
}


function openAdminJoins(){
window.location.href = "admin-joins.html";
}

function openAdminWithdraw(){
window.location.href = "admin-withdraw.html";
}

async function Withdraw(){

alert("Clicked ✅");

let user = firebase.auth().currentUser;

if(!user){
alert("Login required ❌");
return;
}

let amount = document.getElementById("amount").value;
let killFile = document.getElementById("killImgW").files[0];
let qrFile = document.getElementById("qrImgW").files[0];
let matchId = document.getElementById("matchIdW").value;

if(!amount || !matchId){
alert("Fill required fields ❌");
return;
}

if(!killFile || !qrFile){
alert("Upload screenshots ❌");
return;
}

try{

let killUrl = await uploadImage(killFile);  
let qrUrl = await uploadImage(qrFile);  

if(!killUrl || !qrUrl){  
  alert("Image upload failed ❌");  
  return;  
}  

await db.collection("withdraw").add({  
  user: user.email,  
  amount: Number(amount),  
  killImg: killUrl,  
  qrImg: qrUrl,  
  matchId: matchId,  
  status: "pending",  
  time: Date.now()  
});  

alert("Withdraw Request Sent ✅");

}catch(e){
console.log(e);
alert("Error ❌");
}
}

// 🚀 REQUEST JOIN FUNCTION
async function sendRequest(id){

  let user = firebase.auth().currentUser;

  if(!user) return alert("Login required");

  let file = document.getElementById("paymentImg").files[0];
  let ffname = document.getElementById("ffname").value;
  let ffid = document.getElementById("ffid").value;

  if(!file || !ffname || !ffid){
    return alert("Fill all fields ❌");
  }

  let docId = user.email + "_" + id;

  let existing = await db.collection("joins").doc(docId).get();

  if(existing.exists){
    return alert("Already Requested ❌");
  }

  let url = await uploadImage(file);
  
  if(!url){
  alert("Image upload failed ❌");
  return;
}

  await db.collection("joins").doc(docId).set({
    tournament: id,
    user: user.email,
    ffname,
    ffid,
    paymentImg: url,
    status: "pending",
    time: Date.now()
  });

  alert("Request Sent ✅");
}

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("reqBtn");

  if(!btn) return;

  btn.onclick = async () => {

    if(!currentId){
      alert("Tournament not loaded ❌");
      return;
    }

    let user = firebase.auth().currentUser;

    if(!user){
      alert("Login required ❌");
      return;
    }

    let file = document.getElementById("paymentImg").files[0];
    let ffname = document.getElementById("ffname").value;
    let ffid = document.getElementById("ffid").value;

    if(!file || !ffname || !ffid){
      alert("Fill all fields ❌");
      return;
    }

    let url = await uploadImage(file);

    if(!url){
      alert("Upload failed ❌");
      return;
    }

    let docId = user.email + "_" + currentId;

    let existing = await db.collection("joins").doc(docId).get();

    if(existing.exists){
      alert("Already Requested ❌");
      return;
    }

    await db.collection("joins").doc(docId).set({
      tournament: currentId,
      user: user.email,
      ffname,
      ffid,
      paymentImg: url,
      status: "pending",
      time: Date.now()
    });

    alert("Request Sent ✅");

  };

});
