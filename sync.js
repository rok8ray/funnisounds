const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const REPL_URL = 'https://d91cfdb4-b883-460d-9bf3-71de208e4ed6-00-1f15klsv3zct8.spock.replit.dev';

async function sync() {
  try {
    const list = await axios.get(`${REPL_URL}/list`);
    const files = list.data;

    for (const file of files) {
      console.log(`Syncing ${file}...`);
      const localPath = path.join(__dirname, file);
      const writer = fs.createWriteStream(localPath);
      
      const response = await axios.get(`${REPL_URL}/download/${file}`, { responseType: 'stream' });
      response.data.pipe(writer);

      writer.on('finish', async () => {
        // Run Git Push
        exec(`git add . && git commit -m "Auto-sync ${file}" && git push`, async (err) => {
          if (!err) {
            console.log(`${file} pushed to GitHub!`);
            
            // DELETE the file from Replit so it doesn't download again
            try {
              await axios.delete(`${REPL_URL}/delete/${file}`);
              console.log(`Cleared ${file} from Replit.`);
            } catch (delError) {
              console.error("Failed to delete from Replit:", delError.message);
            }
          }
        });
      });
    }
  } catch (e) {
    console.log("Looking for new files...");
  }
}

setInterval(sync, 60000);