import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Lee y procesa mensajes desde un archivo de texto
 * @param fileName - Nombre del archivo a leer
 * @returns Array de mensajes procesados
 */
export const readMessages = (fileName: string): string[] => {
    try {
        const filePath = join(process.cwd(), 'messagesFlow', fileName);
        const content = readFileSync(filePath, 'utf8');
        
        // Divide el contenido por comas y saltos de línea, limpia espacios
        return content
            .split(/,\n/)
            .map(msg => {
                // Elimina las comillas simples del inicio y final
                return msg.trim().replace(/^'|'$/g, '');
            })
            .filter(msg => msg !== '');
    } catch (error) {
        console.error(`Error leyendo archivo de mensajes ${fileName}:`, error);
        return [];
    }
};