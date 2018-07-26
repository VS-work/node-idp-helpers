require('dotenv').config();

const uuidv1 = require('uuid/v1');
const http = require('http');

const {
  syncEvents,
  getCalendar
} = require('./calendar');

/**
 * getting all calendar events to sync initial state
 * and saving nextSyncToken
 */
syncEvents('email@gmail.com');

/**
 * creating watch event
 *
 * To create one you need public domain (address field, where you will waiting for the hook) validated on
 * https://www.google.com/webmasters/verification/home
 *
 * and in dev console
 * https://console.developers.google.com/apis/credentials/domainverification
 */
getCalendar('email@gmail.com').then(({
  calendar,
  oauth2Client
}) => {
  const data = {
    auth: oauth2Client,
    calendarId: 'primary',
    singleEvents: true,
    orderBy: 'startTime',
    resource: {
      id: uuidv1(),
      address: process.env.GOOGLE_WATCH_DOMAIN,
      type: 'web_hook',
      params: {
        ttl: '36000'
      }
    }
  };

  calendar.events.watch(data, err => {
    if (err) {
      console.log('calendar.events.watch Error', err);

      return;
    }
    console.log('calendar.events.watch was created');
  });
});

const server = http.createServer((req, res) => {
  /**
   * watching post request to sync events using nextSyncToken
   * to get only last changes
   */
  if (req.method === 'POST') {
    syncEvents('email@gmail.com');
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.end('OK');
});

server.listen(3000);
