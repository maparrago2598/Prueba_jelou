const axios = require('axios');

module.exports.createAndConfirm = async (event) => {
  const body = JSON.parse(event.body);
  const { customer_id, items, idempotency_key } = body;

  try {
    // 1. Validar Cliente (Customers API)
    const customer = await axios.get(`http://localhost:3001/customers/internal/${customer_id}`, {
      headers: { Authorization: `Bearer internal-token-123` }
    });

    // 2. Crear Orden (Orders API)
    const order = await axios.post('http://localhost:3002/orders', { customer_id, items });

    // 3. Confirmar Orden con Idempotencia
    const confirmed = await axios.post(`http://localhost:3002/orders/${order.data.id}/confirm`, {}, {
      headers: { 'X-Idempotency-Key': idempotency_key }
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: { customer: customer.data, order: { ...confirmed.data, items } }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};