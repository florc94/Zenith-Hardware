import dotenv from 'dotenv';

import app from './app';
import { pool } from './config/db';
import { startOrderAutoAdvanceJob } from './services/order-auto-advance.service';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// ===============================
// SERVIDOR
// ===============================

app.listen(PORT, HOST, async () => {
  console.log(
    `🚀 Servidor corriendo en http://${HOST}:${PORT}`
  );

  try {
    const res = await pool.query('SELECT NOW()');

    console.log(
      '✅ Base de datos conectada exitosamente:',
      res.rows[0].now
    );

  } catch (error) {
    console.error(
      '❌ Error conectando a la base de datos:',
      error
    );
  }

  startOrderAutoAdvanceJob();
});