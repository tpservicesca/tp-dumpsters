const mysql = require("mysql2/promise");
const fs = require("fs");

const dbConfig = {
  host: "localhost",
  user: "u781187371_tp_dumpsters",
  password: "Cantaritos1.",
  database: "u781187371_tp_dumpsters",
};

async function createTables() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database...");

    const sql = fs.readFileSync("./sql/create_chat_tables.sql", "utf8");
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log("Executed:", statement.substring(0, 50) + "...");
      }
    }

    await connection.end();
    console.log("✅ Chat tables created successfully!");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createTables();
