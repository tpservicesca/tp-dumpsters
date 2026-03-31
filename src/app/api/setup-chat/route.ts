import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "u781187371_tp_dumpsters",
  password: "Cantaritos1.",
  database: "u781187371_tp_dumpsters",
};

const AUTH_KEY = "Cantaritos1.";

export async function GET(request: NextRequest) {
  const auth = request.nextUrl.searchParams.get("auth");

  if (auth !== AUTH_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Create chat_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        role ENUM('user', 'assistant') NOT NULL,
        content TEXT NOT NULL,
        language VARCHAR(5) DEFAULT 'en',
        created_at DATETIME NOT NULL,
        INDEX idx_session (session_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create chat_sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        first_message TEXT,
        last_message TEXT,
        message_count INT DEFAULT 0,
        language VARCHAR(5) DEFAULT 'en',
        status ENUM('active', 'closed', 'archived') DEFAULT 'active',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Chat tables created successfully",
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
