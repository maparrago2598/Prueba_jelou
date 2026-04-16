const express = require('express');
require('dotenv').config();
const orderRoutes = require('./routes/orders'); // Debe coincidir con la carpeta y nombre

const app = express();
app.use(express.json());

app.use('/orders', orderRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Orders API running on port ${PORT}`);
});