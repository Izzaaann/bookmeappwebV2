// src/config.js

// Tu cloud name en Cloudinary
export const CLOUDINARY_CLOUD_NAME   = 'duzymlxzl';

// El preset que hayas configurado en tu cuenta de Cloudinary (Unsigned Upload Preset)
export const CLOUDINARY_UPLOAD_PRESET = 'bookme_uploads';

// URL de subida genérica a Cloudinary
export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
