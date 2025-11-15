const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gstart',
    description: 'Start a giveaway',
    usage: 'gstart <duration> <winners> <prize>',
    category: 'Giveaway',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply(`${client.config.emoji.ERROR} You need \`MANAGE_MESSAGES\` permission to start giveaways!`);
        }

        if (args.length < 3) {
            return message.reply(`${client.config.emoji.ERROR} Usage: ${client.config.prefix}gstart <duration> <winners> <prize>`);
        }

        const duration = args[0];
        const winners = parseInt(args[1]);
        const prize = args.slice(2).join(' ');

        if (isNaN(winners) || winners < 1) {
            return message.reply(`${client.config.emoji.ERROR} Please provide a valid number of winners!`);
        }

        let timeMs;
        if (duration.endsWith('d')) timeMs = parseInt(duration) * 24 * 60 * 60 * 1000;
        else if (duration.endsWith('h')) timeMs = parseInt(duration) * 60 * 60 * 1000;
        else if (duration.endsWith('m')) timeMs = parseInt(duration) * 60 * 1000;
        else if (duration.endsWith('s')) timeMs = parseInt(duration) * 1000;
        else return message.reply(`${client.config.emoji.ERROR} Invalid duration format! Use d, h, m, or s.`);

        const endTime = Date.now() + timeMs;

        const embed = new EmbedBuilder()
            .setTitle(`${client.config.emoji.MONEY} **GIVEAWAY** ${client.config.emoji.MONEY}`)
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
            .setColor(client.config.color)
            .setFooter({ text: `React with ${client.config.emoji.MONEY} to enter!` })
            .setTimestamp(endTime);

        const giveawayMessage = await message.channel.send({ embeds: [embed] });
        await giveawayMessage.react(client.config.emoji.MONEY);

        if (!client.giveaways) client.giveaways = new Map();
        client.giveaways.set(giveawayMessage.id, {
            messageId: giveawayMessage.id,
            channelId: message.channel.id,
            endTime: endTime,
            winners: winners,
            prize: prize,
            participants: []
        });

        message.reply(`${client.config.emoji.SUCCESS} Giveaway started!`);
    }
};
