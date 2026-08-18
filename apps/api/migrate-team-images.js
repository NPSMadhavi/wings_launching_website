import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, 'uploads');

async function migrateTeamImages() {
  console.log("Starting migration of team member images to PostgreSQL Base64 format...");

  try {
    const [members] = await db.query(`SELECT id, photo_url FROM team_members WHERE photo_url LIKE '/api/uploads/%'`);
    
    if (members.length === 0) {
      console.log("No team members found with filesystem images. Migration complete.");
      return;
    }

    console.log(`Found ${members.length} team members to migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (const member of members) {
      try {
        const filename = member.photo_url.replace('/api/uploads/', '');
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
          console.warn(`[WARN] File not found for member ${member.id}: ${filePath}`);
          failCount++;
          continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.gif') mimeType = 'image/gif';

        const base64Data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

        await db.query(`UPDATE team_members SET photo_url = $1 WHERE id = $2`, [base64Data, member.id]);
        
        console.log(`[SUCCESS] Migrated member ${member.id}`);
        successCount++;
      } catch (err) {
        console.error(`[ERROR] Failed to migrate member ${member.id}:`, err.message);
        failCount++;
      }
    }

    console.log(`\nMigration completed!`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (err) {
    console.error("Migration failed due to a database error:", err);
  }
}

migrateTeamImages().then(() => process.exit(0));
