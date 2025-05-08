// src/utils/cloudinary.js

import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../config';

/**
 * Sube un blob de imagen a Cloudinary y devuelve la URL pública.
 *
 * @param {Blob} fileBlob – El contenido de la imagen (blob).
 * @param {'client_profile' | 'business_profile' | 'business_banner'} imageType – 
 *        para organizar carpetas en Cloudinary.
 * @returns {Promise<string>} – La URL segura de la imagen subida.
 */
export async function uploadToCloudinary(fileBlob, imageType = 'client_profile') {
  // Definir carpeta en Cloudinary según tipo
  let folder = '';
  switch (imageType) {
    case 'client_profile':
      folder = 'client_profiles';
      break;
    case 'business_profile':
      folder = 'business_profiles';
      break;
    case 'business_banner':
      folder = 'business_banners';
      break;
  }

  const formData = new FormData();
  formData.append('file', fileBlob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  const res = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url;
}
