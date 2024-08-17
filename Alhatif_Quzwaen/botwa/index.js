const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, proto } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');

const CONFIG = {
    pairing: process.argv.includes('--pairing'),
    storePath: './database.json',
    sessionPath: 'sessions',
    backupInterval: 10000,
    browserInfo: ['Mac OS', 'Safari', '10.15.7'],
};

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const askQuestion = (questionText) => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(questionText, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

async function startBot() {
    try {
        const auth = await useMultiFileAuthState(CONFIG.sessionPath);
        const socket = makeWASocket({
            printQRInTerminal: !CONFIG.pairing,
            browser: CONFIG.browserInfo,
            auth: auth.state,
            logger: pino({ level: 'silent' }),
        });

        store.bind(socket.ev);

        setInterval(() => {
            store.writeToFile(CONFIG.storePath);
        }, CONFIG.backupInterval);

        if (CONFIG.pairing && !socket.authState.creds.registered) {
            const userNumber = await askQuestion(chalk.blueBright('Enter your WhatsApp number (e.g., 628xx): '));
            setTimeout(async () => {
                const pairingCode = await socket.requestPairingCode(userNumber);
                console.log(chalk.greenBright('Your pairing code is:'), chalk.yellowBright(pairingCode));
            }, 3000);
        }

        socket.ev.on('creds.update', auth.saveCreds);
        socket.ev.on('connection.update', ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                console.log(chalk.greenBright('Connected successfully to WhatsApp as:'), chalk.blueBright(socket.user.id.split(':')[0]));
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.error(chalk.red('Connection closed. Reason:'), reason);
                startBot();
            }
        });

        socket.ev.process(async (events) => {
            if (events['messages.upsert']) {
                const upsert = events['messages.upsert'];
                for (let msg of upsert.messages) {
                    if (!msg.message) continue;
                    if (msg.key.remoteJid === 'status@broadcast') {
                        console.log(chalk.blueBright(`Status from ${msg.pushName}: ${msg.key.participant.split('@')[0]}`));
                        await socket.readMessages([msg.key]);
                        continue;
                    }
                    require("./casewaen")(socket, msg, store);
                }
            }
        });

    } catch (error) {
        console.error(chalk.red('An error occurred while starting the bot:'), error.message);
        process.exit(1);
    }
}

startBot();
