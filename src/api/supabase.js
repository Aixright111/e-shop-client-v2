import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 上传商品图片到 Supabase Storage
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 返回图片的公开 URL
 */
/**
 * 上传头像到 Supabase Storage
 * @param {File} file - 头像图片文件
 * @param {string|number} userId - 用户ID，用于文件名关联
 * @returns {Promise<string>} - 返回头像的公开 URL
 */
export async function uploadAvatarImage(file, userId) {
  const ext = file.name.split('.').pop();
  const fileName = `avatar_${userId}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('userImage')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || '头像上传失败');
  }

  const { data: urlData } = supabase.storage
    .from('userImage')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * 删除 Supabase Storage 中的商品图片
 * @param {string} imageUrl - 图片的公开 URL
 * @returns {Promise<void>}
 */
export async function deleteProductImage(imageUrl) {
  const bucket = 'productsImage';
  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
  if (!imageUrl || !imageUrl.startsWith(prefix)) return;

  const filePath = imageUrl.replace(prefix, '');
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    console.error('商品图片删除失败:', error.message);
  }
}

export async function uploadProductImage(file) {
  // 生成唯一文件名，避免覆盖
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.name}`;

  const { error } = await supabase.storage
    .from('productsImage')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || '图片上传失败');
  }

  const { data: urlData } = supabase.storage
    .from('productsImage')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
