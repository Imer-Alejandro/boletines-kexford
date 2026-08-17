require('dotenv').config();
const sql = require('mssql');
(async ()=>{
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT||1433),
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    pool: { max: 1, min: 0 }
  };
  try{
    console.log('Trying connect with trustServerCertificate:true');
    const pool = await sql.connect(config);
    console.log('Connected!');
    await pool.close();
  }catch(e){
    console.error('Connect error:', e);
    process.exitCode = 1;
  }
})();
