import mysql from "mysql2/promise";

export const dbConfig = {
  host: "localhost",
  user: "u781187371_tp_dumpsters",
  password: "Cantaritos1.",
  database: "u781187371_tp_dumpsters",
};

export async function getConnection() {
  return mysql.createConnection(dbConfig);
}
