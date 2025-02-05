const request = require('supertest');
const app = require('../service'); // Ensure this is the correct path

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let testAdminUser;
let testAdminAuthToken;

describe('Franchise Router Tests', () => {
  // Existing tests...
  beforeEach(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
    const registerRes = await request(app).post("/api/auth").send(testUser);
    testUserAuthToken = registerRes.body.token;
    expectValidJwt(testUserAuthToken);

    testAdminUser = await createAdminUser();
    const adminRegisterRes = await request(app)
      .post("/api/auth")
      .send(testAdminUser);
    testAdminAuthToken = adminRegisterRes.body.token;
    expect(adminRegisterRes.status).toBe(200);
    expectValidJwt(adminRegisterRes.body.token);
    // doesn't work w/ before each for create franchise, create menu item loses admin role somehow????
  });

  test('get franchises', async () => {
    const franchiseRes = await request(app)
      .get('/api/franchise')
      .set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toEqual(expect.any(Array));
  });

  test('get user franchises as normal user', async () => {
    const userFranchiseRes = await request(app)
      .get('/api/franchise/1')
      .set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(userFranchiseRes.status).toBe(200);
    expect(userFranchiseRes.body).toEqual(expect.any(Array));
  });

  test('get user franchises as admin user', async () => {
    const userFranchiseRes = await request(app)
      .get('/api/franchise/1')
      .set('Authorization', `Bearer ${testAdminAuthToken}`);
    expect(userFranchiseRes.status).toBe(200);
    expect(userFranchiseRes.body).toEqual(expect.any(Array));
  });

  test('unauthorized to create franchise', async () => {
    const createFranchiseRes = await request(app)
      .post('/api/franchise')
      .set('Authorization', `Bearer ${testUserAuthToken}`)
      .send({});
    expect(createFranchiseRes.status).toBe(403);
    expect(createFranchiseRes.body).toMatchObject({
      message: 'unable to create a franchise',
    });
  });

  describe('franchise stuff', () => {
    let franchiseId;
    let storeId;

    test('create franchise', async () => {
      const adminUser = await createAdminUser();
      const loginRes = await request(app).put('/api/auth').send(adminUser);
      const authToken = loginRes.body.token;

      const createFranchiseRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: adminUser.name, admins: [{ email: adminUser.email }] });
      expect(createFranchiseRes.status).toBe(200);
      expect(createFranchiseRes.body).toEqual(
        expect.objectContaining({ name: adminUser.name }),
      );
      franchiseId = createFranchiseRes.body.id;
    });

    test('create store', async () => {
      const adminUser = await createAdminUser();
      const loginRes = await request(app).put('/api/auth').send(adminUser);
      const authToken = loginRes.body.token;

      const createStoreRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ franchiseId: franchiseId, name: adminUser.name + "'s store" });
      expect(createStoreRes.status).toBe(200);
      expect(createStoreRes.body).toEqual(
        expect.objectContaining({ name: adminUser.name + "'s store" }),
      );
      storeId = createStoreRes.body.id;
    });

    test('delete store', async () => {
      const adminUser = await createAdminUser();
      const loginRes = await request(app).put('/api/auth').send(adminUser);
      const authToken = loginRes.body.token;

      const deleteStoreRes = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteStoreRes.status).toBe(200);
      expect(deleteStoreRes.body).toEqual({ message: 'store deleted' });
    });

    test('delete franchise', async () => {
      const adminUser = await createAdminUser();
      const loginRes = await request(app).put('/api/auth').send(adminUser);
      const authToken = loginRes.body.token;

      const deleteFranchiseRes = await request(app)
        .delete(`/api/franchise/${franchiseId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteFranchiseRes.status).toBe(200);
      expect(deleteFranchiseRes.body).toEqual({ message: 'franchise deleted' });
    });
  });
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
  );
}


function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

const { Role, DB } = require("../database/database.js");

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}