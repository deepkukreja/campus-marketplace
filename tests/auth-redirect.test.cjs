const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const js = name => fs.readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');

function runRootCallback(hash) {
  let redirected = null;
  const context = {
    window: {
      location: {
        href: `http://127.0.0.1:5500/index.html${hash}`,
        hash,
        replace(url) { redirected = url; }
      }
    },
    URL,
    URLSearchParams
  };
  vm.runInNewContext(js('auth-link-error.js'), context);
  return redirected;
}

test('Supabase error returned to site root goes to login with error code preserved', () => {
  const url = runRootCallback('#error=access_denied&error_code=otp_expired&error_description=Email+link+expired');
  assert.ok(url);
  assert.ok(url.startsWith('http://127.0.0.1:5500/pages/login.html#'));
  assert.equal(new URLSearchParams(new URL(url).hash.slice(1)).get('error_code'), 'otp_expired');
});

test('normal home visit does not redirect', () => {
  assert.equal(runRootCallback(''), null);
});

test('signup and resend use same origin and exact login callback URL', async () => {
  let signUpArgs;
  let resendArgs;
  const client = {auth: {
    signUp: async args => { signUpArgs = args; return { data: { user: {} }, error: null }; },
    resend: async args => { resendArgs = args; return { data: {}, error: null }; }
  }};
  const context = {
    URL,
    window: {
      location: {
        href: 'http://127.0.0.1:5500/pages/signup.html',
        pathname: '/pages/signup.html',
        origin: 'http://127.0.0.1:5500',
        search: ''
      },
      CampusSupabase: { client, configured: true }
    },
    document: { addEventListener() {} }
  };
  vm.runInNewContext(js('auth.js'), context);
  await context.window.CampusAuth.signUp({
    email:'person@bmu.edu.in', password:'Example$112233', fullName:'Person', department:'ECOM', academicYear:'2nd Year'
  });
  await context.window.CampusAuth.resendConfirmation('person@bmu.edu.in');
  assert.equal(signUpArgs.options.emailRedirectTo, 'http://127.0.0.1:5500/pages/login.html');
  assert.equal(resendArgs.options.emailRedirectTo, signUpArgs.options.emailRedirectTo);
  assert.equal(resendArgs.type, 'signup');
  assert.equal(resendArgs.email, 'person@bmu.edu.in');
});
