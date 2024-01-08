import express from 'express'
import ejs from 'ejs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import session from 'express-session'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import mongoose from 'mongoose'
import passportLocalMongoose from 'passport-local-mongoose'
import crypto from 'crypto'
import flash from 'connect-flash'
import multer from 'multer'
import moment from 'moment'
import e from 'connect-flash'
import cors from 'cors'

var mod = function (n, m) {
  var remain = n % m
  return Math.floor(remain >= 0 ? remain : remain + m)
}

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original filename
  }
})

const upload = multer({ storage: storage })

const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex')
}

const secret = generateSecret()
const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auth')

// Configure Mongoose User Model with passport-local-mongoose
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profileImage: String,
  age: Number,
  gender: String,
  bio: String,
  marital: String,
  professional: String,
  goal: String,
  hobbies: String,
  contact: String,

  discovery: Number,
  accept: Number,
  reject: Number,

  meetingList: [
    {
      sender: String,
      receiver: String,
      location: String,
      date: Date,
      status: String
    }
  ]
})

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' })
UserSchema.index({ username: 1 })
const User = mongoose.model('User', UserSchema)

// Passport Configuration
passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Middleware
app.use(flash())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.messages = req.flash()
  next()
})

// Set EJS as the view engine
app.set('view engine', 'ejs')

// Routes
app.get('/', (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('index', { user: req.user, isAuthenticated })
})

app.get('/discover', isLoggedIn, (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('discover', { user: req.user, isAuthenticated })
})

app.get('/meet', isLoggedIn, (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('meet', {
    user: req.user,
    isAuthenticated,
    meetings: req.user.meetingList
  })
})

app.get('/edit', isLoggedIn, (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('edit', { user: req.user, isAuthenticated })
})

app.get('/newpass', (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('newpassword', { user: req.user, isAuthenticated })
})

app.get('/profile', isLoggedIn, (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('profile', { user: req.user, isAuthenticated })
})

app.get('/signup', (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('signup', { user: req.user, isAuthenticated })
})

app.get('/login', (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.render('login', { user: req.user, isAuthenticated })
})

app.post('/register', (req, res) => {
  const { username, email, password } = req.body
  let profileImage = ''
  let age = 0
  let gender = ''
  let bio = ''
  let marital = ''
  let professional = ''
  let goal = ''
  let hobbies = ''
  let discovery = 0
  let accept = 0
  let reject = 0
  let meetingList = []

  User.register(
    new User({
      username,
      email,
      profileImage,
      age,
      gender,
      bio,
      marital,
      professional,
      goal,
      hobbies,
      discovery,
      accept,
      reject,
      meetingList
    }),
    password,
    (err, user) => {
      if (err) {
        if (err.name === 'UserExistsError') {
          req.flash(
            'error',
            'User with this account name or email already exists.'
          )
        } else if (err.name === 'ValidationError') {
          req.flash('error', err.message)
        } else {
          req.flash('error', 'Failed to register. Please try again.')
        }

        return res.redirect('/signup')
      }

      passport.authenticate('local')(req, res, () => {
        res.redirect('/profile')
      })
    }
  )
})

app.post('/processlogin', (req, res, next) => {
  const { email, password } = req.body

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err)
    }

    if (!user) {
      req.flash('error', 'Invalid email or password. Please try again.')
      return res.redirect('/login')
    }

    req.logIn(user, err => {
      if (err) {
        return next(err)
      }

      return res.redirect('/profile')
    })
  })(req, res, next)
})

// Handle POST request to /updateprofile
app.post('/updateprofile', upload.single('profileImage'), async (req, res) => {
  if (!req.user) {
    return res.redirect('/login')
  }
  try {
    // Access the fields submitted in the form
    const { bio, age, gender, marital, professional, goal, hobbies, contact } =
      req.body

    // Access the uploaded profile image path
    let npath = null
    if (req.file) npath = req.file.path.slice(6)
    const profileImagePath = req.file ? npath : null

    // Get the current user's ID (assuming you have authentication middleware)
    const userId = req.user._id

    // Update user data in the database
    const updatedUserData = {
      profileImage: profileImagePath,
      age,
      gender,
      bio,
      marital,
      professional,
      goal,
      hobbies,
      contact
    }

    await User.findByIdAndUpdate(userId, updatedUserData)

    res.redirect('/profile') // Redirect to the user's profile page
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})

app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error(err)
      return res.status(500).send(err.message)
    }
    res.redirect('/')
  })
})

