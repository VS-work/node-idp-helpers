require('dotenv').config();
const {
  google
} = require('googleapis');

const getToken = require('./auth0');

async function getCalendar(email) {
  return new Promise((resolve, reject) => {
    getToken({
      email
    }, (err, {
      access_token,
      refresh_token
    }) => {
      if (err) {
        throw new Error(err);
      }

      /**
       * we have refresh_token stored in auth0 so new access_token will be generated automatically
       * without any code generated on auth flow, but client_id and secret must be provided
       */
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        access_token,
        refresh_token
      })

      const calendar = google.calendar('v3');

      return resolve({
        calendar,
        oauth2Client
      });
    });
  })
}

async function syncEvents(email) {
  const {
    calendar,
    oauth2Client
  } = await getCalendar(email);

  calendar.events.list({
    auth: oauth2Client,
    calendarId: 'primary',
    syncToken,
    pageToken,
    maxResults: 15
  }, (err, response) => {
    if (err) {
      throw new Error(err);
    }

    const {
      nextSyncToken,
      nextPageToken,
      items
    } = response.data;

    if (nextSyncToken) {
      syncToken = nextSyncToken;
    }

    if (nextPageToken) {
      pageToken = nextPageToken;
    }

    console.log('items.length', items.length);

    if (items.length === 15) {
      syncEvents(email);
    }
  });
}

let syncToken;
let pageToken;

module.exports.getCalendar = getCalendar;
module.exports.syncEvents = syncEvents;

// syncEvents('email@gmail.com');
