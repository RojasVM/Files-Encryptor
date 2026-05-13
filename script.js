let mode = "enc";

let tEnc = document.getElementById("t-enc");
let tDec = document.getElementById("t-dec");
let go = document.getElementById("go");
let fileInput = document.getElementById("file");
let pwInput = document.getElementById("pw");
let msg = document.getElementById("status");

tEnc.onclick = function() {
  mode = "enc";
  tEnc.classList.add("on");
  tDec.classList.remove("on");
  go.textContent = "Encrypt";
}

tDec.onclick = function() {
  mode = "dec";
  tDec.classList.add("on");
  tEnc.classList.remove("on");
  go.textContent = "Decrypt";
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

  // pack salt + iv + cif into one blob
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
  msg.classList.remove("err");

  let file = fileInput.files[0];
  let pw = pwInput.value;

  if (!file) {
    msg.textContent = "File missing";
    msg.classList.add("err");
    return;
  }
  if (pw.length < 8) {
    msg.textContent = "Password too short";
    msg.classList.add("err");
    return;
  }

  if (mode == "enc") {
    msg.textContent = "encrypting...";
    let blob = await encrypt(file, pw);
    download(blob, file.name + ".enc");
    msg.textContent = "done";
  } else {
    msg.textContent = "decrypting...";
    try {
      let blob = await decrypt(file, pw);
      let name = file.name.replace(".enc", "");
      if (name == file.name) name = "out-" + name;
      download(blob, name);
      msg.textContent = "done";
    } catch(e) {
      msg.textContent = "failed, wrong password or corrupt file";
      msg.classList.add("err");
    }
  }
}
