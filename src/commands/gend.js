const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gend',
    description: 'End a giveaway',
    usage: 'gend <message_id>',
    category: 'Giveaway',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply(`${client.config.emoji.ERROR} You need \`MANAGE_MESSAGES\` permission to end giveaways!`);
        }

        if (!args[0]) {
            return message.reply(`${client.config.emoji.ERROR} Please provide a giveaway message ID!`);
        }

        const giveawayId = args[0];
        
        if (!client.giveaways || !client.giveaways.has(giveawayId)) {
            return message.reply(`${client.config.emoji.ERROR} Giveaway not found!`);
        }

        const giveaway = client.giveaways.get(giveawayId);
        
        try {
            const channel = await client.channels.fetch(giveaway.channelId);
            const giveawayMessage = await channel.messages.fetch(giveawayId);
            
            const reaction = giveawayMessage.reactions.cache.find(r => r.emoji.name === client.config.emoji.MONEY);
            if (!reaction) {
                return message.reply(`${client.config.emoji.ERROR} No participants found!`);
            }

            const users = await reaction.users.fetch();
            const participants = users.filter(user => !user.bot).map(user => user.id);
            
            if (participants.length === 0) {
                return message.reply(`${client.config.emoji.ERROR} No participants found!`);
            }

            const winners = [];
            for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
                const randomIndex = Math.floor(Math.random() * participants.length);
                winners.push(participants[randomIndex]);
                participants.splice(randomIndex, 1);
            }

            const winnersMention = winners.map(winner => `<@${winner}>`).join(', ');
            
            const winnerEmbed = new EmbedBuilder()
                .setTitle(`${client.config.emoji.PAID} **GIVEAWAY ENDED** ${client.config.emoji.PAID}`)
                .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnersMention}\n**Hosted by:** ${message.author}`)
                .setColor('#00FF00')
                .setTimestamp();

            await message.channel.send({ embeds: [winnerEmbed] });
            client.giveaways.delete(giveawayId);

        } catch (error) {
            message.reply(`${client.config.emoji.ERROR} Error ending giveaway: ${error.message}`);
        }
    }
};
