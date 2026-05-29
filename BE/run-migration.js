import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    // Đọc file migration
    const migrationPath = path.join(process.cwd(), 'migrations', 'add-category-icons.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Tạo connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_finance'
    });

    // Chia SQL thành các câu lệnh riêng biệt
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Thực thi từng câu lệnh
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Categories now have icons!');

    await connection.end();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Chạy migration
runMigration();
