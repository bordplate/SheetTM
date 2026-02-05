const { url } = require("../../config.json");

const { SlashCommandBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("webhook")
        .setDescription("Gets your personalized webhook URLs"),

    async execute(interaction) {
        await interaction.reply({"content": `PB: \`${url}/api/pb/${interaction.user.id}\`\nCoTD: \`${url}/api/cotd/${interaction.user.id}\``, ephemeral: true});
    },
};
