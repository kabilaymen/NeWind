var mod = function (n, m) {
  var remain = n % m
  return Math.floor(remain >= 0 ? remain : remain + m)
}

let currentProfileIndex = 0
let totalProfiles = 0
let authenticatedUserIndex = 0

async function fetchTotalProfiles () {
  try {
    const response = await fetch('/totalProfiles')
    const data = await response.json()

    if (response.ok) {
      totalProfiles = data.totalProfiles
    } else {
      console.error(data.error)
    }
  } catch (error) {
    console.error(error)
  }
}

async function fetchTotalAuthId () {
  try {
    const response = await fetch('/authenticatedUserIndex')
    const data = await response.json()

    if (response.ok) {
      authenticatedUserIndex = data.authenticatedUserIndex
    } else {
      console.error(data.error)
    }
  } catch (error) {
    console.error(error)
  }
}

let currentId = -1
async function fetchCurrentId () {
  try {
    const response = await fetch('/currentId')
    const data = await response.json()

    if (response.ok) {
      currentId = data.requestedIndex
    } else {
      console.error(data.error)
    }
  } catch (error) {
    console.error(error)
  }
}

async function showProfile (index) {
  const profileName = document.querySelector('.name')
  const profileInfo = document.querySelector('.description')
  const profileImage = document.querySelector('.avatar-holder img')

  try {
    // Fetch a specific profile by index from the server
    const response = await fetch(`/profile/${index}`)
    const data = await response.json()

    if (response.ok) {
      const userProfile = data.userProfile

      // Update the profile card with the fetched data
      profileImage.src = '/images/default.png'
      if (userProfile.profileImage) profileImage.src = userProfile.profileImage

      profileName.textContent = `${userProfile.username} (${userProfile.gender}${userProfile.age})`
      profileInfo.textContent = userProfile.bio
    } else {
      // Handle error response
      console.error(data.error)
    }
  } catch (error) {
    console.error(error)
  }
}

async function showNextProfile () {
  const test = mod(currentProfileIndex + 1, totalProfiles)
  if (test === authenticatedUserIndex)
    currentProfileIndex = mod(currentProfileIndex + 2, totalProfiles)
  else currentProfileIndex = test
  await showProfile(currentProfileIndex)
}

async function showPreviousProfile () {
  const test = mod(currentProfileIndex - 1, totalProfiles)
  if (test === authenticatedUserIndex)
    currentProfileIndex = mod(currentProfileIndex - 2, totalProfiles)
  else currentProfileIndex = test
  await showProfile(currentProfileIndex)
}

// Initial setup
fetchTotalAuthId()
fetchTotalProfiles()

let prg = document.querySelectorAll('.progress')

for (let i = 0; i < prg.length; i++) {
  let ele = prg[i]
  let bar = ele.querySelector('.bar')
  let val = ele.querySelector('span')
  var perc = parseInt(val.textContent)

  bar.animate(
    { transform: ['rotate(45deg)', 'rotate(' + (45 + perc * 1.8) + 'deg)'] },
    1000
  )
  bar.style.transform = 'rotate(' + (45 + perc * 1.8) + 'deg)'
}

function readmore () {
  let ele = document.querySelector('.text')
  ele.classList.toggle('show')
}

document.querySelector('.profile .log').onclick = function () {
  location.href = 'login'
}

document.querySelector('.escape').onclick = function () {
  location.href = 'logout'
}

let val = document.querySelector('.search')
function doesntMatch (part, ele) {
  let text1 = part.toLowerCase().trim()
  let text2 = ele.textContent.toLowerCase().trim()
  let x = text1.length
  if (x > text2.length) x = text2.length
  for (let i = 0; i < x; i++) {
    if (text1[i] !== text2[i]) return true
  }
  return text2.length < text1.length
}
let bin = []

if (val)
  val.oninput = function () {
    let elements = document.querySelectorAll('.card4 table tr')
    for (let i = 0; i < elements.length; i++) {
      let ele = elements[i]
      if (!bin.includes(ele)) ele.style.display = 'table-row'
      let parts = val.value.split(':')
      if (doesntMatch(parts[0], ele.querySelector('.personName'))) {
        ele.style.display = 'none'
      }
      if (parts.length > 1) {
        if (doesntMatch(parts[1], ele.querySelector('.status')))
          ele.style.display = 'none'
      }
    }
  }

