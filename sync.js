const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const REPL_URL = 'https://d91cfdb4-b883-460d-9bf3-71de208e4ed6-00-1f15klsv3zct8.spock.replit.dev';

async function sync() {
  try {
    // 1. Get list of files
    const list = await axios.get(`${REPL_URL}/list`);
    const files = list.data;

    for (const file of files) {
      console.log(`Downloading ${file}...`);
      const writer = fs.createWriteStream(path.join(__dirname, file));
      const response = await axios.get(`${REPL_URL}/download/${file}`, { responseType: 'stream' });
      
      response.data.pipe(writer);

      writer.on('finish', () => {
        // 2. Push to GitHub after download
        exec(`git add . && git commit -m "Auto-sync ${file}" && git push`, (err) => {
          if (!err) console.log(`${file} pushed to GitHub!`);
        });
      });
    }
  } catch (e) {
    console.log("Checking for files... (Server might be asleep)");
  }
}

// Check every 60 seconds
setInterval(sync, 60000);
console.log("Receiver is running. Leave this window open at home!");