import { expect } from "chai";
import { ethers } from "hardhat";

describe("Auth Contract", function () {
  let auth;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Auth = await ethers.getContractFactory("Auth");
    auth = await Auth.deploy();
    await auth.deployed();
  });

  describe("User Registration", function () {
    it("should register a new user", async function () {
      await expect(auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com"))
        .to.emit(auth, "UserRegistered")
        .withArgs(owner.address, "ahmed@tunis.com", "Admin", "generatedPassword");
    });

    it("should not register the same user twice", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");
      await expect(auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com"))
        .to.be.revertedWith("Utilisateur deja inscrit.");
    });
  });

  describe("User Login", function () {
    it("should login with correct password", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");

      // Retrieve generated password from event logs
      const events = await auth.queryFilter("UserRegistered");
      const generatedPassword = events[0].args.generatedPassword;

      await expect(auth.loginUser(generatedPassword)).to.emit(auth, "UserLoggedIn").withArgs(owner.address);
    });

    it("should fail login with incorrect password", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");
      await expect(auth.loginUser("wrongPassword")).to.be.revertedWith("Utilisateur non inscrit.");
    });
  });

  describe("Password Update", function () {
    it("should update the user's password", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");

      await auth.updatePassword("newpassword123");

      await expect(auth.loginUser("newpassword123")).to.emit(auth, "UserLoggedIn").withArgs(owner.address);
    });

    it("should fail if the new password is too short", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");

      await expect(auth.updatePassword("short")).to.be.revertedWith("Mot de passe trop court.");
    });
  });

  describe("User Deletion", function () {
    it("should delete the user", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");

      await expect(auth.deleteUser()).to.emit(auth, "UserDeleted").withArgs(owner.address);
    });

    it("should not allow login after deletion", async function () {
      await auth.registerUser("Ahmed", "Ben Ali", "Admin", "ahmed@tunis.com");
      await auth.deleteUser();
      await expect(auth.loginUser("wrongPassword")).to.be.revertedWith("Utilisateur non inscrit.");
    });
  });
});
