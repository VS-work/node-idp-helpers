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

      const oauth2Client = new google.auth.OAuth2();
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
    maxResults: 10
  }, function (err, response) {
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

    if (items.length > 0) {
      syncEvents('example@email.com');
    }

  });
}

let syncToken;
let pageToken;

syncEvents('example@email.com');