const authenticateUser = async (req, res, next) => {
  // Assume you have the user ID in req.user (set during authentication)
  const userId = req.user

  try {
    // Fetch the authenticated user from the database
    const authenticatedUser = await User.findById(userId)

    if (authenticatedUser) {
      req.authenticatedUser = authenticatedUser
      next()
    } else {
      res.status(404).json({ error: 'User not found' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

let savedRequestedIndex = 0
let requestedIndex = 0
let userProfile = null
app.get('/profile/:index', authenticateUser, async (req, res) => {
  try {
    requestedIndex = parseInt(req.params.index)
    const totalProfiles = await User.countDocuments()

    const authenticatedUserId = req.user
    const authenticatedUserIndex =
      (await User.countDocuments({
        _id: { $lte: authenticatedUserId }
      })) - 1

    if (authenticatedUserIndex === requestedIndex) {
      if (savedRequestedIndex > requestedIndex)
        requestedIndex = mod(requestedIndex - 1, totalProfiles)
      else requestedIndex = mod(requestedIndex + 1, totalProfiles)
    }

    // Valid index, fetch the corresponding profile
    userProfile = await User.findOne({}).skip(
      mod(requestedIndex, totalProfiles)
    )

    if (userProfile) {
      res.json({ userProfile })
    } else {
      res.status(404).json({ error: 'Profile not found' })
    }

    savedRequestedIndex = requestedIndex
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/totalProfiles', async (req, res) => {
  try {
    const totalProfiles = await User.countDocuments()
    res.json({ totalProfiles })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/authenticatedUserIndex', async (req, res) => {
  try {
    const authenticatedUserId = req.user
    const authenticatedUserIndex =
      (await User.countDocuments({
        _id: { $lte: authenticatedUserId }
      })) - 1
    res.json({ authenticatedUserIndex })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/currentId', async (req, res) => {
  try {
    res.json({ requestedIndex })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Middleware to check if the user is authenticated
function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

app.get('/checkprofile', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login')
  }
  const isAuthenticated = req.isAuthenticated()
  res.render('checkprofile', { user: userProfile, isAuthenticated })
})

app.get('/meetdetails', async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/login')
    }

    const isAuthenticated = req.isAuthenticated()
    const errorMessage = req.flash('error') // Retrieve flash errors
    res.render('meetdetails', { user: req.user, isAuthenticated, errorMessage })
  } catch (error) {
    console.error('Error rendering meetdetails:', error)
    res.status(500).send('Internal Server Error')
  }
})

app.post('/updatemeetings', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login')
  }
  try {
    req.user.meetingList = req.body.updatedMeetings

    // Save the updated user object to MongoDB
    await req.user.save()

    // Send a JSON response indicating success
    res.json({ success: true, message: 'Meetings updated successfully' })
  } catch (error) {
    console.error('Error updating meetings:', error)

    // Send a JSON response indicating an error
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
})


app.post('/propagatestatus', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login')
  }
  try {
    let other = await User.findOne({ username: req.body.otherguy });

    for (let i = 0; i < other.meetingList.length; i++) {
      let meet = other.meetingList[i];
      // Extract day, month, and year components for comparison
      let selectedDateComponents = `${meet.date.getDate()}/${
        meet.date.getMonth() + 1
      }/${meet.date.getFullYear()}`
      let meetingDateComponents = `${new Date(req.body.meeting.date).getDate()}/${
        new Date(req.body.meeting.date).getMonth() + 1
      }/${new Date(req.body.meeting.date).getFullYear()}`
      
      if (meet.sender === req.body.meeting.sender && meet.receiver === req.body.meeting.receiver && meetingDateComponents === selectedDateComponents) {
        meet.status = req.body.status;
        break;
      }
    }


    // Save the updated user object to MongoDB
    await other.save()

    // Send a JSON response indicating success
    res.json({ success: true, message: 'Propagated successfully' })
  } catch (error) {
    console.error('Error propagating:', error)

    // Send a JSON response indicating an error
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
})

app.post('/meetingrequested', async (req, res) => {
  try {
    const { location, meetDate } = req.body

    // Validation checks
    if (!locationIsValid(location)) {
      req.flash('error', 'Location cannot be empty')
      return res.redirect('/meetdetails')
    }

    if (!meetDateIsValid(meetDate)) {
      req.flash('error', 'Invalid meet date (in the past)')
      return res.redirect('/meetdetails')
    }

    const newMeet = {
      sender: req.user.username.trim(),
      receiver: userProfile.username.trim(),
      location,
      date: new Date(meetDate),
      status: 'Requested'
    }

    // Update the user's meetingList with the new meet object
    req.user.meetingList.push(newMeet)
    userProfile.meetingList.push(newMeet)

    // Save the updated user object to MongoDB
    await req.user.save()
    await userProfile.save()

    res.redirect('/meet')
  } catch (error) {
    console.error('Error processing meeting requested:', error)
    res.status(500).send('Internal Server Error')
  }
})

function meetDateIsValid (dateString) {
  try {
    const currentDate = moment()
    const selectedDate = moment(dateString)

    if (!selectedDate.isValid()) {
      return false
    }

    return selectedDate.isSameOrAfter(currentDate, 'day')
  } catch (error) {
    console.error('Error validating meet date:', error)
    return false
  }
}

function locationIsValid (location) {
  return location.trim() !== ''
}

app.get('*', (req, res) => {
  const isAuthenticated = req.isAuthenticated()
  res.status(404).render('404', { user: req.user, isAuthenticated })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
