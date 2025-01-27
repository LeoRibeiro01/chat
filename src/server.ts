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
    images: { id: string; username: string; image: string }[]; // Adicionando imagens à sala
}

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;
    private rooms: Room[];

    constructor() {
        // Inicialização do express, http e socket.io
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http);
        this.rooms = [];  // Lista de salas
        this.listenSocket(); // Configura o servidor de WebSocket
        this.setupRoutes();  // Configura as rotas da aplicação
    }

    // Inicia o servidor HTTP na porta 3000
    listenServer() {
        this.http.listen(3000, () => console.log('Server is running on http://localhost:3000'));
    }

    // Configura os eventos de WebSocket
    listenSocket() {
        this.io.on('connection', (socket: CustomSocket) => {
            console.log('User connected =>', socket.id);

            // Enviar lista de salas quando o cliente solicitar
            socket.on('getRooms', () => {
                socket.emit('roomsList', this.rooms);
            });

            // Criar uma nova sala
            socket.on('createRoom', ({ name, isPrivate, password }) => {
                const roomExists = this.rooms.find((room) => room.name === name);
                if (roomExists) {
                    socket.emit('error', 'Room already exists');
                    return;
                }

                const newRoom: Room = { 
                    name, 
                    isPrivate, 
                    password: isPrivate ? password : undefined, 
                    messages: [], 
                    images: [] 
                };
                this.rooms.push(newRoom);
                this.io.emit('roomsList', this.rooms);  // Atualiza a lista de salas para todos os clientes
                socket.emit('roomCreated', newRoom);  // Envia a sala criada para o usuário
            });

            // Entrar em uma sala
            socket.on('joinRoom', ({ username, room }) => {
                const roomObj = this.rooms.find(r => r.name === room);
                if (!roomObj) {
                    socket.emit('error', 'Room does not exist');
                    return;
                }

                socket.username = username;
                socket.join(room);
                this.io.to(room).emit('message', { id: this.generateMessageId(), username: 'System', message: `${username} has joined the room!` });
                socket.emit('joinedRoom', roomObj);  // Envia as informações da sala para o usuário
            });

            // Entrar em uma sala privada
            socket.on('joinPrivateRoom', ({ room, password }) => {
                const roomObj = this.rooms.find(r => r.name === room);
                if (roomObj && roomObj.isPrivate) {
                    if (roomObj.password === password) {
                        socket.username = socket.username || 'Unknown User';
                        socket.join(room);
                        this.io.to(room).emit('message', { id: this.generateMessageId(), username: 'System', message: `${socket.username} has joined the private room!` });
                        socket.emit('joinedRoom', roomObj);
                    } else {
                        socket.emit('error', ' Senha Errada!');
                    }
                } else {
                    socket.emit('error', 'Room does not exist or is not private');
                }
            });

            // Enviar uma mensagem para a sala
            socket.on('message', (data) => {
                const roomObj = this.rooms.find(r => r.name === data.room);
                if (roomObj) {
                    const message = { id: this.generateMessageId(), username: data.username, message: data.message };
                    roomObj.messages.push(message);  // Adiciona a mensagem à sala
                    this.io.to(data.room).emit('message', { ...message, room: data.room });  // Envia a mensagem para todos na sala
                }
            });

            // Enviar uma imagem para a sala
            socket.on('image', (data) => {
                const roomObj = this.rooms.find(r => r.name === data.room);
                if (roomObj) {
                    const image = { id: this.generateMessageId(), username: data.username, image: data.image };
                    roomObj.images.push(image);  // Adiciona a imagem à sala
                    this.io.to(data.room).emit('image', { ...image, room: data.room });  // Envia a imagem para todos na sala
                }
            });

            // Editar mensagem em uma sala
            socket.on('editMessage', ({ roomId, messageId, newMessage }) => {
                const roomObj = this.rooms.find(r => r.name === roomId);
                if (roomObj) {
                    const messageObj = roomObj.messages.find(m => m.id === messageId);
                    if (messageObj && messageObj.username === socket.username) {
                        messageObj.message = newMessage;  // Atualiza a mensagem
                        this.io.to(roomId).emit('messageEdited', { messageId, newMessage });  // Notifica todos sobre a edição
                    }
                }
            });

            // Excluir mensagem de uma sala
            socket.on('deleteMessage', ({ roomId, messageId }) => {
                const roomObj = this.rooms.find(r => r.name === roomId);
                if (roomObj) {
                    roomObj.messages = roomObj.messages.filter(m => m.id !== messageId);  // Remove a mensagem da sala
                    this.io.to(roomId).emit('messageDeleted', { messageId });  // Notifica todos sobre a exclusão
                }
            });

            // Excluir uma sala
            socket.on('deleteRoom', (roomId) => {
                this.rooms = this.rooms.filter(r => r.name !== roomId);  // Remove a sala
                this.io.emit('roomsList', this.rooms);  // Atualiza a lista de salas para todos
                this.io.to(roomId).emit('roomDeleted');  // Notifica todos sobre a exclusão da sala
            });

            // Desconectar o usuário
            socket.on('disconnect', () => {
                console.log(`${socket.username || socket.id} disconnected`);
            });
        });
    }

    // Configura as rotas da aplicação
    setupRoutes() {
        this.app.use(express.static(path.join(__dirname, '..', 'public')));  // Serve arquivos estáticos
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));  // Serve o arquivo principal da aplicação
        });
    }

    // Função auxiliar para gerar IDs únicos para mensagens
    private generateMessageId(): string {
        return Math.random().toString(36).substr(2, 9);  // Gera um ID único baseado em números aleatórios
    }
}

// Inicializa e executa a aplicação
const app = new App();
app.listenServer();
