require('dotenv').config();
const {
  ManagementClient
} = require('auth0');
const request = require('request');

// find user and get token by node ManagementClient
function getToken({
  email,
  provider
}, cb) {
  if (!email) {
    return cb('Email is required');
  }

  if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
    return cb('Please check env vars');
  }

  const management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: process.env.AUTH0_SCOPE
  });

  management.users.getByEmail(email).then(users => {
    parseUsers(users, provider, cb);
  }).catch(cb);
}

// find user and get token manually using Management API
function getTokenManual({
  email,
  provider
}, cb) {
  const options = {
    method: 'POST',
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: {
      'content-type': 'application/json'
    },
    body: {
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE
    },
    json: true
  };

  request(options, (error, response, body) => {
    if (error) {
      throw new Error(error);
    }

    const options = {
      method: 'GET',
      url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users-by-email?email=${email}`,
      headers: {
        authorization: `Bearer ${body.access_token}`,
        'content-type': 'application/json'
      }
    };
    // TODO: use promise, waterfall, etc...
    request(options, (error, response, body) => {
      if (error) {
        throw new Error(error)
      };
      const users = JSON.parse(body)
      parseUsers(users, provider, cb);
    });
  });
}

function parseUsers(users, provider, cb) {
  if (!users || !users.length) {
    return cb('User not found');
  }

  if (!provider) {
    try {
      return cb(null, users[0].identities[0]);
    } catch (error) {
      return cb('Token not found');
    }
  }

  let identity;
  users.some(user => identity = user.identities.find(id => id.provider === provider));

  if (identity) {
    return cb(null, identity);
  }
}

/**
 * Providers list:
 *
  amazon: 'Amazon',
  aol: 'Aol',
  baidu: '百度',
  bitbucket: 'Bitbucket',
  box: 'Box',
  dropbox: 'Dropbox',
  dwolla: 'Dwolla',
  ebay: 'ebay',
  exact: 'Exact',
  facebook: 'Facebook',
  fitbit: 'Fitbit',
  github: 'GitHub',
  'google-openid': 'Google OpenId',
  'google-oauth2': 'Google',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  miicard: 'miiCard',
  paypal: 'PayPal',
  'paypal-sandbox': 'PayPal Sandbox',
  planningcenter: 'Planning Center',
  renren: '人人',
  salesforce: 'Salesforce',
  'salesforce-community': 'Salesforce Community',
  'salesforce-sandbox': 'Salesforce (sandbox)',
  evernote: 'Evernote',
  'evernote-sandbox': 'Evernote (sandbox)',
  shopify: 'Shopify',
  soundcloud: 'Soundcloud',
  thecity: 'The City',
  'thecity-sandbox': 'The City (sandbox)',
  thirtysevensignals: '37 Signals',
  twitter: 'Twitter',
  vkontakte: 'vKontakte',
  windowslive: 'Microsoft Account',
  wordpress: 'Wordpress',
  yahoo: 'Yahoo!',
  yammer: 'Yammer',
  yandex: 'Yandex',
  weibo: '新浪微博'


  enterprise:

  ad: 'AD / LDAP',
  adfs: 'ADFS',
  'auth0-adldap': 'AD/LDAP',
  'auth0-oidc': 'Auth0 OpenID Connect',
  custom: 'Custom Auth',
  'google-apps': 'Google Apps',
  ip: 'IP Address',
  mscrm: 'Dynamics CRM',
  office365: 'Office365',
  pingfederate: 'Ping Federate',
  samlp: 'SAML',
  sharepoint: 'SharePoint Apps',
  waad: 'Windows Azure AD'
 *
 */

getToken({
  email: 'example@email.com',
  provider: 'google-oauth2'
}, (err, token) => {
  console.log('err: ', err);
  console.log('token: ', token.access_token);
});

module.exports = getToken;
