require('dotenv').config();
const {
  google
} = require('googleapis');

const getToken = require('./auth0');

async function getAdminApi(email) {
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

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        access_token,
        refresh_token
      })

      const admin = google.admin('directory_v1');

      return resolve({
        admin,
        oauth2Client
      });
    });
  })
}

async function getUserList(email) {
  const {
    admin,
    oauth2Client
  } = await getAdminApi(email);

  admin.users.list({
    auth: oauth2Client,
    domain: 'domain.com'
  }, (err, response) => {
    if (err) {
      throw new Error(err);
    }

    console.log('response', response.data.users);
  });
}

getUserList('admin@domain.com');
