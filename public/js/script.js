let prg = document.querySelectorAll('.progress')

for (let i = 0; i < prg.length; i++) {
  let ele = prg[i]
  let bar = ele.querySelector('.bar')
  let val = ele.querySelector('span')
  var perc = parseInt(val.textContent)

  bar.animate(
    { transform: ['rotate(45deg)', 'rotate(' + (45 + perc * 1.8) + ')'] },
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

let elements = document.querySelectorAll('.card4 table tr')
let selected = null
for (let i = 0; i < elements.length; i++) {
  let ele = elements[i]
  ele.querySelector('span').classList.toggle('pending')
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

let val = document.querySelector('.search')
function doesntMatch (part, ele) {
  let text1 = part.toLowerCase()
  let temp = ele.textContent.split(': ')
  let text2 = temp[temp.length - 1].toLowerCase()
  for (let i = 0; i < Math.min(text1.length, text2.length); i++) {
    if (text1[i] !== text2[i]) return true
  }
  return false
}
let bin = []
val.oninput = function () {
  for (let i = 0; i < elements.length; i++) {
    let ele = elements[i]
    if (!bin.includes(ele)) ele.style = 'display:table-row;'
    let parts = val.value.split(':')
    if (doesntMatch(parts[0], ele.querySelector('.firstly')))
      ele.style = 'display:none;'
    if (parts.length > 1) {
      if (doesntMatch(parts[1], ele.querySelector('.secondary')))
        ele.style = 'display:none;'
    }
  }
}

let acc = document.querySelector('.accept')
let rej = document.querySelector('.reject')
let rev = document.querySelector('.revert')

rej.onclick = function () {
  if (selected !== null) {
    selected.style = 'display:none;'
    bin.push(selected)
    selected.classList.toggle('selected')
    selected = null
  }
}
rev.onclick = function () {
  if (bin.length > 0) bin.pop().style = 'display: table-row;'
}


function changeContent(i) {
    var userDataElement = document.getElementById('userData');
    var userData = JSON.parse(userDataElement.getAttribute('data-user'));
    let content = document.querySelector(".content");
    switch(i) {
        case 1: content.textContent = userData.marital; break;
        case 2: content.textContent = userData.professional; break;
        case 3: content.textContent = userData.goal; break;
        case 4: content.textContent = userData.hobbies; break;
        case 5: content.textContent = userData.contact; break;
        default: console.log("Mismatch");  break;
    }
}