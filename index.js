const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./src/config');
const fs = require('fs');
const path = require('path');

class BotClient extends Client {
    constructor() {
        super({
            shards: 'auto',
            allowedMentions: {
                parse: ['users', 'roles'],
                repliedUser: true
            },
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
        });

        // Initialize collections
        this.commands = new Collection();
        this.aliases = new Collection();
        this.events = new Collection();
        this.config = config;

        // Load handlers
        this.loadHandlers();
    }

    /**
     * Load all handlers
     */
    loadHandlers() {
        try {
            // Load events
            const eventsPath = path.join(__dirname, 'src/events');
            if (fs.existsSync(eventsPath)) {
                const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
                
                for (const file of eventFiles) {
                    const event = require(path.join(eventsPath, file));
                    const eventName = file.split('.')[0];
                    
                    if (event.once) {
                        this.once(eventName, (...args) => event.execute(...args, this));
                    } else {
                        this.on(eventName, (...args) => event.execute(...args, this));
                    }
                    
                    console.log(`Loaded event: ${eventName}`);
                }
            }

            // Load commands
            this.loadCommands();

        } catch (error) {
            console.error('Error loading handlers:', error);
        }
    }

    /**
     * Load commands
     */
    loadCommands() {
        try {
            const commandsPath = path.join(__dirname, 'src/commands');
            if (fs.existsSync(commandsPath)) {
                const commandCategories = fs.readdirSync(commandsPath);
                
                for (const category of commandCategories) {
                    const categoryPath = path.join(commandsPath, category);
                    if (!fs.statSync(categoryPath).isDirectory()) continue;
                    
                    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                    
                    for (const file of commandFiles) {
                        const command = require(path.join(categoryPath, file));
                        
                        if (command.name) {
                            this.commands.set(command.name, command);
                            console.log(`Loaded command: ${command.name}`);
                            
                            // Register aliases
                            if (command.aliases && Array.isArray(command.aliases)) {
                                command.aliases.forEach(alias => {
                                    this.aliases.set(alias, command.name);
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading commands:', error);
        }
    }

    /**
     * Start the bot
     */
    async start() {
        try {
            await this.login(this.config.token);
            console.log(`✅ ${this.user.tag} is online!`);
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }
}

// Create and start the bot instance
const client = new BotClient();
client.start();

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    client.destroy();
    process.exit(0);
});
