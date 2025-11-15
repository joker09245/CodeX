const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'greroll',
    description: 'Reroll a giveaway',
    usage: 'greroll <message_id>',
    category: 'Giveaway',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply(`${client.config.emoji.ERROR} You need \`MANAGE_MESSAGES\` permission to reroll giveaways!`);
        }

        if (!args[0]) {
            return message.reply(`${client.config.emoji.ERROR} Please provide a giveaway message ID!`);
        }

        const giveawayId = args[0];
        
        try {
            const giveaway = client.giveaways?.get(giveawayId);
            if (!giveaway) {
                return message.reply(`${client.config.emoji.ERROR} Giveaway not found!`);
            }

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
            const tempParticipants = [...participants];
            
            for (let i = 0; i < Math.min(giveaway.winners, tempParticipants.length); i++) {
                const randomIndex = Math.floor(Math.random() * tempParticipants.length);
                winners.push(tempParticipants[randomIndex]);
                tempParticipants.splice(randomIndex, 1);
            }

            const winnersMention = winners.map(winner => `<@${winner}>`).join(', ');
            
            const rerollEmbed = new EmbedBuilder()
                .setTitle(`${client.config.emoji.DANCE} **GIVEAWAY REROLLED** ${client.config.emoji.DANCE}`)
                .setDescription(`**Prize:** ${giveaway.prize}\n**New Winners:** ${winnersMention}\n**Rerolled by:** ${message.author}`)
                .setColor(client.config.color)
                .setTimestamp();

            await message.channel.send({ embeds: [rerollEmbed] });

        } catch (error) {
            message.reply(`${client.config.emoji.ERROR} Error rerolling giveaway: ${error.message}`);
        }
    }
};
