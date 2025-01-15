import express, { Application } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

// Extensão da interface Socket para adicionar a propriedade username
interface CustomSocket extends Socket {
    username?: string;
}

interface Room {
    name: string;
    isPrivate: boolean;
    password?: string;
}

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;
    private rooms: Room[];

    constructor() {
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http);
        this.rooms = []; // Inicializar a lista de salas
        this.listenSocket();
        this.setupRoutes();
    }

    listenServer() {
        this.http.listen(3000, () => console.log('Server is running on http://localhost:3000'));
    }

    listenSocket() {
        this.io.on('connection', (socket: CustomSocket) => {
            console.log('User connected =>', socket.id);

            socket.on('getRooms', () => {
                socket.emit('roomsList', this.rooms);
            });

            socket.on('createRoom', ({ name, isPrivate, password }) => {
                const roomExists = this.rooms.find((room) => room.name === name);
                if (roomExists) {
                    socket.emit('error', 'Room already exists');
                    return;
                }

                const newRoom: Room = { name, isPrivate, password: isPrivate ? password : undefined };
                this.rooms.push(newRoom);
                this.io.emit('roomsList', this.rooms);
                socket.emit('roomCreated', newRoom);
            });

            socket.on('joinRoom', ({ username, room }) => {
                const roomObj = this.rooms.find(r => r.name === room);
                if (!roomObj) {
                    socket.emit('error', 'Room does not exist');
                    return;
                }

                socket.username = username;
                socket.join(room);
                this.io.to(room).emit('message', { username: 'System', message: `${username} has joined the room!` });
                socket.emit('joinedRoom', roomObj);
            });

            socket.on('joinPrivateRoom', ({ room, password }) => {
                const roomObj = this.rooms.find(r => r.name === room);
                if (roomObj && roomObj.isPrivate) {
                    if (roomObj.password === password) {
                        socket.username = socket.username || 'Unknown User';
                        socket.join(room);
                        this.io.to(room).emit('message', { username: 'System', message: `${socket.username} has joined the private room!` });
                        socket.emit('joinedRoom', roomObj);
                    } else {
                        socket.emit('error', 'Incorrect password');
                    }
                } else {
                    socket.emit('error', 'Room does not exist or is not private');
                }
            });

            socket.on('message', (data) => {
                this.io.to(data.room).emit('message', {
                    username: data.username,
                    message: data.message,
                    room: data.room
                });
            });

            socket.on('image', (data) => {
                this.io.to(data.room).emit('image', {
                    username: data.username,
                    image: data.image,
                    room: data.room
                });
            });

            socket.on('disconnect', () => {
                console.log(`${socket.username || socket.id} disconnected`);
            });
        });
    }

    setupRoutes() {
        // Servindo arquivos estáticos (CSS, JS) da pasta 'public' que está na raiz do projeto
        this.app.use(express.static(path.join(__dirname, '..', 'public')));  // Aqui apontamos para a pasta 'public' na raiz
    
        // Rota para servir o index.html
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));  // Aqui também usamos o caminho correto para 'public'
        });
    }
}

const app = new App();
app.listenServer();
