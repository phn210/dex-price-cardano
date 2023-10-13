import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { BlockfrostAdapter } from "@minswap/sdk";
import { google } from 'googleapis';
import credentials from './golden-record-401410-fcfd88cbb372.json' assert { type: 'json' };

// Setup Minswap API
const api = new BlockfrostAdapter({
  blockFrost: new BlockFrostAPI({
    projectId: "mainnetFOwvFxnRIlaq0s2YjGaPUWJFUIw88fzU",
    network: "mainnet",
  }),
});

// // Set up Google Sheets API credentials
// const auth = new google.auth.JWT({
//   email: credentials.client_email,
//   key: credentials.private_key,
//   scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });

// // Define the spreadsheet ID and range to update
// const spreadsheetId = '1GBT-KW6qz7psQrjJr1f384ec-FjvYXqBSZriad1VsJI';
// const range = 'Test!A1'; // Change this to the desired range

// // Define the data to update
// const requestData = {
//   values: [[new Date(), 'Updated Data']],
// };

// // Create the 'sheets' object using google.sheets
// const sheets = google.sheets({ version: 'v4', auth });

// // Use the spreadsheets.get method to retrieve the spreadsheet properties
// sheets.spreadsheets.get({
//   spreadsheetId: spreadsheetId, // Replace with the actual spreadsheet ID
// }, (err, response) => {
//   if (err) {
//     console.error(`The API returned an error: ${err}`);
//     return;
//   }
//   console.log('Spreadsheet Properties:', response.data);
// });

// // Use the Google Sheets API to update the data
// sheets.spreadsheets.values.update({
//   auth: auth,
//   spreadsheetId: spreadsheetId,
//   range: range,
//   valueInputOption: 'RAW',
//   resource: requestData,
// }, (err, response) => {
//   if (err) {
//     console.error(`The API returned an error: ${err}`);
//     return;
//   }
//   console.log('Data updated in Google Sheets:', response.data);
// });

for (let i = 1; ; i++) {
  const pools = await api.getPools({
    page: i,
  });
  if (pools.length === 0) {
    // last page
    break;
  }
  const minADAPool = pools.find(
    (p) =>
      p.assetA === "lovelace" &&
      p.assetB ===
      "95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb0048554e54"
  );
  if (minADAPool) {
    const [a, b] = await api.getPoolPrice({ pool: minADAPool });
    console.log(
      `ADA/MIN price: ${a.toString()}; MIN/ADA price: ${b.toString()}`
    );
    // we can later use this ID to call getPoolById
    console.log(`ADA/MIN pool ID: ${minADAPool.id}`);
    break;
  }
}

