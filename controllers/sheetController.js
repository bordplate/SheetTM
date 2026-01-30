const {
  getColumnLetter,
  calculateTimeDifference,
  getSheetAuth,
} = require("../utility-functions");
const { spreadsheetId } = require("../config.json");

const updateCotdSheet = async (player, date, div, rank) => {
  const [auth, googleSheets] = await getSheetAuth();

  const range = "COTD!A1:AF";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  const values = getRows.data.values;
  let matchColumn;
  let matchRow;

  for (let column = 0; column < values[0].length; column++) {
    if (values[0][column] === player) {
      matchColumn = getColumnLetter(column - 1);
      for (let row = 0; row < values.length; row++) {
        if (values[row][0] === date) {
          matchRow = row + 1;
          break;
        }
      }
    }
  }

  const gamiRange = "COTDigami!B2:BD66";
  const cotdgamiRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: gamiRange,
  });

  const gamiValues = cotdgamiRows.data.values;
  const newEntry = gamiValues[rank][div] == "";
  if (matchColumn && matchRow) {
    const updateRange = `COTD!${matchColumn}${matchRow}`;

    googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[div, rank]],
      },
    });
    return { matchFound: true, newEntry };
  } else {
    return { matchFound: false };
  }
};

const updateCotdInfo = async (track, type, date, playerCount) => {
  const [auth, googleSheets] = await getSheetAuth();

  const range = "COTD!A1:C";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  const values = getRows.data.values;
  let matchRow;

  for (let row = 0; row < values.length; row++) {
    if (values[row][0] === date) {
      matchRow = row + 1;
      break;
    }
  }

  if (matchRow) {
    const updateRange = `COTD!B${matchRow}:C${matchRow}`;

    googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[track, type]],
      },
    });
  }

  if (playerCount) {
    // Update player count:
    const playerCountRange = `'COTD Stats'!A3:B`;

    const getPlayerCountRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: playerCountRange,
    });

    const playerCountValues = getPlayerCountRows.data.values;

    matchRow = null;

    for (let row = 0; row < playerCountValues.length; row++) {
      if (values[row][0] === date) {
        matchRow = row + 1;
        break;
      }
    }

    if (matchRow) {
      const updateRange = `'COTD Stats'!B${matchRow}:B500`;

      googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: updateRange,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[playerCount]],
        },
      });
    }
  }
};

const updateCampaign = async (player, track, time) => {
  const [auth, googleSheets] = await getSheetAuth();

  const range = "Campaign!A1:M";

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  const values = getRows.data.values;

  let matchColumn;
  let matchRow;

  for (let column = 0; column < values[0].length; column++) {
    if (values[0][column] === player) {
      matchColumn = column;
      for (let row = 0; row < values.length; row++) {
        if (values[row][0] === track) {
          matchRow = row + 1;
          break;
        }
      }
    }
  }
  if (matchColumn && matchRow) {
    const updateRange = `Campaign!${getColumnLetter(matchColumn)}${matchRow}`;

    googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[time]],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      matchFound: true,
      timeSave: calculateTimeDifference(
        values[matchRow - 1][matchColumn],
        time
      ),
    };
  } else {
    return { matchFound: false };
  }
};

const getRankings = async (time, track) => {
  const [auth, googleSheets] = await getSheetAuth();

  const rankingRange = "Campaign!C84:M109";

  const getRankings = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: rankingRange,
  });

  const rankings = getRankings.data.values;

  for (let row = 0; row < rankings.length; row++) {
    if (rankings[row][0] === track) {
      for (let column = 0; column < rankings[0].length; column++) {
        if (rankings[row][column] === time) {
          return column;
        }
      }
    }
  }
};

const getLeaderboard = async () => {
  const [auth, googleSheets] = await getSheetAuth();

  const range = "Campaign!D1:M2";
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range,
  });

  const values = getRows.data.values;
  const [names, scores] = [values[0], values[1]];
  const unorderedLeaderboard = names.map((name, index) => ({
    name,
    score: scores[index],
  }));
  const leaderboard = unorderedLeaderboard.sort((a, b) => b.score - a.score);
  return leaderboard;
  s;
};

module.exports = {
  updateCotdSheet,
  updateCotdInfo,
  updateCampaign,
  getLeaderboard,
  getRankings,
};
