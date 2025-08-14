import express from 'express';

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello! Server is working!' });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
