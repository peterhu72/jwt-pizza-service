const request = require("supertest");
const app = require("../service");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let testAdminUser;

describe("pizza-service", () => {
  beforeEach(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
    const registerRes = await request(app).post("/api/auth").send(testUser);
    testUserAuthToken = registerRes.body.token;
    expectValidJwt(testUserAuthToken);

    testAdminUser = await createAdminUser();
    const adminRegisterRes = await request(app)
      .post("/api/auth")
      .send(testAdminUser);
    expect(adminRegisterRes.status).toBe(200);
    expectValidJwt(adminRegisterRes.body.token);
    // doesn't work w/ before each for create franchise, create menu item loses admin role somehow????
  });

  test("login", async () => {
    const loginRes = await request(app).put("/api/auth").send(testUser);
    expect(loginRes.status).toBe(200);
    expectValidJwt(loginRes.body.token);

    const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);
  });

  test("login with wrong password", async () => {
    const loginRes = await request(app)
      .put("/api/auth")
      .send({ ...testUser, password: "wrong" });
    expect(loginRes.status).toBe(404);
    expect(loginRes.body).toMatchObject({ message: "unknown user" });
  });

  test("logout", async () => {
    const logoutRes = await request(app)
      .delete("/api/auth")
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toMatchObject({ message: "logout successful" });
  });

  test("get menu", async () => {
    const menuRes = await request(app)
      .get("/api/order/menu")
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.any(Array));
  });

  test("get order", async () => {
    const orderRes = await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.orders).toEqual(expect.any(Array));
  });

  test("add menu item", async () => {
    const adminUser = await createAdminUser();
    const loginRes = await request(app).put("/api/auth").send(adminUser);
    const authToken = loginRes.body.token;

    const addMenuItemReq = {
      //TODO figure out how admin is losing admin role (it didn't worked when I used the testAdminUser)
      title: "VeggieSauron",
      description: "a delicious vegetarian eye of sauron",
      price: 1.0,
      image: "",
    };
    const addMenuItemRes = await request(app)
      .put("/api/order/menu")
      .set("Authorization", `Bearer ${authToken}`)
      .send(addMenuItemReq);
    expect(addMenuItemRes.status).toBe(200);
    expect(addMenuItemRes.body).toEqual(expect.any(Array));
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