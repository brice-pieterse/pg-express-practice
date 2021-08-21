import { User, General_User, userStore } from '../models/user';
import { rfTokenStore } from '../models/services/refreshToken';
import supertest from 'supertest';
import app from '../server';

const rf_store = new rfTokenStore();
const user_store = new userStore();
const request = supertest(app);

/*
- index users
- show user
- create user
- delete user
- update user
*/

describe('Test User Model', () => {
  const Brice: General_User = {
    first_name: 'brice',
    last_name: 'pieterse',
    username: 'bpiet',
    password: 'example1'
  };

  const newBrice: General_User = {
    first_name: 'brice',
    last_name: 'pieterse',
    username: 'bpiet',
    password: 'example10'
  };

  // tests index
  it('should return a list of users', async () => {
    const result = await user_store.index();
    expect(result).toEqual([]);
  });

  // tests create
  it('should create a new user', async () => {
    const insert = await user_store.create(Brice);
    expect(insert).toEqual(1);
  });

  // tests show
  it('should return the newly created user', async () => {
    const brice = await user_store.show(Brice.username);
    expect(brice.role).toEqual('user');
  });

  // tests authenticate
  it('should return the user if bcrypt successfully verifies password matches', async () => {
    const user = await user_store.authenticate(Brice.username, Brice.password);
    expect(user).toBeTruthy();
  });

  // tests update and show at the same time
  it("should update the user's password", async () => {
    const before = await user_store.show(Brice.username);
    await user_store.update(newBrice, Brice.password, Brice.username);
    const after = await user_store.show(Brice.username);
    expect(after.password_digest).not.toEqual(before.password_digest);
  });

  // tests delete
  it('should delete the new user', async () => {
    const rowCount = await user_store.delete(
      newBrice.username,
      newBrice.password
    );
    expect(rowCount).toEqual(1);
  });
});

describe('Test User Handlers and Refresh Token Model', () => {
  let newUser: User;
  let rfToken: string;
  let acToken: string;
  const rfTokenReplacement = 'abcdefghijklmnop';

  const Nicole = {
    firstName: 'Nicole',
    lastName: 'Pieterse',
    username: 'nicpiet',
    password: 'example2'
  };

  const NicoleCredentials = {
    username: 'nicpiet',
    password: 'example2'
  };

  const updatedNicole = {
    firstName: 'Nicole',
    lastName: 'Pieterse',
    username: 'nicpieterse',
    newPassword: 'example20',
    oldUsername: 'nicpiet',
    oldPassword: 'example2'
  };

  // tests create user handler, RFToken Model's add refresh token method
  it('gets a response with an access token, a new user, and a refresh token (non-cookie for testing purposes)', async () => {
    const result = await request.post('/users/rfTest').send(Nicole).expect(200);
    expect(result.body.user).toBeDefined();
    expect(result.body.token).toBeDefined();
    expect(result.body.rf).toBeDefined();
    newUser = result.body.user;
    rfToken = result.body.rf;
  });

  // tests RFToken Model's validation method
  it('checks to make sure the refresh token received is valid', async () => {
    const rf = await rf_store.validateRefreshToken(rfToken);
    expect(rf).toEqual(rfToken);
  });

  // test RFToken Model's update method (for refresh token rotation)
  it('updates the refresh token', async () => {
    const newRF = await rf_store.updateRefreshToken(
      newUser.id,
      rfToken,
      rfTokenReplacement
    );
    expect(newRF).toBeTruthy();
    const newRFValue = await rf_store.validateRefreshToken(rfTokenReplacement);
    expect(newRFValue).toEqual(rfTokenReplacement);
  });

  // tests the user show handler
  it('should show the user', async () => {
    const user = await user_store.show('nicpiet');
    expect(user.role).toEqual('user');
  });

  // tests the user authenticate handler
  it('should authenticate the user by returning the user and an access token', async () => {
    const response = await request
      .post('/users/auth')
      .send(NicoleCredentials)
      .expect(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.access_token).toBeDefined();
    acToken = response.body.access_token;
  });

  // tests the user update method, with the access token received via the authenticate handler test
  it('should update the user', async () => {
    const response = await request
      .put('/users/nicpiet')
      .auth(acToken, { type: 'bearer' })
      .send(updatedNicole)
      .expect(200);
    const updatedUser = response.body;
    expect(updatedUser.username).toEqual(updatedNicole.username);
  });
});
