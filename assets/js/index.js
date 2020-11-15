// Client ID and API key from the Developer Console
let CLIENT_ID = '844656831424-3h716e29vavgfkbcuhf5deknvj8p71vs.apps.googleusercontent.com';
let API_KEY = 'AIzaSyC0qAyS1Hk-gey09sL5b37AJC4El2Em4MA';

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
let SCOPES = `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send`;

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function (error) {
    console.error(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('main').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    getMessagesId();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    document.getElementById('main').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn({
      scope: "https://mail.google.com/ https://www.googleapis.com/auth/gmail.addons.current.message.action https://www.googleapis.com/auth/gmail.addons.current.message.metadata https://www.googleapis.com/auth/gmail.addons.current.message.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.readonly"
    })
    .then(function () {
      console.log("Sign-in successful");
      getMessagesId();
    })
    .then(loadClient)
    .catch((err) => {
      console.error("Error signing in", err);
    });
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

function loadClient() {
  gapi.client.setApiKey(API_KEY);
  return gapi.client.load("https://gmail.googleapis.com/$discovery/rest?version=v1")
    .then(function () {
        console.log("GAPI client loaded for API");
      },
      function (err) {
        console.error("Error loading GAPI client for API", err);
      });
}

// Make sure the client is loaded and sign-in is complete before calling this method.
function getMessagesId() {
  gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'labelIds': 'INBOX',
    'maxResults': 10
  }).then(function (response) {
    response.result.messages.forEach(obj => {
      getMessage(obj.id);
    });
    document.getElementById('loading').style.display = 'none';
  }).catch(err => {
    console.error(err);
  });
}

function getMessage(msgId) {
  gapi.client.gmail.users.messages.get({
    'userId': 'me',
    'id': msgId,
  }).then(function (response) {
    let data = response.result.payload
    let from = data.headers.filter(obj => {
      if (obj.name == 'From') {
        return obj;
      }
    });
    let subject = data.headers.filter(obj => {
      if (obj.name == 'Subject') {
        return obj;
      }
    });
    let date = data.headers.filter(obj => {
      if (obj.name == 'Date') {
        return obj;
      }
    });

    setInbox(from, subject, date, msgId, getBody(data));
  }).catch(err => {
    console.error(err);
  });
}

function setInbox(from, subject, date, msgId, data) {
  let fromValue = from[0]['value'].split('<');
  let dateTime = new Date(date[0].value).toLocaleString(undefined, {
    timeZone: 'Asia/Kolkata'
  });
  let tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${fromValue[0]}</td>
    <td><button id="message-${msgId}" class="msg-link" data-toggle="modal" data-target="#messageModal">
      ${subject[0].value}</button>
    </td>
    <td>${dateTime}</td>
  `;
  document.getElementById('mail-box').appendChild(tr);

  document.getElementById(`message-${msgId}`).addEventListener('click', () => {
    readMessage(subject[0].value, data);
  })

}

function readMessage(subject, data) {
  document.getElementById('messageModalLabel').innerHTML = `${subject}`;
  let div = document.getElementById('messageModalBody');
  div.innerHTML = ``;
  let iframe = document.createElement('iframe');
  iframe.setAttribute('id', 'message-iframe');
  div.appendChild(iframe);
  document.getElementById('message-iframe').contentWindow.document.write(data);
}

function getBody(message) {
  var encodedBody = '';
  if (typeof message.parts == 'undefined') {
    encodedBody = message.body.data;
  } else {
    encodedBody = getHTMLPart(message.parts);
  }
  encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  return decodeURIComponent(escape(window.atob(encodedBody)));
}

function getHTMLPart(arr) {
  for (var x = 0; x <= arr.length; x++) {
    if (typeof arr[x].parts === 'undefined') {
      if (arr[x].mimeType === 'text/html') {
        return arr[x].body.data;
      }
    } else {
      return getHTMLPart(arr[x].parts);
    }
  }
  return '';
}

function getMessageInputs(ele) {
  let email = document.getElementById('email').value;
  let subject = document.getElementById('subject').value;
  let msg = document.getElementById('message').value;
  let validEmail = true;
  let validSub = true;
  let validMsg = true;
  if (email.length == 0) {
    document.getElementById('emailHelp').innerHTML = `This field is required.`;
    validEmail = false;
  } else {
    document.getElementById('emailHelp').innerHTML = ``;
    validEmail = validateEmail(email);
  }

  if (subject.length == 0) {
    document.getElementById('subHelp').innerHTML = `This field is required.`;
    validSub = false;
  } else {
    document.getElementById('subHelp').innerHTML = ``;
  }

  if (msg.length == 0) {
    document.getElementById('msgHelp').innerHTML = `This field is required.`;
    validMsg = false;
  } else {
    document.getElementById('msgHelp').innerHTML = ``;
  }

  if (validEmail && validSub && validMsg) {
    sendEmail(ele, email, subject, msg);
  }
}

function validateEmail(mail) {
  let mailFormat = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  if (mailFormat.test(mail)) {
    document.getElementById('emailHelp').innerHTML = ``;
    return true;
  } else {
    document.getElementById('emailHelp').innerHTML = `Invalid Email`;
    return false;
  }
}

function sendEmail(ele, to, sub, msg) {
  ele.disabled = true;

  sendMessage({
      'To': to,
      'Subject': sub
    },
    msg,
    clearModal
  );

  return false;
}

function sendMessage(headersObj, message, callback) {
  var email = '';

  for (var header in headersObj)
    email += header += ": " + headersObj[header] + "\r\n";

  email += "\r\n" + message;

  var sendRequest = gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
    }
  });

  return sendRequest.execute(callback);
}

function clearModal() {
  $('#composeModal').modal('hide');

  document.getElementById('email').value = '';
  document.getElementById('subject').value = '';
  document.getElementById('message').value = '';

  document.getElementById('btn-send').removeAttribute('disabled');
  alert('Message send successfully!')
}