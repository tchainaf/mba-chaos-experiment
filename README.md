
# Engenharia do Caos com Chaos Toolkit, Node.js e Redis

Experimento Engenharia do Chaos com Chaos Toolkit [Chaos Toolkit](https://chaostoolkit.org/) com uma aplicação Node.js que utiliza Redis.

---

## Pré-reqs
- Docker instalado
- Python 3.8+ e pip
- Node.js e npm

---

## Install Docker

### Ubuntu:
```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```
> Reinicie a sessão após adicionar seu usuário ao grupo docker.

### macOS/Windows:
Baixe e instale o [Docker Desktop](https://www.docker.com/products/docker-desktop).

---

## Install Python e Chaos Toolkit

### Ubuntu/macOS:
```bash
sudo apt install python3 python3-pip -y
pip3 install -U chaostoolkit
```

Verifique a instalação:
```bash
chaos --version
```

---

## Subindo o Redis com Docker

```bash
docker run -d --name redis -p 6379:6379 redis
```

---

##  Criar app Node.js com Redis

### 1. Instalar Node.js e npm

#### Ubuntu:
```bash
sudo apt install nodejs npm -y
```

#### macOS:
```bash
brew install node
```

---

### 2. Criar o projeto

```bash
mkdir node-redis-app
cd node-redis-app
npm init -y
npm install express redis
```

### 3. Criar o arquivo `index.js`

```js
const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = 3000;

const redisClient = createClient({ url: 'redis://localhost:6379' });

redisClient.on('error', (err) => {
  console.error('Erro no Redis:', err);
});

redisClient.connect().then(() => {
  console.log('Conectado ao Redis');
}).catch(console.error);

app.get('/health', async (req, res) => {
  try {
    await redisClient.set('ping', 'pong');
    const value = await redisClient.get('ping');
    res.status(200).json({ status: 'ok', redis: value });
  } catch (err) {
    console.error('Erro no health check:', err);
    res.status(500).json({ status: 'erro', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`App rodando em http://localhost:${port}`);
});
```

### 4. Rodar a aplicação

```bash
node index.js
```

Acesse: [http://localhost:3000/health](http://localhost:3000/health)

---

## Criando o experimento com Chaos Toolkit

### 1. Criar o arquivo de experimento

```bash
chaos init experiment redis-failure
```

### 2. Substituir o conteúdo do `redis-failure.json`:

```json
{
  "version": "1.0.0",
  "title": "Teste simples de falha no Redis",
  "description": "Simula indisponibilidade do Redis e observa se o sistema continua funcional.",
  "tags": ["redis", "chaos", "docker"],
  "steady-state-hypothesis": {
    "title": "Aplicação está saudável",
    "probes": [
      {
        "type": "probe",
        "name": "verifica_servico_aplicacao",
        "tolerance": 200,
        "provider": {
          "type": "http",
          "timeout": 3,
          "url": "http://localhost:3000/health",
          "method": "GET"
        }
      }
    ]
  },
  "method": [
    {
      "type": "action",
      "name": "parar_container_redis",
      "provider": {
        "type": "process",
        "path": "docker",
        "arguments": "stop redis"
      }
    },
    {
      "type": "probe",
      "name": "verifica_servico_aplicacao_apos_falha",
      "tolerance": 200,
      "provider": {
        "type": "http",
        "timeout": 3,
        "url": "http://localhost:3000/health",
        "method": "GET"
      }
    },
    {
      "type": "action",
      "name": "iniciar_container_redis",
      "provider": {
        "type": "process",
        "path": "docker",
        "arguments": "start redis"
      }
    }
  ],
  "rollbacks": []
}
```

---

## Rodando o experimento

```bash
chaos run redis-failure.json
```

---

## Resultado esperado

O Chaos Toolkit irá:

1. Verificar se a aplicação responde (`/health`)
2. Parar o container Redis
3. Verificar novamente a saúde da aplicação
4. Religar o Redis

---

