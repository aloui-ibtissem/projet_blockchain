import React, { useState } from "react";
import Web3 from "web3";
import { contractABI, contractAddress } from "./contractDetails"; // Inclure ABI et Adresse du Smart Contract

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
  });
  const [userRegistered, setUserRegistered] = useState(false);

  // Initialiser Web3
  React.useEffect(() => {
    const initWeb3 = async () => {
      const web3Instance = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setWeb3(web3Instance);
    };
    initWeb3();
  }, []);

  // Enregistrer l'utilisateur
  const handleRegisterUser = async () => {
    if (!web3) return;

    const accounts = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    try {
      await contract.methods
        .registerUser(
          userInfo.firstName,
          userInfo.lastName,
          userInfo.role,
          userInfo.email
        )
        .send({ from: accounts[0] });

      setUserRegistered(true);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
    }
  };

  // Mettre à jour l'état des informations utilisateur
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  return (
    <div>
      <h1>Inscription utilisateur</h1>
      <form>
        <input
          type="text"
          name="firstName"
          placeholder="Prénom"
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Nom"
          onChange={handleChange}
        />
        <input
          type="text"
          name="role"
          placeholder="Rôle"
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />
        <button type="button" onClick={handleRegisterUser}>
          S'inscrire
        </button>
      </form>

      {userRegistered && <p>Utilisateur inscrit avec succès!</p>}
    </div>
  );
};

export default App;
