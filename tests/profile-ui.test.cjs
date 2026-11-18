const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('profile page does not claim email confirmation is disabled', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'pages', 'profile.html'), 'utf8');
  assert.doesNotMatch(html, /Email confirmation is temporarily disabled/);
  assert.match(html, /id="profile-name"/);
  assert.match(html, /id="profile-edit-panel"/);
});
