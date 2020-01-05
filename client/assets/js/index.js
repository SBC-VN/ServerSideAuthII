let loggedin = false;
let sessionid = null;
let password = null;
let username = null;
let encryptKey = null;

//
// The logout function should really hit a 'logout' API to tell the server to release
//  the session id.
//
function performLogout() {
    loggedin = false;
    sessionid = null;
}

// 
// The login function will (ajax) call the API using a 'PUT' (not GET, as it causes changes) with
//  the username / password in the body.   In the real world the app should at least be running using ssl
//  so that the username & password is encrypted. 
//
function startLogin(username,password) {
   $.post(  "http://localhost:3000/api/loginRequest",
            {username},
            loginRequestCallback)
            .fail(function(jqXHR, textStatus, errorThrown) 
            {
                console.log("status",textStatus);
                console.log("error",errorThrown);
                console.log("jqXHR",jqXHR);
            });
}

//
// Gets the data back from the login request   
// Some things to consider: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/august/javascript-cryptography-considered-harmful/
//
// Crypto (js) module comes from: https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js
//
function loginRequestCallback(data, status, jqXHR) { 
    if (data.challengeStr !== undefined) {
        var challengeStr = CryptoJS.AES.decrypt(data.challengeStr, password);

        encryptKey = CryptoJS.AES.decrypt(data.returnKey, password);   // We *could* continue to use the user's password to encrypt/decrypt
                                                                       // things.  However that's usually a short string which makes the
                                                                       // encryption easier to break, also a separate key would change
                                                                       // each time - unlike the password.                                

        password = null;   // The encryption key is now used, can blank out the password so it can't be 'scraped' somehow.
                           // Note this just makes it so the password itself can't be stolen.  Injection attacks can still 
                           // use the encryptionKey / sessionId to spoof..

        var returnChallengeStr = CryptoJS.AES.encrypt(challengeStr, encryptKey);

        $.post(  "http://localhost:3000/api/loginChallengeApi",
        {username, returnChallengeStr},
        loginCallback)
        .fail(function(jqXHR, textStatus, errorThrown) 
        {
            console.log("status",textStatus);
            console.log("error",errorThrown);
            console.log("jqXHR",jqXHR);
        });
    }
    else {
        $("#log-status-text").text("Not logged in; invalid username/password.");
    }
}

function loginCallback(data, status, jqXHR) {   
    if (data.sessionId !== undefined) {
        loggedin = true;
        sessionId = CryptoJS.AES.decrypt(data.sessionId, encryptKey);
        username = null;   // Don't need the username at this point, either.  The session id takes care of that.
        $("#log-status-text").text("Logged in, session id: " + sessionid);
    }
    else {
        $("#log-status-text").text("Not logged in; invalid username/password.");
    }
}

function toggleLogin() {
    if (loggedin) {
        performLogout();
    }
    else {       
        $("#login-modal-div").css("visibility","visible");
    }
}

function tryLogin(event) {
    event.preventDefault();
    username = $("#login-username-formtxt").val();
    password = $("#login-password-formtxt").val();
    // Clear the password field in the client
    $("#login-password-formtxt").val("");
    startLogin(username,password);
    $("#login-modal-div").css("visibility","hidden");
}

$("#log-toggle-button").on("click",toggleLogin);
$("#login-form").on("submit",tryLogin);