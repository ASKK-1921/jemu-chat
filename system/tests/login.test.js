// This is a file used only for testing in development
// As such, remove undefined errors from eslint
/* eslint-disable no-undef */
/* eslint-disable node/no-unpublished-require */

// Dependencies
const supertest = require('supertest');
const assert = require('assert');

// Refers to the port where the program is running
const server = supertest.agent('localhost:3000');

const firstName = 'John';
const lastName = 'Doe';
const username = 'JohnDoe';
const email = 'john@example.com';
const password = '123123123';

describe('User Authorisation', () => {
	it('Should load the register page', (done) => {
		server.get('/register').end((err, res) => {
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.type, 'text/html');
			done();
		});
	});
	it('Should create a new user', (done) => {
		server
			.post('/register')
			.type('json')
			.send(
				`{ "firstName": "${firstName}", "lastName": "${lastName}", "username": "${username}", "email": "${email}", "password": "${password}"}`
			)
			.end((err, res) => {
				assert.strictEqual(res.statusCode, 201);
				assert.strictEqual(res.type, 'text/html');
				done();
			});
	});
	it('Should load the login page', (done) => {
		server.get('/login').end((err, res) => {
			assert.strictEqual(res.statusCode, 200);
			assert.strictEqual(res.type, 'text/html');
			done();
		});
	});
	it('Should log the user in with their username', (done) => {
		server
			.post('/login')
			.type('json')
			.send(`{ "logUsername": "${username}", "password": "${password}"}`)
			.end((err, res) => {
				assert.strictEqual(res.statusCode, 200);
				assert.strictEqual(res.type, 'text/html');
				done();
			});
	});
	it('Should log the user out', (done) => {
		server.get('/logout').end((err, res) => {
			assert.strictEqual(res.statusCode, 205);
			done();
		});
	});
});
