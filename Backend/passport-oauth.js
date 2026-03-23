const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const router = express.Router();

const Company = require('./models/Company');
const Student = require('./models/Student');
const TPO     = require('./models/Admin');


const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET     = 'changeme',
  CLIENT_ORIGIN  = 'http://127.0.0.1:5500',
  CALLBACK_BASE  = 'http://localhost:5000',
} = process.env;

router.use(passport.initialize());

/* ================================================================
   HELPER: find or create user
   - Student: only save email + name (rest collected on complete-profile page)
   - Company/TPO: save with defaults
   ================================================================ */
async function findOrCreateOAuthUser(profile, provider, role) {
  const email =
    (profile.emails && profile.emails[0]?.value) ||
    `${profile.id}@${provider}.oauth`;

  const displayName = profile.displayName || profile.username || 'User';
  const avatarUrl   = profile.photos?.[0]?.value || '';

  const models = { company: Company, student: Student, tpo: TPO };
  const Model  = models[role];
  if (!Model) throw new Error(`Unknown role: ${role}`);

  // Check if user already exists
  let user = await Model.findOne({
    $or: [{ email }, { oauthId: profile.id, oauthProvider: provider }]
  });

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const baseFields = {
      email,
      oauthId:       profile.id,
      oauthProvider: provider,
      avatarUrl,
      isOAuth:       true,
      isVerified:    true,
    };

    if (role === 'student') {
      // Only save what Google provides — rest filled on complete-profile page
      user = await Model.create({
        ...baseFields,
        fullName: displayName,
      });

    } else if (role === 'company') {
      user = await Model.create({
        ...baseFields,
        companyName:  displayName,
        hrContact:    displayName,
        industry:     'Other',
        headquarters: 'Not set',
        hiringRoles:  [],
        password:     null,
      });

    } else if (role === 'tpo') {
      user = await Model.create({
        ...baseFields,
        name:     displayName,
        college:  'Not set',
        password: null,
      });
    }
  }

  return { user, isNewUser };
}

/* ================================================================
   GOOGLE STRATEGY
   ================================================================ */
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:          GOOGLE_CLIENT_ID,
      clientSecret:      GOOGLE_CLIENT_SECRET,
      callbackURL:       `${CALLBACK_BASE}/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state || 'student';
        const { user, isNewUser } = await findOrCreateOAuthUser(profile, 'google', role);
        done(null, { user, role, isNewUser });
      } catch (err) {
        done(err);
      }
    }
  ));
} else {
  console.warn('⚠️ Google OAuth credentials missing. Google Login will not work.');
}


/* ================================================================
   ROUTES
   ================================================================ */

// Initiate Google OAuth
router.get('/auth/google', (req, res, next) => {
  const role = req.query.role || 'student';
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    state:   role,
    session: false,
  })(req, res, next);
});

// Google callback
router.get('/auth/google/callback',
  passport.authenticate('google', {
    session:         false,
    failureRedirect: `${CLIENT_ORIGIN}/pages/Signup.html?oauthError=google`,
  }),
  (req, res) => sendOAuthRedirect(req, res)
);

/* ================================================================
   REDIRECT LOGIC:
   - New student     → complete-profile page (fill academic details once)
   - Returning user  → straight to dashboard
   - Company / TPO   → straight to dashboard
   ================================================================ */
function sendOAuthRedirect(req, res) {
  try {
    const { user, role, isNewUser } = req.user;

    const token = jwt.sign(
      { id: user._id, role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const name  = encodeURIComponent(user.companyName || user.fullName || user.name || user.email);
    const email = encodeURIComponent(user.email);
    const id    = user._id.toString();

    // New student → complete profile first (only happens once)
    if (role === 'student' && isNewUser) {
      const redirectUrl =
        `${CLIENT_ORIGIN}/Frontend/pages/student-complete-profile.html` +
        `?token=${token}&role=${role}&name=${name}&email=${email}&id=${id}`;
      return res.redirect(redirectUrl);
    }

    // Everyone else → oauth-callback → dashboard
    const redirectUrl =
      `${CLIENT_ORIGIN}/Frontend/pages/oauth-callback.html` +
      `?token=${token}&role=${role}&name=${name}&email=${email}&id=${id}`;

    res.redirect(redirectUrl);

  } catch (err) {
    console.error('OAuth redirect error:', err);
    res.redirect(`${CLIENT_ORIGIN}/pages/Signup.html?oauthError=server`);
  }
}

module.exports = router;