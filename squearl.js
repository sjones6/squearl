const axios = require('axios');
const colors = require('ansi-colors');
const { prompt, Password } = require('enquirer');
const twitter = require('twitter-text');
const { Date: SDate } = require('sugar');
const format = require('date-fns/format');
const isAfter = require('date-fns/isAfter');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE_URL = process.env.SQUEARL_URL || 'https://squearl.com/api';
const CREDENTIAL_PATH = path.join(os.homedir(), '.squearl');

function loadCredentialsOrThrow() {
  if (!fs.existsSync(CREDENTIAL_PATH)) {
    console.error(colors.red(`You are not logged in.`));
    process.exit(1);
  }
  const keyLine = fs.readFileSync(CREDENTIAL_PATH, 'utf-8').split('\n').find(line => line.includes('SECRET_KEY'));
  if (!keyLine) {
    console.error(colors.red(`You are not logged in.`));
    process.exit(1);
  }
  const [, token] = keyLine.split('=');
  if (!token || !token.trim()) {
    console.error(colors.red(`You are not logged in.`));
    process.exit(1);
  }
  return token;
}

module.exports.schedule = async function schedule(previous) {
  const authToken = loadCredentialsOrThrow();

  const { tweet, scheduled_at } = await prompt([
    {
      type: 'input',
      name: 'tweet',
      header: previous ? `${colors.blue('replying to')} ${previous.tweet}` : '',
      message: 'What do you want to say?',
      validate: (input) => {
        const { weightedLength } = twitter.parseTweet(input);
        return weightedLength > 0 && weightedLength < 280;
      },
      footer: ({ input }) => {
        const { weightedLength } = twitter.parseTweet(input);
        const msg = `(${weightedLength}/280)`
        return weightedLength > 280 
          ? colors.red(msg)
          : weightedLength > 260
            ? colors.yellow(msg)
            : msg;
      }
    },
    {
      type: 'input',
      name: 'scheduled_at',
      initial: previous ? format(new Date(previous.scheduled_at), 'EEEE MMMM do, yyyy h:mm aaa') : undefined,
      message: 'When do you want to send this?',
      footer: ({ input }) => {
        if (!input) {
          return '';
        }
        try {
          const d = SDate.create(input, {
            future: true
          });
          return d ? format(d, 'EEEE MMMM do, yyyy h:mm aaa') : '';
        } catch (err) {
          /* swallow */
          return '';
        }
      },
      validate: (input) => {
        try {
          const d = SDate.create(input, {
            future: true
          });
          const comparison = previous ? new Date(previous.scheduled_at) : new Date();
          return isAfter(d, comparison) || d.getTime() === comparison.getTime();
        } catch (err) {
          /* swallow */
          return false;
        }
      },
      result: (input) => {
        try {
          return SDate.create(input, {
            future: true
          });
        } catch (err) {
          /* swallow */
          return '';
        }
      }
    }
  ]);

  await axios.post(`${BASE_URL}/v1/schedule/tweet.json`, {
    tweet,
    scheduled_at: scheduled_at.getTime(),
    reply_to_id: previous ? previous.id : undefined
  }, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
    .then(async (res) => {
      console.log(colors.green('tweet scheduled!'));

      const response = await prompt({
        type: 'select',
        name: 'next',
        message: 'what next?',
        initial: 0,
        choices: [
          { name: 'thread', message: 'add to thread',  value: 'thread' },
          { name: 'new', message: 'new tweet', value: 'new' },
          { name: 'quit',  message: 'quit',  value: 'quit' } 
        ]
      });
      switch (response.next) {
        case 'new':
          return schedule();
        case 'thread':
          return schedule(res.data);
        default:
          console.log(colors.blue('\nbye!\n'));
          process.exit(0);
      }
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}


module.exports.login = async function login() {
  const skPrompt = new Password({
    name: 'secret_key',
    message: 'What is your secret key?'
  });
  const secretKey = await skPrompt.run();

  const { data } = await axios.get(`${BASE_URL}/v1/whoami.json`, {
    headers: {
      Authorization: `Bearer ${secretKey.trim()}`
    }
  }).catch(err => {
    console.log(err);
    console.error(colors.red(`Secret key rejected`));
    process.exit(1);
  });
  fs.writeFileSync(CREDENTIAL_PATH, `SECRET_KEY=${secretKey}`);
  console.log(colors.green(`You are logged in as @${data.twitter_handle}`));
}

module.exports.logout = async function logout() {
  loadCredentialsOrThrow();
  fs.unlinkSync(CREDENTIAL_PATH);
  console.log(colors.blue(`You are logged out.`));
}

module.exports.whoami = async function login() {
  const { data } = await axios.get(`${BASE_URL}/v1/whoami.json`, {
    headers: {
      Authorization: `Bearer ${loadCredentialsOrThrow()}`
    }
  }).catch(err => {
    console.error(colors.red(`request failed`));
    process.exit(1);
  });
  console.log(colors.green(`You are logged in as @${data.twitter_handle}`));
}