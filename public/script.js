var socket = io();
const loginScreen = document.getElementById('login');
const roomsScreen = document.getElementById('roomsScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const nameInput = document.getElementById('name');
const roomList = document.getElementById('roomList');
const privateRoomPasswordSection = document.getElementById('privateRoomPasswordSection');
const privateRoomPasswordInput = document.getElementById('privateRoomPassword');
const joinPrivateRoomButton = document.getElementById('joinPrivateRoom');
const createRoomButton = document.getElementById('createRoomButton');
const messagesList = document.getElementById('messages');
const input = document.getElementById('input');
const leaveButton = document.getElementById('leaveButton');
const sendButton = document.getElementById('sendButton');
const backButton = document.getElementById('backButton');
let username;
let currentRoom = null;
let isPrivateRoom = false;

// Tela de Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    username = nameInput.value.trim();
    if (username) {
        loginScreen.style.display = 'none';
        roomsScreen.style.display = 'block';
        socket.emit('getRooms');
    }
});

// Mostrar as salas disponíveis
socket.on('roomsList', (rooms) => {
    roomList.innerHTML = '';
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.textContent = room.name;
        li.onclick = () => joinRoom(room);
        roomList.appendChild(li);
    });
});

// Entrar em uma sala
function joinRoom(room) {
    currentRoom = room.name;
    if (room.isPrivate) {
        isPrivateRoom = true;
        privateRoomPasswordSection.style.display = 'block';
        joinPrivateRoomButton.onclick = () => {
            const password = privateRoomPasswordInput.value.trim();
            socket.emit('joinPrivateRoom', { room: room.name, password });
        };
    } else {
        socket.emit('joinRoom', { username, room: room.name });
        roomsScreen.style.display = 'none';
        chatScreen.style.display = 'block';
    }
}

// Erro de sala privada
socket.on('error', (message) => {
    alert(message);
});

// Entrou na sala privada
socket.on('joinedRoom', (room) => {
    roomsScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    currentRoom = room.name;
    privateRoomPasswordSection.style.display = 'none';
});

// Criar sala
createRoomButton.addEventListener('click', () => {
    const roomName = prompt("Insira o nome da sala:");
    const isPrivate = confirm("Essa sala é privada?");
    const password = isPrivate ? prompt("Insira uma senha para a sala:") : null;
    socket.emit('createRoom', { name: roomName, isPrivate, password });
});

// Enviar mensagem
document.getElementById('form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit('message', { username, room: currentRoom, message: input.value });
        input.value = '';
    }
});

// Receber mensagem
socket.on('message', (data) => {
    if (data.room === currentRoom) {
        const li = document.createElement('li');
        const userSpan = document.createElement('span');
        const messageSpan = document.createElement('span');
        const strongTag = document.createElement('strong');

        strongTag.textContent = data.username;
        strongTag.style.color = getUserColor(data.username);
        userSpan.appendChild(strongTag);
        userSpan.style.marginRight = '10px';

        messageSpan.textContent = data.message;

        li.appendChild(userSpan);
        li.appendChild(messageSpan);
        li.classList.add(data.username === username ? 'my-message' : 'other-message');
        messagesList.appendChild(li);
    }
});

function getUserColor(username) {
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
}

// Sair da sala
leaveButton.addEventListener('click', () => {
    socket.emit('leaveRoom', { username, room: currentRoom });
    chatScreen.style.display = 'none';
    roomsScreen.style.display = 'block';
    messagesList.innerHTML = '';
});

// Voltar para a tela de login
backButton.addEventListener('click', () => {
    roomsScreen.style.display = 'none';
    loginScreen.style.display = 'block';
    roomList.innerHTML = '';  // Limpa a lista de salas
});
