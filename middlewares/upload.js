const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier 'uploads' s'il n'existe pas
const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nettoyer les caractères spéciaux (y compris les accents)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls les PDF, DOC et DOCX sont permis.'));
  }
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
