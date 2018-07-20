const request = require('request');
const url = require('url');
const express = require('express');
const app = express();
require('dotenv').config();
const {
  WebClient
} = require('@slack/client');

/**
 * Get Slack user list using manually generated token and customizable scope by team admin
 * 
 * https://api.slack.com/apps/<app_id>/oauth?
 */
const token = process.env.SLACK_ACCESS_TOKEN;

if (token) {
  const getUsers = async () => {
    const users = await getUserList(token);
    console.log(users);
  }
  getUsers();
}

/**
 * Get Slack user list using OAuth2
 * get code and exchange it to access token providing any scope we need
 * 
 * https://api.slack.com/docs/oauth
 */
app.get('/', (req, res) => {
  const authUrl = new url.URLSearchParams([
    ['client_id', process.env.SLACK_CLIENT_ID],
    ['scope', process.env.SLACK_SCOPE],
    ['redirect_uri', process.env.SLACK_REDIRECT_URL]
  ]);

  res.redirect(`https://slack.com/oauth/authorize?${authUrl}`);
});

app.get('/callback', (req, res) => {
  const code = req.query.code;

  if (!code) {
    throw new Error('OAuth code is required');
  }

  request.post({
    url: 'https://slack.com/api/oauth.access',
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      redirect_uri: process.env.SLACK_REDIRECT_URL,
      code
    }
  }, async (err, httpResponse, body) => {
    if (err) {
      throw new Error(err);
    }

    try {
      body = JSON.parse(body);
    } catch (error) {
      throw new Error(error);
    }

    if (body && body.ok && body.access_token) {
      app.set('json spaces', 2);
      res.json({
        users: await getUserList(body.access_token)
      });
    }
  });
});

function getUserList(token) {
  if (!token) {
    throw new Error('access_token is required');
  }
  const web = new WebClient(token);

  return web.users.list();
}

app.listen(3000);