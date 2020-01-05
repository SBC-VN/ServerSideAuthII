# ServerSideAuthII

### Experiment in basic server side authentication without any password transmittion from client to server.

This is an experiment in coding a server side authentication scheme without the user's password being sent between the client/website and the server.

The repository contains a simple client website and a simple server.  It is based on the 'ServerSideAuth' repository.

The general flow of events is:

1. The user goes to the website.
2. The user clicks on the "Log in" button on the top left.
3. The login modal box is displayed.
4. The user types in a username/password, and clicks the modals 'log in'.  [For this example login is allowed when username=password]
5. The website sends only the username to the server.
6. The server uses the username to retrieve the user's password.  [In this case it just uses the username as the password]
7. The server generates a response composed of a random string and return encryption key - then encrypts them using the user's password.
8. The client decrypts the response from the server using the user's password.
9. The client encrypts the random string using the return encryption key and sends it to a second login API.
10. The server decrypts the return string and compares it to the original.

	a) If the return string matches the original - the user is logged on and a session id is sent back to the client.  [The return encryption key can be used to encrypt all 'body' text for greater security]
	
	b) If the return string does not match the original the user is NOT logged in and a login error is returned.  [A delay can be implemented to discourage automated password attempt attacks]
	