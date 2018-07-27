require('dotenv').config();
const {
  google
} = require('googleapis');
const express = require('express');
const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

app.get('/', (req, res) => {
  const scope = process.env.GOOGLE_SCOPE.split(',');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope
  });

  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    throw new Error('OAuth code is required');
  }

  const {
    tokens
  } = await oauth2Client.getToken(code)

  oauth2Client.setCredentials(tokens);
  app.set('json spaces', 2);
  getUserList(oauth2Client).then(users => res.json({ users }))
                           .catch(error => res.json({ error: error.errors }));
});

function getUserList(oauth2Client) {
  return new Promise((resolve, reject) => {
    const admin = google.admin('directory_v1');

    admin.users.list({
      auth: oauth2Client,
      domain: 'domain.com'
    }, (err, response) => {
      if (err) {
        return reject(err);
      }

      resolve(response.data.users);
    });
  });
}

app.listen(3000);
