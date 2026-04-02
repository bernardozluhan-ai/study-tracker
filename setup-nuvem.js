const fs = require('fs');
const { createClient } = require('@libsql/client');

// Lê as chaves do seu arquivo .env
const envText = fs.readFileSync('./.env', 'utf8');
const urlMatch = envText.match(/TURSO_DATABASE_URL=(.*)/);
const tokenMatch = envText.match(/TURSO_AUTH_TOKEN=(.*)/);

const client = createClient({
  url: urlMatch[1].trim().replace(/\r/g, ''),
  authToken: tokenMatch[1].trim().replace(/\r/g, '')
});

// Busca o arquivo de tabelas que o Prisma gerou mais cedo
const sql = fs.readFileSync('./prisma/migrations/20260402120937_init/migration.sql', 'utf8');

async function run() {
  console.log("🚀 Conectando ao Turso e enviando tabelas...");
  try {
    await client.executeMultiple(sql);
    console.log("✅ DEU CERTO! Tabelas criadas com sucesso na nuvem!");
  } catch (e) {
    console.error("❌ Ops, deu erro:", e.message);
  }
}

run();