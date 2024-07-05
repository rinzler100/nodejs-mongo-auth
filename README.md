# NodeJS Mongo Auth

My little test for authorized requests to a nodejs server using nodejs, json web tokens, and mongodb.

## Todo:

 - [ ] Additional frontend pages, such as a user management page.
 - [ ] Add a way to delete a users' account.
 - [ ] Add a way to change a users' password.
 - [ ] Token refresh on session verify?
 ---
 - [x] Signup
 - [x] Login
 - [x] Verify session
 - [x] Test authorized endpoint
 - [x] Encrypt passwords before storing in MongoDB
 - [x] Add roles to users.
 - [x] Owner role that can assign roles to users via username and manage users.

## Quick Start Guide

### Install NodeJS
Node Version Manager [(NVM)](https://github.com/nvm-sh/nvm#about) is one of the easiest ways to install node and keep it up to date.
* You can install it using `curl` or `wget`. 
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```
```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
```
* Source the new instructions NVM added to `.bashrc` during the installation process. You can either exit and re-enter the shell console, or manually source your `.bashrc` file. This file is almost always located at the root of your home directory. 
```bash
source ~/.bashrc
```
*  Check to see if it installed successfully 
```bash
nvm --version
```

Now to install NodeJS we simply run the command: 
```bash
nvm install --lts
```

## Setting Up the Server
Now on to setting up the actual server.
```bash
git clone https://github.com/rinzler100/nodejs-mongo-auth
```
```bash
cd nodejs-mongo-auth/server
```
```bash
npm install
```
* Next, use the `config.json.example` to format your config.json file.
```bash
node index.js
```
* And you're done! Use `node index.js &` to run the process in the background. 

## MongoDB Setup
The easiest way to use MongoDB is to use Mongo Cloud's Atlas servers (which have a free version). 
- Go to [cloud.mongodb.com](https://account.mongodb.com/) to get started.
- Make a free organization
- Make a free project then add a free database (cluster)
- Add a user in the Database Access section and copy the username and password for use in the NodeJS server (in the .env file).

## Setting Up the Client
The client is just a singular HTML file, you can download it and open it in any modern browser.

--> You will need to modify the file if you are running the server on anything other than http://localhost:3000
