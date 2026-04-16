\# B2B Orders System



Sistema de backoffice para gestión de pedidos B2B compuesto por dos APIs REST y un Lambda orquestador.



\## Arquitectura



\- \*\*Customers API\*\* (puerto 3001) — Gestión de clientes

\- \*\*Orders API\*\* (puerto 3002) — Gestión de productos y órdenes

\- \*\*Lambda Orquestador\*\* (puerto 3000) — Orquesta la creación y confirmación de pedidos

\- \*\*MySQL 8.0\*\* — Base de datos relacional



\## Requisitos previos



\- Node.js v18+

\- MySQL 8.0

\- npm v8+



\## Instalación y levantamiento local



\### 1. Clonar el repositorio



```bash

git clone https://github.com/maparrago2598/Prueba\_jelou.git

cd Prueba\_jelou

```



\### 2. Configurar variables de entorno



Copiar y configurar el `.env` en cada servicio:



\*\*customers-api/.env\*\*

```env

PORT=3001

DB\_HOST=127.0.0.1

DB\_PORT=3306

DB\_USER=root

DB\_PASSWORD=Admin1234

DB\_NAME=b2b\_orders

JWT\_SECRET=supersecret123

SERVICE\_TOKEN=internal-token-123

```



\*\*orders-api/.env\*\*

```env

PORT=3002

DB\_HOST=127.0.0.1

DB\_PORT=3306

DB\_USER=root

DB\_PASSWORD=Admin1234

DB\_NAME=b2b\_orders

JWT\_SECRET=supersecret123

SERVICE\_TOKEN=internal-token-123

CUSTOMERS\_API\_URL=http://localhost:3001

```



\*\*lambda-orchestrator/.env\*\*

```env

CUSTOMERS\_API\_BASE=http://localhost:3001

ORDERS\_API\_BASE=http://localhost:3002

SERVICE\_TOKEN=internal-token-123

JWT\_TOKEN=<generar con comando abajo>

```



Generar JWT\_TOKEN:

```bash

node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({ service: 'lambda' }, 'supersecret123', { expiresIn: '365d' }));"

```



\### 3. Crear la base de datos



Abrir MySQL y ejecutar:

```bash

mysql -u root -p

```

```sql

CREATE DATABASE b2b\_orders;

USE b2b\_orders;

source db/Schema.sql;

source db/seed.sql;

```



\### 4. Instalar dependencias



```bash

cd customers-api \&\& npm install

cd ../orders-api \&\& npm install

cd ../lambda-orchestrator \&\& npm install

```



\### 5. Levantar los servicios



Abrir 3 terminales separadas:



\*\*Terminal 1 — Customers API:\*\*

```bash

cd customers-api

npm run dev

\# Corriendo en http://localhost:3001

```



\*\*Terminal 2 — Orders API:\*\*

```bash

cd orders-api

npm run dev

\# Corriendo en http://localhost:3002

```



\*\*Terminal 3 — Lambda Orquestador:\*\*

```bash

cd lambda-orchestrator

npm run dev

\# Corriendo en http://localhost:3000

```



\### 6. Verificar salud de los servicios



```bash

curl http://localhost:3001/health

curl http://localhost:3002/health

```



\## URLs base



| Servicio | URL |

|---|---|

| Customers API | http://localhost:3001 |

| Orders API | http://localhost:3002 |

| Lambda Orquestador | http://localhost:3000 |



\## Ejemplos cURL



\### Crear cliente

```bash

curl -X POST http://localhost:3001/customers \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -H "Authorization: Bearer <JWT>" \\

&#x20; -d '{"name": "Juan Pérez", "email": "juan@test.com", "phone": "3001234567"}'

```



\### Crear orden

```bash

curl -X POST http://localhost:3002/orders \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -H "Authorization: Bearer <JWT>" \\

&#x20; -d '{"customer\_id": 1, "items": \[{"product\_id": 1, "qty": 2}]}'

```



\### Confirmar orden

```bash

curl -X POST http://localhost:3002/orders/1/confirm \\

&#x20; -H "Authorization: Bearer <JWT>" \\

&#x20; -H "X-Idempotency-Key: key-unica-123"

```



\### Invocar Lambda orquestador (local)

```bash

curl -X POST http://localhost:3000/orchestrator/create-and-confirm-order \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -d '{

&#x20;   "customer\_id": 1,

&#x20;   "items": \[

&#x20;     {"product\_id": 2, "qty": 2},

&#x20;     {"product\_id": 3, "qty": 1}

&#x20;   ],

&#x20;   "idempotency\_key": "orden-001"

&#x20; }'

```



\### Invocar Lambda en AWS

```bash

curl -X POST https://<api-gateway-url>/orchestrator/create-and-confirm-order \\

&#x20; -H "Content-Type: application/json" \\

&#x20; -d '{

&#x20;   "customer\_id": 1,

&#x20;   "items": \[{"product\_id": 2, "qty": 2}],

&#x20;   "idempotency\_key": "orden-aws-001"

&#x20; }'

```



\## Deploy en AWS



```bash

cd lambda-orchestrator

npx serverless deploy

```



Configurar en `serverless.yml` las variables:

\- `CUSTOMERS\_API\_BASE` — URL pública de Customers API

\- `ORDERS\_API\_BASE` — URL pública de Orders API



\## Respuesta exitosa del Lambda



```json

{

&#x20; "success": true,

&#x20; "customer": {

&#x20;   "id": 1,

&#x20;   "name": "Carlos Pérez",

&#x20;   "email": "carlos@empresa.com",

&#x20;   "phone": "3001234567"

&#x20; },

&#x20; "order": {

&#x20;   "success": true,

&#x20;   "message": "Pedido confirmado",

&#x20;   "order\_id": "2"

&#x20; }

}

```

