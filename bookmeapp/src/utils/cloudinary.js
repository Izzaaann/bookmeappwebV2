// src/utils/cloudinary.js

/**
 * Sube una imagen a Cloudinary desde React Native.
 * Recibe un objeto con { uri }, y el tipo de imagen para elegir carpeta.
 * Devuelve la URL segura.
 */
export async function uploadToCloudinary(file, imageType = 'client_profile') {
  const { uri } = file;
  // Extraer extensión
  const match = /\.(\w+)$/.exec(uri);
  const ext = match ? match[1] : 'jpg';
  const formData = new FormData();

  formData.append('file', {
    uri,
    name: `upload.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`
  });
  formData.append('upload_preset', 'bookme_uploads');
  formData.append('api_key', '891687494156926');

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
  if (folder) formData.append('folder', folder);

  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/duzymlxzl/image/upload',
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Cloudinary error ${response.status}`);
    }
    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.error('Error al subir imagen a Cloudinary:', err);
    throw err;
  }
}
