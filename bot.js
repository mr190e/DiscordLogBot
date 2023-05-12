const fs = require('fs');
const { Client, Intents } = require('discord.js');

// Read the configuration from the config.json file
const config = JSON.parse(fs.readFileSync('./config.json'));

// Destructure the configuration options
const { token, channelId, logFile } = config;

// Create a new Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
  console.log(`Bot connected as ${client.user.tag}`);
});

function sendLogMessage(logEntry) {
  client.channels.fetch(channelId)
    .then((channel) => channel.send(logEntry))
    .catch((error) => console.error('Error sending log message:', error));
}

let currentSize = 0;

function monitorLogFile() {
  const stats = fs.statSync(logFile);
  currentSize = stats.size;

  fs.watchFile(logFile, (curr, prev) => {
    if (curr.size < prev.size) {
      currentSize = curr.size; // Log file truncated or rotated, reset size
      return;
    }

    const bufferSize = curr.size - currentSize;
    if (bufferSize <= 0) {
      return; // No new content
    }

    const buffer = Buffer.alloc(bufferSize);
    const fileDescriptor = fs.openSync(logFile, 'r');
    fs.readSync(fileDescriptor, buffer, 0, bufferSize, currentSize);
    fs.closeSync(fileDescriptor);

    const newContent = buffer.toString('utf-8');
    const lines = newContent.split('\n');

    lines.forEach((line) => {
      if (line.trim() !== '') {
        sendLogMessage(line);
      }
    });

    currentSize = curr.size;
  });
}

client.login(token).then(() => {
  monitorLogFile();
});
