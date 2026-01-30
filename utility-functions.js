const filePath = "data/userData.json";
const fs = require("fs").promises;
const { spreadsheetId } = require("./config.json");
const { google } = require("googleapis");

const getName = async (interaction) => {
  try {
    // Read the content of userData.json
    const fileData = await fs.readFile(filePath, "utf-8");

    // Parse the JSON content
    const userNames = JSON.parse(fileData);
    // Retrieve and reply with the user's name
    return userNames.find((user) => user.id === interaction.user.id);
  } catch (error) {
    console.error("Error reading data:", error.message);
    throw error; // Re-throw the error to handle it at a higher level if needed
  }
};

const calculateTimeDifference = (oldTime, newTime) => {
  const timeDiff = Math.abs(timeToMs(oldTime) - timeToMs(newTime));
  return msToTime(timeDiff);
};

const timeToMs = (time) => {
  const [minutes, rest] = time.split(":");
  const [seconds, milliseconds] = rest.split(".").map(parseFloat);
  return minutes * 60000 + seconds * 1000 + milliseconds;
};

const msToTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  ms %= 60000;
  const seconds = Math.floor(ms / 1000);
  ms %= 1000;
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
};

const setName = async (userId, newName) => {
  try {
    // Read existing data from the file
    const existingData = await fs.readFile(filePath, "utf-8");

    // Parse existing data or initialize an empty array
    const userNames = JSON.parse(existingData || "[]");

    // Update or add the user's name
    const existingUserIndex = userNames.findIndex((user) => user.id === userId);

    if (existingUserIndex !== -1) {
      userNames[existingUserIndex].name = newName;
    } else {
      userNames.push({ id: userId, name: newName });
    }

    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(userNames), "utf-8");
  } catch (error) {
    console.error("Error writing data:", error.message);
    throw error; // Re-throw the error to handle it at a higher level if needed
  }
};

const getColumnLetter = (index) => {
  let letter = "";
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

let cachedSheets = null;
const getSheetAuth = async () => {
  if (cachedSheets) return cachedSheets;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });

  cachedSheets = [auth, googleSheets];

  return [auth, googleSheets];
};

async function sleep(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

module.exports = {
  calculateTimeDifference,
  getColumnLetter,
  getName,
  getSheetAuth,
  setName,
  sleep,
};
