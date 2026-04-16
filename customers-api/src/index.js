const express = require('express');
require('dotenv').config();

const customersRoutes = require('./routes/customers');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Rutas
app.use('/customers', customersRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Customers API running on port ${PORT}`);
});