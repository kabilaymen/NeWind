import express from 'express';
import ejs from 'ejs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import crypto from 'crypto';
import flash from 'connect-flash';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const secret = generateSecret();
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auth');

// Configure Mongoose User Model with passport-local-mongoose
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    profileImage: String,
    age: Number,
    bio: String,
    marital: String,
    professional: String,
    goal: String,
    hobbies: String,
    contact: String,
    
    discovery: Number,
    accept: Number,
    reject: Number
});

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
const User = mongoose.model('User', UserSchema);

// Passport Configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware
app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

app.get('/discover', isLoggedIn, (req, res) => {
    res.render('discover', { user: req.user });
});

app.get('/meet', isLoggedIn, (req, res) => {
    res.render('meet', { user: req.user });
});

app.get('/edit', isLoggedIn, (req, res) => {
    res.render('edit', { user: req.user });
});

app.get('/newpass', (req, res) => {
    res.render('newpassword', { user: req.user });
});

app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', { user: req.user });
});

app.get('/signup', (req, res) => {
    res.render('signup', { user: req.user });
});

app.get('/login', (req, res) => {
    res.render('login', { user: req.user });
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    let profileImage = "";
    let age = 0;
    let bio = "";
    let marital = "";
    let professional = "";
    let goal = "";
    let hobbies = "";
    let discovery = 0;
    let accept = 0;
    let reject = 0;

    User.register(new User({ username, email, profileImage, age, bio, marital, professional, goal, hobbies, discovery, accept, reject }), password, (err, user) => {
        if (err) {
            if (err.name === 'UserExistsError') {
                req.flash('error', 'User with this account name or email already exists.');
            } else if (err.name === 'ValidationError') {
                req.flash('error', err.message);
            } else {
                req.flash('error', 'Failed to register. Please try again.');
            }

            return res.redirect('/signup');
        }

        passport.authenticate('local')(req, res, () => {
            res.redirect('/profile');
        });
    });
});

app.post('/processlogin', (req, res, next) => {
    const { email, password } = req.body;

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            req.flash('error', 'Invalid email or password. Please try again.');
            return res.redirect('/login');
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            
            return res.redirect('/profile');
        });
    })(req, res, next);
});

// Handle POST request to /updateprofile
app.post('/updateprofile', upload.single('profileImage'), async (req, res) => {
    try {
        // Access the fields submitted in the form
        const { bio, marital, professional, goal, hobbies, contact } = req.body;

        // Access the uploaded profile image path
        const profileImagePath = req.file ? req.file.path : null;

        // Get the current user's ID (assuming you have authentication middleware)
        const userId = req.user._id;

        // Update user data in the database
        const updatedUserData = {
            profileImage : profileImagePath,
            bio,
            marital,
            professional,
            goal,
            hobbies,
            contact
        };

        await User.findByIdAndUpdate(userId, updatedUserData);

        res.redirect('/profile'); // Redirect to the user's profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send(err.message);
        }
        res.redirect('/');
    });
});

// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get('*', (req, res) => {
    res.status(404).render('404', { user: req.user });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});