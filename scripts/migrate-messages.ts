import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface LegacyMessage {
  role: string;
  content: string;
  isHuman?: boolean;
  timestamp?: string;
}

async function main() {
  console.log("🔄 Migrating SupportSession messages from JSON to ChatMessage model...\n");

  // Check if "messages" column still exists in SupportSession
  const columnCheck = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'SupportSession' AND column_name = 'messages'`
  );

  if (columnCheck.length === 0) {
    console.log("✅ Column 'messages' not found — migration may already be complete or schema already updated.");
    console.log("   If ChatMessage table exists and has data, nothing to do.");
    return;
  }

  // Fetch all sessions with their JSON messages
  const sessions = await prisma.$queryRawUnsafe<Array<{ id: string; messages: string }>>(
    `SELECT id, messages FROM "SupportSession" WHERE messages IS NOT NULL AND messages != '[]'`
  );

  console.log(`Found ${sessions.length} sessions with messages to migrate.`);

  let totalMigrated = 0;
  let errors = 0;

  for (const session of sessions) {
    try {
      let messages: LegacyMessage[] = [];
      try {
        messages = JSON.parse(session.messages);
        if (!Array.isArray(messages)) continue;
      } catch {
        console.warn(`  ⚠ Session ${session.id}: invalid JSON, skipping`);
        errors++;
        continue;
      }

      const validMessages = messages.filter(
        (m) => m && typeof m === "object" && 
               ["user", "assistant", "system"].includes(m.role) && 
               typeof m.content === "string"
      );

      if (validMessages.length === 0) continue;

      // Create ChatMessage records
      for (let i = 0; i < validMessages.length; i++) {
        const msg = validMessages[i];
        const createdAt = msg.timestamp ? new Date(msg.timestamp) : new Date(Date.now() + i * 1000);
        
        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: msg.role,
            content: msg.content,
            isHuman: msg.isHuman || false,
            createdAt,
          },
        });
        totalMigrated++;
      }

      console.log(`  ✅ Session ${session.id.slice(0, 8)}: migrated ${validMessages.length} messages`);
    } catch (err) {
      console.error(`  ❌ Session ${session.id.slice(0, 8)}: error`, err);
      errors++;
    }
  }

  console.log(`\n🎉 Migration complete: ${totalMigrated} messages migrated, ${errors} errors.`);
  console.log("\n⚠ To complete migration, run the following SQL to drop the old column:");
  console.log('  ALTER TABLE "SupportSession" DROP COLUMN IF EXISTS "messages";');
}

main()
  .catch((e) => {
    console.error("❌ Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
