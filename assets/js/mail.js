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
    // document.getElementById('main').style.display = 'flex';
    // document.getElementById('content').style.display = 'none';
    getMessagesId(document.querySelector('.active'), 'INBOX');
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    // document.getElementById('main').style.display = 'none';
    // document.getElementById('content').style.display = 'block';
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

  let toast = document.getElementById("snackbar");
  toast.innerHTML = `You will be Sign out now`
  toast.className = "show";
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
    gapi.auth2.getAuthInstance().signOut();
    window.location.replace('index.html');
  }, 1500);
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

function createMyElement(tagName, className = '') {
  let ele = document.createElement(tagName);
  ele.setAttribute('class', className);
  return ele;
}

function createMyTable(tableFor) {
  let container = document.getElementById('my-table');
  container.innerHTML = ``;
  let div = createMyElement('div', 'h5');
  div.innerHTML = `${tableFor}`;
  let table = createMyElement('table', 'table table-striped table-inbox hidden');
  table.setAttribute('id', 'inbox');
  let thead = createMyElement('thead');
  let tr = createMyElement('tr');
  let th1;
  let th2;
  let th3;
  if (tableFor == 'All') {
    th1 = createMyElement('th');
    th1.innerHTML = `From`;
    th2 = createMyElement('th');
    th2.innerHTML = `Subject`;
    th3 = createMyElement('th');
    th3.innerHTML = `Date/Time`;
    tr.append(th1, th2, th3);
  } else if (tableFor == 'Sent') {
    th1 = createMyElement('th');
    th1.innerHTML = `To`;
    th2 = createMyElement('th');
    th2.innerHTML = `Subject`;
    th3 = createMyElement('th');
    th3.innerHTML = `Date/Time`;
    tr.append(th1, th2, th3);
  } else {
    th1 = createMyElement('th');
    th1.innerHTML = `To`;
    th2 = createMyElement('th');
    th2.innerHTML = `Subject`;
    th3 = createMyElement('th');
    th3.innerHTML = `Edit`;
    tr.append(th1, th2, th3);
  }
  thead.appendChild(tr);
  let tbody = createMyElement('tbody');
  tbody.id = `mail-box`;
  table.append(thead, tbody);
  container.append(div, table);
}

// Make sure the client is loaded and sign-in is complete before calling this method.
function getMessagesId(eleBtn, mailType) {
  gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'labelIds': mailType,
    'maxResults': 15
  }).then(function (response) {
    let activeBtn = document.querySelector('.active');
    activeBtn.classList.remove('active');
    eleBtn.classList.add('active');
    if (mailType == 'INBOX') {
      createMyTable('All');
    } else {
      createMyTable('Sent');
    }
    response.result.messages.forEach(obj => {
      getMessage(obj.id, mailType);
    });
    document.getElementById('loading').style.display = 'none';
  }).catch(err => {
    console.error(err);
  });
}

function getMessage(msgId, mailType) {
  gapi.client.gmail.users.messages.get({
    'userId': 'me',
    'id': msgId,
  }).then(function (response) {
    let data = response.result.payload
    let toOrFrom;
    if (mailType == "INBOX") {
      toOrFrom = data.headers.filter(obj => {
        return obj.name == 'From';
      });
    } else {
      toOrFrom = data.headers.filter(obj => {
        return obj.name == 'To';
      });
    }
    let subject = data.headers.filter(obj => {
      return obj.name == 'Subject';
    });
    let date = data.headers.filter(obj => {
      return obj.name == 'Date';
    });

    setInbox(toOrFrom, subject, date, msgId, getBody(data));
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

async function sendMessage(headersObj, message, callback) {
  let email = '';

  for (let header in headersObj)
    email += header += ": " + headersObj[header] + "\r\n";

  email += "\r\n" + message;

  let sendRequest = gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
    }
  });

  await sendRequest.execute(callback);
  toastMessage('Message sent');
}

function clearModal() {
  
  document.getElementById('email').value = '';
  document.getElementById('subject').value = '';
  document.getElementById('message').value = '';
  
  document.getElementById('btn-send').removeAttribute('disabled');
  $('#composeModal').modal('hide');
}

