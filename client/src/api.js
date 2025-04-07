// frontend/src/api.js
import Web3 from 'web3';

const web3 = new Web3(window.ethereum); // Ethereum provider via MetaMask
const contractABI = require('/abis/abi.json');
const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3'; // Adresse du contrat déployé
const contract = new web3.eth.Contract(contractABI, contractAddress);

export const registerUser = async (prenom, nom, email, password, role) => {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.registerUser(
        accounts[0], prenom, nom, email, role, web3.utils.keccak256(password)
    ).send({ from: accounts[0] });
};

export const loginUser = async (email, password) => {
    const accounts = await web3.eth.getAccounts();
    const [success, role] = await contract.methods.verifyLogin(email, web3.utils.keccak256(password)).call({ from: accounts[0] });
    return { success, role };
};

export const getRole = async (userAddress) => {
    return await contract.methods.getRole(userAddress).call();
};
