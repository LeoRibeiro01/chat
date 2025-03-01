# BlueTalk Cha

Este é um aplicativo de chat em tempo real utilizando **Express** e **Socket.io**. Ele foi desenvolvido para ser executado em um ambiente de desenvolvimento local. Abaixo estão as etapas para rodar o código em sua máquina.

---

## Pré-requisitos

Certifique-se de ter o **Node.js** e o **Yarn** instalados em sua máquina. Caso não tenha, siga os passos abaixo para instalar:

1. **Instalar Node.js**: 
   - [Node.js Official Website](https://nodejs.org/)

2. **Instalar Yarn**:
   - [Yarn Official Website](https://yarnpkg.com/)

---

## Passos para rodar o projeto

### 1. Inicializando o projeto

Execute o seguinte comando para inicializar um novo projeto Node.js:

npm init -y

Isso criará um arquivo package.json básico.

### 2. Instalar o Yarn
Em seguida, instale o Yarn globalmente em sua máquina:

npm install -g yarn


Ou você pode utilizar o comando abaixo para instalar também globalmente:

npm install --global yarn

### 3. Configurar o PowerShell (caso esteja utilizando Windows)
Se você estiver no Windows e usando PowerShell, pode ser necessário alterar a política de execução de scripts. Para isso, execute o comando abaixo:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Isso permite que você execute scripts no PowerShell.

### 4. Verificar a versão do Yarn
Verifique se o Yarn foi instalado corretamente:

yarn --version


### 5. Instalar dependências de desenvolvimento
Adicione as dependências necessárias para o projeto. Primeiro, adicione o TypeScript:

yarn add typescript -D


Em seguida, adicione o Express e o Socket.io:

yarn add express socket.io

E as tipagens para o Express:

yarn add @types/express -D

Adicione também o TSX para executar arquivos TypeScript diretamente:

yarn add tsx -D


### 6. Rodando o servidor
Após todas as dependências estarem instaladas, execute o servidor com o seguinte comando:

yarn dev

Ou, caso queira usar o npm, você também pode rodar:

npm run dev

Isso irá iniciar o servidor no ambiente de desenvolvimento.



### Códigos Resumidos:
npm init -y

npm install -g yarn

npm install --global yarn

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

yarn --version

yarn add typescript -D

yarn add express socket.io

yarn add @types/express -D

yarn add tsx -D

yarn dev

npm run dev

### Link do Youtube

https://youtu.be/h-cZnldAjvg
