require('dotenv').config();

const express=require('express');
const app=express();
const mongoose=require('mongoose');
const path=require('path');
const methodOverride=require('method-override');
const ejsMate=require('ejs-mate');
const session=require('express-session');
const { MongoStore } = require('connect-mongo');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const Userrouter=require('./models/user.js');


const listingsrouter=require('./routes/listing.js');
const reviewsrouter=require('./routes/review.js');
const users=require('./routes/user.js');
const {
    flashMessages,
    setResponseLocals,
    handleNotFound,
    handleErrors,
} = require('./middleware.js');

// Prefer Atlas / explicit URL from .env, then fall back to local MongoDB.
const db_URL = process.env.ATLASDB_URL
    || process.env.MONGO_URL
    || 'mongodb://localhost:27017/fresh_haven';

if (!db_URL) {
    throw new Error('No database connection URL is configured.');
}

async function main() {
    await mongoose.connect(db_URL);
}
  
// Configure EJS views, form parsing, method override, and static files.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.currentUser = null;
    res.locals.success = [];
    res.locals.error = [];
    res.locals.mapboxToken = process.env.MAPBOX_TOKEN || process.env.MAP_token || '';
    next();
});

const store = MongoStore.create({
    mongoUrl: db_URL,
    collectionName: 'sessions',
    touchAfter: 24 * 60 * 60,
});

// Store user session data in an encrypted session cookie.
const sessionOptions = {
    secret: process.env.SECRET_KEY || 'defaultSecretKey',
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
};

app.use(session(sessionOptions));

// Enable one-time success and error messages stored in the session.
app.use(flashMessages);

app.use(passport.initialize());
app.use(passport.session());
// Configure Passport to use the User model's local strategy.
passport.use(new LocalStrategy(Userrouter.authenticate()));
passport.serializeUser(Userrouter.serializeUser());
passport.deserializeUser(Userrouter.deserializeUser());

// Make flash messages and authentication state available in every EJS view.
app.use(setResponseLocals);

// Mount listing and review routers after session and flash middleware.
app.use('/listings', listingsrouter);
app.use('/listings', reviewsrouter );
app.use('/users', users);

// Public informational and health-check pages.
// Home page route.
app.get('/',(req,res)=>{
    res.send('hi i am running on port 8000  ');
}  );

app.get('/privacy', (req, res) => {
    res.render('privacy');
});

app.get('/terms', (req, res) => {
    res.render('terms');
});

// Chrome requests this file automatically while DevTools is open.
// Return 204 so that request does not reach the application's 404 handler.
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.sendStatus(204);
});


// Handle unmatched URLs and route errors after all routes.
app.use(handleNotFound);
app.use(handleErrors);

main()
    .then(() => {
        console.log('connected to database');
        app.listen(8000, () => {
            console.log('server is running on port 8000');
        });
    })
    .catch((err) => {
        console.error('Unable to connect to database:', err.message);
        process.exitCode = 1;
    });