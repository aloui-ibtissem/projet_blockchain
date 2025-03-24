const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contrat Auth", function () {
    let Auth;
    let auth;
    let owner;
    let user;

    beforeEach(async function () {
        // Récupérer les signers
        [owner, user] = await ethers.getSigners();

        // Déployer le contrat Auth
        Auth = await ethers.getContractFactory("Auth");
        auth = await Auth.deploy();
    });

    it("Devrait enregistrer un utilisateur", async function () {
        const firstName = "John";
        const lastName = "Doe";
        const role = "Admin";
        const email = "john.doe@example.com";

        // Appeler la fonction registerUser
        await auth.registerUser(firstName, lastName, role, email);

        // Vérifier que l'utilisateur a été ajouté
        const userDetails = await auth.getUser(user.address);
        expect(userDetails[0]).to.equal(firstName);
        expect(userDetails[1]).to.equal(lastName);
        expect(userDetails[2]).to.equal(role);
        expect(userDetails[3]).to.equal(email);
    });

    it("Devrait permettre la mise à jour du mot de passe", async function () {
        const newPassword = "newSecurePassword123";

        // Mettre à jour le mot de passe
        await auth.updatePassword(newPassword);

        // Vérifier que le mot de passe a été mis à jour
        const userDetails = await auth.getUser(user.address);
        expect(userDetails[4]).to.equal(newPassword);
    });
});
