 # NodeJS Mongo Auth

My little test for authorized requests to a nodejs server using nodejs, json web tokens, and mongodb.

## Todo:

 - [x] Signup
 - [x] Login
 - [x] Verify session
 - [x] Test authorized endpoint
 - [ ] Encrypt passwords before storing in MongoDB

## Quick Start Guide

### Install NodeJS
Node Version Manager (NVM) is one of the easiest ways to install node and keep it up to date.
* You can install it using `curl` or `wget`. 
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```
```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```
* Source the new instructions NVM added to `.bashrc` during the installation process. You can either exit and re-enter the shell console, or manually source your `.bashrc` file. This file is almost always located at the root of your home directory. 
```
source ~/.bashrc
```
*  Check to see if it installed successfully ```nvm --version```

Now to install NodeJS we simply run the command ```nvm install --lts```

## Setting Up The Server
Now on to setting up the actual server.
```
git clone https://github.com/rinzler100/nodejs-mongo-auth
```
```
cd nodejs-mongo-auth/server
```
```
npm install
```
* Next, use the `config.json.example` to format your config.json file.
```
node index.js
```
* And you're done! Use `node index.js &` to run the process in the background. 
