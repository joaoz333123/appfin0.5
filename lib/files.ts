import { supabase } from './supabase';

export async function uploadFile(
  file: File,
  bucket: string = 'pc-anexos',
  path?: string
): Promise<{ url: string; path: string }> {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    const { _data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

export async function deleteFile(
  path: string,
  bucket: string = 'pc-anexos'
): Promise<void> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
}

export async function getFileUrl(
  path: string,
  bucket: string = 'pc-anexos'
): Promise<string> {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf';
}

export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
