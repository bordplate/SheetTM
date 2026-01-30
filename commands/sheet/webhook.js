const { url } = require("../../config.json");

const { SlashCommandBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("webhook")
        .setDescription("Gets your personalized webhook URL"),

    async execute(interaction) {
        let lbString = "";
        await interaction.deferReply();

        await interaction.editReply(`\`${url}/api/pb/${interaction.user.id}\``);
    },
};