let selected = null
const updateMeetView = () => {
  let elements = document.querySelectorAll('.card4 table tr')
  for (let i = 0; i < elements.length; i++) {
    let ele = elements[i]
    // ele.style.display = 'table-row'

    let st = ele.querySelector('.status')
    st.classList.value = ''
    st.classList.add('status')
    st.classList.add(st.textContent.toLocaleLowerCase())

    ele.onclick = function () {
      if (selected === null) {
        selected = this
        this.classList.toggle('selected')
      } else {
        if (selected === this) {
          selected = null
          this.classList.toggle('selected')
        } else {
          selected.classList.toggle('selected')
          selected = this
          this.classList.toggle('selected')
        }
      }
    }
  }
}

let acc = document.querySelector('.accept')
let rej = document.querySelector('.reject')
let rev = document.querySelector('.revert')

if (rej)
  rej.onclick = function () {
    if (selected !== null) {
      selected.style.display = 'none'
      bin.push(selected)
      selected.classList.toggle('selected')
      selected = null
    }
  }
if (rev)
  rev.onclick = function () {
    if (bin.length > 0) bin.pop().style.display = 'table-row'
  }

function changeContent (i) {
  var userDataElement = document.getElementById('userData')
  var userData = JSON.parse(userDataElement.getAttribute('data-user'))
  let content = document.querySelector('.content')
  switch (i) {
    case 1:
      content.textContent = userData.marital
      break
    case 2:
      content.textContent = userData.professional
      break
    case 3:
      content.textContent = userData.goal
      break
    case 4:
      content.textContent = userData.hobbies
      break
    case 5:
      content.textContent = userData.contact
      break
    default:
      content.textContent = 'Click to discover more...'
      break
  }
}

function getBack () {
  location.href = 'discover'
}

///////////////////////////////////////////////////////////////////////////////////
function lookFor (row) {
  var userDataElement = document.getElementById('userData')
  var userData = JSON.parse(userDataElement.getAttribute('data-user'))
  var userMeetingsElement = document.getElementById('meetingsData')
  var userMeetings = JSON.parse(
    userMeetingsElement.getAttribute('data-meetings')
  )

  let selectedName = row.querySelector('.personName').textContent.trim()
  let selectedLocation = row.querySelector('.location').textContent.trim()
  let selectedDate = new Date(row.querySelector('.date').textContent)
  let selectedStatus = row.querySelector('.status').textContent.trim()

  let selectedMeeting = userMeetings.find(meeting => {
    let isSenderMatch =
      meeting.sender.trim() === selectedName.trim() &&
      meeting.receiver.trim() === userData.username.trim()
    let isReceiverMatch =
      meeting.receiver.trim() === selectedName.trim() &&
      meeting.sender.trim() === userData.username.trim()
    // Extract day, month, and year components for comparison
    let selectedDateComponents = `${selectedDate.getDate()}/${
      selectedDate.getMonth() + 1
    }/${selectedDate.getFullYear()}`
    let meetingDateComponents = `${new Date(meeting.date).getDate()}/${
      new Date(meeting.date).getMonth() + 1
    }/${new Date(meeting.date).getFullYear()}`

    return (
      (isSenderMatch || isReceiverMatch) &&
      selectedLocation.trim() === meeting.location.trim() &&
      selectedDateComponents === meetingDateComponents &&
      selectedStatus.trim() === meeting.status.trim()
    )
  })

  return selectedMeeting || null
}

function propagateStatus (otherguy, meeting, status) {
  fetch('/propagatestatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otherguy, meeting, status })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Propagation successful')
      } else {
        console.error(data.message || 'Failed to propagate')
      }
    })
    .catch(error => console.error('Error propagating:', error))
}

