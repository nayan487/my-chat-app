const socket = io();
let username = "";

function enterChat() {
    username = document.getElementById("usernameInput").value;
    if (!username.trim()) return alert("Enter a username!");

    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatScreen").classList.remove("hidden");

    socket.emit("joinChat", username);
}

const msgInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");

// Send message
function sendMessage() {
    let msg = msgInput.value;
    if (!msg.trim()) return;

    const data = {
        username,
        message: msg,
        type: "text"
    };

    socket.emit("sendMessage", data);
    msgInput.value = "";
}

// Display message
socket.on("message", (data) => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(data.username === username ? "me" : "other");

    if (data.type === "image") {
        div.innerHTML = `<b>${data.username}</b><br>
                         <img src="${data.url}" width="150"><br>
                         <small>${data.timestamp}</small>`;
    } else {
        div.innerHTML = `<b>${data.username}</b><br>${data.message}<br>
                         <small>${data.timestamp}</small>`;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Online users update
socket.on("updateUsers", (users) => {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    users.forEach(u => {
        let li = document.createElement("li");
        li.textContent = u;
        list.appendChild(li);
    });
});

// Typing events
msgInput.addEventListener("input", () => {
    socket.emit("typing", username);
});

socket.on("typing", (user) => {
    const t = document.getElementById("typingText");
    t.textContent = `${user} is typing...`;
    setTimeout(() => t.textContent = "", 1000);
});
