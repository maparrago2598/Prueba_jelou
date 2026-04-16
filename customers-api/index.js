const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(3001, () => {
  console.log('Customers API running on port 3001');
});