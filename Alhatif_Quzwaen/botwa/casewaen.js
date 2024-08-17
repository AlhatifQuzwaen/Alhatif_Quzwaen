module.exports = async (w, msg, store) => {
    try {
        const messageType = Object.keys(msg.message)[0];
        const messageContent = {
            conversation: msg.message.conversation,
            extendedTextMessage: msg.message.extendedTextMessage?.text,
            imageMessage: msg.message.imageMessage?.caption,
            videoMessage: msg.message.videoMessage?.caption,
            buttonsResponseMessage: msg.message.buttonsResponseMessage?.selectedButtonId,
            listResponseMessage: msg.message.listResponseMessage?.title,
            templateButtonReplyMessage: msg.message.templateButtonReplyMessage?.selectedId,
            messageContextInfo: msg.message.buttonsResponseMessage?.selectedButtonId || msg.message.listResponseMessage?.title || msg.message.templateButtonReplyMessage?.selectedId
        }[messageType] || '';

        const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(messageContent)
            ? messageContent.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi)[0]
            : '.';

        const isCommand = messageContent.startsWith(prefix);
        const command = isCommand
            ? messageContent.slice(prefix.length).trim().split(' ').shift().toLowerCase()
            : '';

        const args = isCommand
            ? messageContent.slice(prefix.length).trim().split(' ').slice(1)
            : [];

        const from = msg.key.remoteJid;
        const senderName = msg.pushName || 'Unknown';

        if (isCommand) {
            console.log(
                require("chalk").black(require("chalk").bgGreen(`Command: ${prefix + command}`)),
                require("chalk").black(require("chalk").bgWhite(`From: ${senderName}`)),
                require("chalk").black(require("chalk").bgYellow(`Args: ${args.join(' ')}`))
            );
        }

        const reply = (text) => {
            w.sendMessage(from, { text: text }, { quoted: msg });
        };

        const commandNotFound = () => {
            reply(`Sorry, the command *${command}* is not recognized. Please use *${prefix}help* to see the list of available commands.`);
        };

        switch (command) {
            case "tes":
                reply("Bot is online! 🎉");
                break;

            case "help":
                reply(`Available commands:\n1. ${prefix}tes - Check if the bot is online\n2. ${prefix}hello - Greet the bot`);
                break;

            case "hello":
                reply(`Hello, ${senderName}! How can I assist you today?`);
                break;

            case "info":
                reply(`This bot is created using the Baileys library with Node.js. For more information, visit the documentation.`);
                break;

            default:
                if (isCommand) {
                    commandNotFound();
                }
                break;
        }

    } catch (error) {
        console.error("Error in message handling:", error);
    }
};
