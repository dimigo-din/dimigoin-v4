import { Client } from "pg";

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    await client.connect();
    await client.query("SET session_replication_role = 'replica';");

    const { rows } = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );

    for (const row of rows) {
      await client.query(`TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE;`);
    }

    await client.query("SET session_replication_role = 'origin';");
  } finally {
    await client.end();
  }
})();
