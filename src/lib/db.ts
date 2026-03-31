import mysql from "mysql2/promise";

export const dbConfig = {
  host: "127.0.0.1",
  user: "u781187371_cristoferdeita",
  password: "Locomen50.",
  database: "u781187371_DumspterBookin",
};

export async function getConnection() {
  return mysql.createConnection(dbConfig);
}
