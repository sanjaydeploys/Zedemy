const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/auth');
const { sendWelcomeEmail } = require('./mailer');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
}, async (req, token, tokenSecret, profile, done) => {
    console.log('GoogleStrategy callback executed');
    try {
        let user = await User.getUserByGoogleId(profile.id);
        if (!user) {
            const userId = Date.now().toString();
            user = {
                userId: userId,
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                password: '',  // Empty password for Google users
                role: 'user',
                policyAccepted: false
            };
            await User.createUser(user);
            console.log('New user created:', user);
        }

        const payload = {
            user: {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };

        const jwtToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
        user.token = jwtToken;

        console.log('Generated JWT token:', jwtToken);
        sendWelcomeEmail({ email: user.email, name: user.name }, req);

        return done(null, { ...payload.user, token: jwtToken });
    } catch (err) {
        console.error('Error in GoogleStrategy:', err);
        return done(err, false);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user with id:', id);
    try {
        const user = await User.getUserById(id);
        if (!user) return done(null, false);

        done(null, {
            id: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.token || null
        });
    } catch (err) {
        console.error('Error deserializing user:', err);
        done(err, null);
    }
});

module.exports = passport;
