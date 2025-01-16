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
    messages: { id: string; username: string; message: string }[];
    images: { id: string; username: string; image: string }[];  // Adicionando imagens à sala
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
        this.rooms = [];
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

                const newRoom: Room = { name, isPrivate, password: isPrivate ? password : undefined, messages: [], images: [] };  // Adicionando imagens à sala
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
                this.io.to(room).emit('message', { id: this.generateMessageId(), username: 'System', message: `${username} has joined the room!` });
                socket.emit('joinedRoom', roomObj);
            });

            socket.on('joinPrivateRoom', ({ room, password }) => {
                const roomObj = this.rooms.find(r => r.name === room);
                if (roomObj && roomObj.isPrivate) {
                    if (roomObj.password === password) {
                        socket.username = socket.username || 'Unknown User';
                        socket.join(room);
                        this.io.to(room).emit('message', { id: this.generateMessageId(), username: 'System', message: `${socket.username} has joined the private room!` });
                        socket.emit('joinedRoom', roomObj);
                    } else {
                        socket.emit('error', 'Incorrect password');
                    }
                } else {
                    socket.emit('error', 'Room does not exist or is not private');
                }
            });

            socket.on('message', (data) => {
                const roomObj = this.rooms.find(r => r.name === data.room);
                if (roomObj) {
                    const message = { id: this.generateMessageId(), username: data.username, message: data.message };
                    roomObj.messages.push(message);
                    this.io.to(data.room).emit('message', { ...message, room: data.room });
                }
            });

            socket.on('image', (data) => {
                const roomObj = this.rooms.find(r => r.name === data.room);
                if (roomObj) {
                    const image = { id: this.generateMessageId(), username: data.username, image: data.image };
                    roomObj.images.push(image);  // Armazenando a imagem na sala
                    this.io.to(data.room).emit('image', { ...image, room: data.room });
                }
            });

            socket.on('editMessage', ({ roomId, messageId, newMessage }) => {
                const roomObj = this.rooms.find(r => r.name === roomId);
                if (roomObj) {
                    const messageObj = roomObj.messages.find(m => m.id === messageId);
                    if (messageObj && messageObj.username === socket.username) {
                        messageObj.message = newMessage;
                        this.io.to(roomId).emit('messageEdited', { messageId, newMessage });
                    }
                }
            });

            socket.on('deleteMessage', ({ roomId, messageId }) => {
                const roomObj = this.rooms.find(r => r.name === roomId);
                if (roomObj) {
                    roomObj.messages = roomObj.messages.filter(m => m.id !== messageId);
                    this.io.to(roomId).emit('messageDeleted', { messageId });
                }
            });

            socket.on('deleteRoom', (roomId) => {
                this.rooms = this.rooms.filter(r => r.name !== roomId);
                this.io.emit('roomsList', this.rooms);
                this.io.to(roomId).emit('roomDeleted');
            });

            socket.on('disconnect', () => {
                console.log(`${socket.username || socket.id} disconnected`);
            });
        });
    }

    setupRoutes() {
        this.app.use(express.static(path.join(__dirname, '..', 'public')));
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });
    }

    private generateMessageId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

const app = new App();
app.listenServer();
