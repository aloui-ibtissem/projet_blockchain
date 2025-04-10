/**
 * Générateur de mot de passe
 * Utilitaire pour générer des mots de passe aléatoires sécurisés
 */

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} longueur - Longueur du mot de passe (défaut: 12)
 * @returns {string} - Mot de passe généré
 */
exports.generatePassword = (longueur = 12) => {
    // Caractères possibles pour le mot de passe
    const minuscules = 'abcdefghijkmnopqrstuvwxyz'; // sans l pour éviter la confusion avec 1
    const majuscules = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I et O pour éviter la confusion avec 1 et 0
    const chiffres = '23456789'; // sans 0 et 1 pour éviter la confusion avec O et l
    const speciaux = '@#$%&*!?';
    
    // Tous les caractères possibles
    const tousCaracteres = minuscules + majuscules + chiffres + speciaux;
    
    // Initialiser le mot de passe
    let motDePasse = '';
    
    // Assurer au moins un caractère de chaque type
    motDePasse += minuscules.charAt(Math.floor(Math.random() * minuscules.length));
    motDePasse += majuscules.charAt(Math.floor(Math.random() * majuscules.length));
    motDePasse += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
    motDePasse += speciaux.charAt(Math.floor(Math.random() * speciaux.length));
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < longueur; i++) {
      motDePasse += tousCaracteres.charAt(Math.floor(Math.random() * tousCaracteres.length));
    }
    
    // Mélanger les caractères
    motDePasse = motDePasse.split('').sort(() => 0.5 - Math.random()).join('');
    
    return motDePasse;
  };
  