async function updateMeetings (savedMeetObjects) {
  await fetch('/updatemeetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updatedMeetings: savedMeetObjects })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Meetings updated successfully')
      } else {
        console.error(data.message || 'Failed to update meetings')
      }
    })
    .catch(error => console.error('Error updating meetings:', error))
}

if (acc)
  acc.onclick = async function () {
    var userDataElement = document.getElementById('userData')
    var userData = JSON.parse(userDataElement.getAttribute('data-user'))

    if (selected) {
      const sent = lookFor(selected).sender.trim() === userData.username.trim()
      if (sent) {
        alert('You should not be the one to accept...')
      } else {
        const allRows = document.querySelectorAll('.card4 table tr')
        let savedMeetObjects = []

        for (let i = 0; i < allRows.length; i++) {
          const row = allRows[i]
          let testing = lookFor(row).sender.trim() === userData.username.trim()
          let statusValue = row.querySelector('.status').textContent
          if (selected === row) {
            statusValue = 'Ongoing'
            propagateStatus(
              row.querySelector('.personName').textContent.trim(),
              lookFor(row),
              'Ongoing'
            )
          }

          let sender = testing
            ? userData.username.trim()
            : row.querySelector('.personName').textContent.trim()
          let receiver = !testing
            ? userData.username.trim()
            : row.querySelector('.personName').textContent.trim()

          savedMeetObjects.push({
            sender: sender.trim(),
            receiver: receiver.trim(),
            location: row.querySelector('.location').textContent.trim(),
            date: new Date(row.querySelector('.date').textContent),
            status: statusValue.trim()
          })
        }

        await updateMeetings(savedMeetObjects)
        location.href = 'meet'
      }

      selected.classList.toggle('selected')
      selected = null
    } else {
      // Save all
      const confirmed = window.confirm(
        'Are you sure you want to update the meetings?'
      )

      if (confirmed) {
        const allRows = document.querySelectorAll('.card4 table tr')
        let savedMeetObjects = []

        for (let i = 0; i < allRows.length; i++) {
          const row = allRows[i]
          let testing = lookFor(row).sender.trim() === userData.username.trim()
          const beenCancelled = row.style.display === 'none'
          let statusValue = row.querySelector('.status').textContent.trim()

          if (beenCancelled) {
            if (statusValue === 'Cancelled' || statusValue === 'Done') continue
            else {
              statusValue = 'Cancelled'
              propagateStatus(
                row.querySelector('.personName').textContent.trim(),
                lookFor(row),
                'Cancelled'
              )
            }
          }

          let sender = testing
            ? userData.username.trim()
            : row.querySelector('.personName').textContent.trim()
          let receiver = !testing
            ? userData.username.trim()
            : row.querySelector('.personName').textContent.trim()

          savedMeetObjects.push({
            sender: sender.trim(),
            receiver: receiver.trim(),
            location: row.querySelector('.location').textContent.trim(),
            date: new Date(row.querySelector('.date').textContent),
            status: statusValue.trim()
          })
        }

        await updateMeetings(savedMeetObjects)
        location.href = 'meet'
      }
    }
  }

async function updateStatuses () {
  var userDataElement = document.getElementById('userData')
  var userData = JSON.parse(userDataElement.getAttribute('data-user'))

  const allRows = document.querySelectorAll('.card4 table tr')
  let savedMeetObjects = []

  let flagged = false
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    let testing = lookFor(row).sender.trim() === userData.username.trim()

    let statusValue = row.querySelector('.status').textContent
    let dateValue = new Date(row.querySelector('.date').textContent)

    let now = new Date()
    if (dateValue < now) {
      if (statusValue !== 'Done') flagged = true
      statusValue = 'Done'
    }

    let sender = testing
      ? userData.username.trim()
      : row.querySelector('.personName').textContent.trim()
    let receiver = !testing
      ? userData.username.trim()
      : row.querySelector('.personName').textContent.trim()

    savedMeetObjects.push({
      sender: sender.trim(),
      receiver: receiver.trim(),
      location: row.querySelector('.location').textContent.trim(),
      date: dateValue,
      status: statusValue.trim()
    })
  }

  await updateMeetings(savedMeetObjects)
  if (flagged) location.href = 'meet'
}
