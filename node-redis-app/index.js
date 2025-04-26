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
