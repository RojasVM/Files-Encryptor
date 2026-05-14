let mode = "enc";

let tEnc = document.getElementById("t-enc");
let tDec = document.getElementById("t-dec");
let go = document.getElementById("go");
let fileInput = document.getElementById("file");
let pwInput = document.getElementById("pw");
let msg = document.getElementById("status");
let clearBtn = document.getElementById("clear");

function reset() {
  fileInput.value = "";
  pwInput.value = "";
  clearBtn.classList.add("hidden");
  setMsg("", false);
}

tEnc.onclick = function() {
  mode = "enc";
  tEnc.classList.add("on");
  tDec.classList.remove("on");
  go.textContent = "Encrypt";
  reset();
}

tDec.onclick = function() {
  mode = "dec";
  tDec.classList.add("on");
  tEnc.classList.remove("on");
  go.textContent = "Decrypt";
  reset();
}


// show/hide clear button when a file is picked
fileInput.onchange = function() {
  if (fileInput.files[0]) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
}

clearBtn.onclick = function() {
  fileInput.value = "";
  clearBtn.classList.add("hidden");
}


// Theme
let theme = document.getElementById("theme");
theme.onclick = function() {
  if (document.body.classList.contains("light")) {
    document.body.classList.remove("light");
    theme.textContent = "☾";
  } else {
    document.body.classList.add("light");
    theme.textContent = "☀";
  }
}


// status helpers
let fadeTimer;
function setMsg(text, isError) {
  clearTimeout(fadeTimer);
  msg.textContent = text;
  msg.classList.remove("fade");
  if (isError) {
    msg.classList.add("err");
  } else {
    msg.classList.remove("err");
  }
}

function setMsgTemp(text) {
  setMsg(text, false);
  fadeTimer = setTimeout(function() {
    msg.classList.add("fade");
  }, 2500);
}


// Crypto
async function getKey(password, salt) {
  let base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 250000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(file, pw) {
  let salt = crypto.getRandomValues(new Uint8Array(16));
  let iv = crypto.getRandomValues(new Uint8Array(12));
  let key = await getKey(pw, salt);

  let data = await file.arrayBuffer();
  let cif = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, key, data);

  let out = new Uint8Array(16 + 12 + cif.byteLength);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(new Uint8Array(cif), 28);

  return new Blob([out]);
}

async function decrypt(file, pw) {
  let buf = new Uint8Array(await file.arrayBuffer());
  let salt = buf.slice(0, 16);
  let iv = buf.slice(16, 28);
  let cif = buf.slice(28);

  let key = await getKey(pw, salt);
  let plain = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, cif);
  return new Blob([plain]);
}

function download(blob, name) {
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}


go.onclick = async function() {
  let file = fileInput.files[0];
  let pw = pwInput.value;

  if (!file) {
    setMsg("File missing", true);
    return;
  }
  if (pw.length < 8) {
    setMsg("Password too short", true);
    return;
  }

  if (mode == "enc") {
    setMsg("encrypting...", false);
    let blob = await encrypt(file, pw);
    download(blob, file.name + ".enc");
    setMsgTemp("done");
  } else {
    setMsg("decrypting...", false);
    try {
      let blob = await decrypt(file, pw);
      let name = file.name.replace(".enc", "");
      if (name == file.name) name = "out-" + name;
      download(blob, name);
      setMsgTemp("done");
    } catch(e) {
      setMsg("failed, wrong password or corrupt file", true);
    }
  }
}
