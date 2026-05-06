const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.join(__dirname, '..', 'state', 'user-accounts.json');

function loadAccounts() {
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  } catch {
    return { accounts: [] };
  }
}

function saveAccounts(data) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Look up a user's Google email by Discord user ID.
 * Returns null if the user has not completed OAuth.
 */
function getGoogleEmail(discordUserId) {
  const { accounts } = loadAccounts();
  const entry = accounts.find(a => a.discord_user_id === discordUserId);
  return entry ? entry.google_email : null;
}

/**
 * Link a Discord user ID to a Google email.
 * Updates if already exists, appends if new.
 */
function linkAccount(discordUserId, googleEmail) {
  const data = loadAccounts();
  const existing = data.accounts.findIndex(a => a.discord_user_id === discordUserId);
  const entry = {
    discord_user_id: discordUserId,
    google_email: googleEmail,
    linked_at: new Date().toISOString(),
  };
  if (existing >= 0) {
    data.accounts[existing] = entry;
  } else {
    data.accounts.push(entry);
  }
  saveAccounts(data);
}

/**
 * Check whether a Discord user ID has a linked Google account.
 */
function isLinked(discordUserId) {
  return getGoogleEmail(discordUserId) !== null;
}

module.exports = { getGoogleEmail, linkAccount, isLinked };
