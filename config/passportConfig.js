const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const accountService = require('./services/accountService');

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await accountService.login(username, password);
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await accountService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
