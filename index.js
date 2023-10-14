import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { BlockfrostAdapter } from "@minswap/sdk";
import { google } from 'googleapis';
import credentials from './secrets/golden-record-401410-fcfd88cbb372.json' assert { type: 'json' };
import dotenv from "dotenv";
dotenv.config({ silent: process.env.NODE_ENV === 'production' });

// Setup Minswap API
const api = new BlockfrostAdapter({
  blockFrost: new BlockFrostAPI({
    projectId: process.env.BLOCKFROST_PROJECT_ID,
    network: "mainnet",
  }),
});

// Set up Google Sheets API credentials
const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Define the spreadsheet ID and range to update
const spreadsheetId = process.env.SHEET_ID;
const sheetName = process.env.SHEET_NAME;
const lengthRange = sheetName + '!A1';
let dataRange = sheetName + '!B3:C';
let priceRange = sheetName + '!D3:D';

// Create the 'sheets' object using google.sheets
const sheets = google.sheets({ version: 'v4', auth });

async function getNumberOfTokens(spreadsheetId, range) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    }, (err, response) => {
      if (err) reject(err);
      else resolve(response.data.values[0][0]);
    });
  });
}

let listSize = Number(await getNumberOfTokens(spreadsheetId, lengthRange));
dataRange = dataRange + (3 + listSize - 1);
priceRange = priceRange + (3 + listSize - 1);

async function getTokens(spreadsheetId, range) {
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    }, (err, response) => {
      if (err) reject(err);
      else resolve(response.data.values.map(e => e[0] + e[1]));
    });
  });
}

let tokens = await getTokens(spreadsheetId, dataRange);
console.log(tokens)
let tokenPrices = [];

let pools = [];
for (let i = 1; ; i++) {
  const fetchedPools = await api.getPools({
    page: i,
  });
  if (fetchedPools.length === 0) {
    // last page
    break;
  }
  pools = pools.concat(fetchedPools);
}

let tmp = tokens;
let index = 0;
while (tmp.length > 0) {
  const minADAPool = pools.find(
    (p) => p.assetA === "lovelace" && p.assetB === tmp[0]
  );
  if (minADAPool) {
    const [a, b] = await api.getPoolPrice({ pool: minADAPool });
    // console.log(
    //   `ADA/... price: ${a.toString()}; .../ADA price: ${b.toString()}`
    // );
    // // we can later use this ID to call getPoolById
    // console.log(`... pool ID: ${minADAPool.id}`);
    // console.log('Asset:', minADAPool.assetB);
    tokenPrices[index] = a;
  } else tokenPrices[index] = 'NOT_FOUNDED';
  index++;
  tmp = tmp.slice(1, tmp.length);
}
console.log(tokenPrices)


// Define the data to update
const requestData = {
  values: tokenPrices.map(e => e == 'NOT_FOUNDED' ? e : [e.toPrecision(4).toString().replace('.', ',')]),
};

// Use the Google Sheets API to update the data
sheets.spreadsheets.values.update({
  auth: auth,
  spreadsheetId: spreadsheetId,
  range: priceRange,
  valueInputOption: 'USER_ENTERED',
  resource: requestData,
}, (err, response) => {
  if (err) {
    console.error(`The API returned an error: ${err}`);
    return;
  }
  console.log('Data updated in Google Sheets:', response.data);
});