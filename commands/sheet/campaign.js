const { SlashCommandBuilder } = require("discord.js");
const { getName, sleep } = require("../../utility-functions");
const fetch = require("node-fetch");

async function updateCampaignTime(user, track, time) {
  const data = {
    player: user.name,
    track: track,
    time: time,
  };

  const response = await fetch("http://localhost:8080/campaign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

async function getRanking(track, time) {
  const data = {
    track: track,
    time: time,
  };

  const response = await fetch("http://localhost:8080/campaign/ranking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("campaign")
    .setDescription("Edit your campaign time on the sheet")
    .addIntegerOption((option) =>
      option
        .setMinValue(1)
        .setMaxValue(25)
        .setName("track")
        .setDescription("Select track")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Input your time in the example format: '0:12.345'")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = await getName(interaction);
      let track = interaction.options.getInteger("track");
      track = track < 10 ? `0${track}` : track.toString();
      let rank;
      let timeSave;
      let success;

      const timeRegexWithMinutes = /^([0-5]?\d):([0-5]?\d)\.(\d{3})$/;
      const timeRegexWithoutMinutes = /^([0-5]?\d)\.(\d{3})$/;
      let time = interaction.options.getString("time");

      if (
        !timeRegexWithMinutes.test(time) &&
        !timeRegexWithoutMinutes.test(time)
      ) {
        await interaction.editReply("Invalid time format.");
        return;
      }

      if (timeRegexWithoutMinutes.test(time)) {
        time = `0:${time}`;
      }

      if (!user) {
        await interaction.editReply(
          "You haven't set your name yet. Please do /setname."
        );
        return;
      }

      try {
        const result = await updateCampaignTime(user, track, time);

        if (result.matchFound) {
          success = true;
          timeSave = result.timeSave;
        } else {
          success = false;
        }

        // if (!response.ok) {
        //   // Log the error status and response text
        //   console.error(`Error: ${response.status} - ${await response.text()}`);
        //   return;
        // }
      } catch (error) {
        console.error("Error:", error);
      }

      if (success) {
        let rankAttempts = 0;

        do {
          rankAttempts++;
          rank = (await getRanking(track, time)).rank;

          let rankString = `placing #${rank}`;
          if (rank === undefined) {
            rankString = `rank calculation retry ${rankAttempts}...`;
          }

          if (rankAttempts > 20) {
            rankString = `rank calculation failed after 20 attempts.`;
          }

          await interaction.editReply(
              `Updated ${user.name}'s time on track ${track} to ${time} (-${timeSave}) – ${rankString}`
          );

          await sleep(1000);
        } while (rank === undefined && rankAttempts < 20);
      } else {
        await interaction.editReply(`Name not found on the sheet.`);
      }
    } catch (error) {
      console.error("Error in execute:", error.message);
      await interaction.editReply(
        "An error occurred while executing the command."
      );
    }
  },
};