function getDraftsID(eleBtn) {
  gapi.client.gmail.users.drafts.list({
    'userId': 'me',
  }).then(function (response) {

    let activeBtn = document.querySelector('.active');
    activeBtn.classList.remove('active');
    eleBtn.classList.add('active');
    document.getElementById('loading').style.display = 'block';
    createMyTable('Draft');
    if (response.result.resultSizeEstimate) {
      response.result.drafts.forEach(obj => {
        getDraftMessage(obj.id);
      });
    } else {
      document.getElementById('loading').style.display = 'none';
      let tr = createMyElement('tr');
      let td = createMyElement('td', 'text-center');
      td.innerHTML = `No drafts !!`;
      td.setAttribute('colspan', "3");
      tr.appendChild(td);
      document.getElementById('mail-box').appendChild(tr);
    }
  }).catch(err => {
    console.error(err);
  });
}

function getDraftMessage(draftId) {
  gapi.client.gmail.users.drafts.get({
    'userId': 'me',
    'id': draftId
  }).then(function (response) {
    document.getElementById('loading').style.display = 'none';
    let data = response.result.message.payload;

    let to = data.headers.filter(obj => {
      return obj.name == "To";
    });

    try {
      to = to[0].value.split('<');
      to = to[1].split('>');
    } catch (error) {
      to = to;
    }

    let subject = data.headers.filter(obj => {
      return obj.name == "Subject";
    });

    let msg = getBody(data);
    try {
      msg = msg.split('>');
      msg = msg[1].split('<');
    } catch (error) {
      msg = msg;
    }
    let tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${to[0]}</td>
    <td>${subject[0].value}</td>
    <td><button id="draft-${draftId}" class="btn btn-primary">Edit</button>
    </td>
  `;
    document.getElementById('mail-box').appendChild(tr);

    document.getElementById(`draft-${draftId}`).addEventListener('click', () => {
      setDraftMsg(to[0], subject[0].value, msg[0], response.result.id);
    });
  }).catch(err => {
    console.error(err);
  });
}


function setDraftMsg(to, subject, msg, draftID) {
  $('#draftModal').modal('show');
  document.getElementById('d-email').value = to;
  document.getElementById('d-subject').value = subject;
  document.getElementById('d-msg').innerHTML = msg;
  document.getElementById('d-ID').value = draftID;
}

async function sendDraftMsg(ele) {

  ele.disabled = true;
  let from;
  let to = document.getElementById('d-email').value;
  let subject = document.getElementById('d-subject').value;
  let message = document.getElementById('d-msg').innerHTML;
  let draftID = document.getElementById('d-ID').value;

  let curUser = gapi.client.gmail.users.getProfile({
    'userId': 'me'
  });

  await curUser.execute(function (response) {
    from = response.emailAddress;
  });

  let email = `From:${from}\nTo:${to}\nSubject:${subject}\n\n${message}`;
  // let headersObj = {
  //   'To': document.getElementById('d-email').value,
  //   'Subject': document.getElementById('d-subject').value
  // };

  // for (let header in headersObj)
  //   email += header += ": " + headersObj[header] + "\r\n";

  // email += "\r\n" + message;

  let request = gapi.client.gmail.users.drafts.update({
    'userId': 'me',
    'id': draftID,
    'message': {
      'raw': btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
    },
    'send': false,
  });

  await request.execute(function (response) {
    console.log('response=' + JSON.stringify(response, null, 2));
  });

  let sendRequest = gapi.client.gmail.users.drafts.send({
    'userId': 'me',
    'resource': {
      'id': draftID,
    }
  });

  await sendRequest.execute(function (response) {
    console.log('response=' + JSON.stringify(response, null, 2));
  });

  $('#draftModal').modal('hide');
  toastMessage('Message sent');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

async function createDraftMsg() {
  let to = document.getElementById('email').value;
  let subject = document.getElementById('subject').value;
  let message = document.getElementById('message').value;
  let from;
  let curUser = gapi.client.gmail.users.getProfile({
    'userId': 'me'
  });

  await curUser.execute(function (response) {
    from = response.emailAddress;
  });

  if (to || subject || message) {
    let email = `From:${from}\nTo:${to}\nSubject:${subject}\n\n${message}`;

    let request = gapi.client.gmail.users.drafts.create({
      'userId': 'me',
      'message': {
        'raw': btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
      }
    });

    await request.execute(function (response) {
      console.log('response=' + JSON.stringify(response, null, 2));
    });

    // $('#composeModal').modal('hide');
    clearModal();
    toastMessage('Message saved as Draft');
  }
}

function toastMessage(message) {
  let toast = document.getElementById("snackbar");
  toast.innerHTML = `${message}`
  toast.className = "show";
  setTimeout(function () {
    toast.className = toast.className.replace("show", "");
  }, 1500);
}

$('#composeModal').on('hide.bs.modal', function (e) {
  createDraftMsg();
})