# CRUD API

# General info

Simple CRUD API that allows user to create, read, update and delete data from database.
Database is made in in-memory format which means it is located locally, but i am launching
separate local server for it to mimic real scenario.

There are two modes in application: single-threaded and multi-threaded. Single-threaded mode
builds one server and allows you to make all CRUD operations to database. Multi-threaded mode
makes a cluster which has a primary thread where the main servers and database are running and
worker threads where all the servers for load ballancing are running. When user makes a request
to a main thread load ballancer passes the request to workers using Round-robin algorithm. It means
that every worker gets a request from main thread in a circular order. That allows to make the app
horizontally scaled. Before every request is handled on worker it syncs with current database state and
after the request is handled and response is back on main thread it updates the database state respectively.

# Installation

1. Clone the repository to your machine;
2. Go to `crud-api` branch via running `git checkout crud-api`;
3. Run `npm install` to install all the packages;

# Running the application

1. Run `npm start:dev` for single-threaded development mode;
2. Run `npm start:prod` for single-threaded production mode(bundles typescript files into `dist` directory and runs the build);
3. Run `npm start:multi` for multi-threaded development mode;
4. Run `npm test` to test the app.
