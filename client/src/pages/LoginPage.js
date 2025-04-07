// frontend/src/pages/LoginPage.js
import React, { useState } from 'react';
import { loginUser } from '../api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { success, role } = await loginUser(email, password);
        if (success) {
            setRole(role);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
            <button type="submit">Se connecter</button>
            {role && <div>Rôle: {role}</div>}
        </form>
    );
};

export default LoginPage;
