import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../messagesFlow/dmsgWrongResponses.txt');

export async function errorMessage(): Promise<string> {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const messages = data.split('\n')
            .map(line => line.trim().replace(/^'|'$/g, '').replace(/',$/, '')) // Eliminar comillas simples y comas al inicio y al final
            .filter(line => line.length > 0);
        const randomIndex = Math.floor(Math.random() * messages.length);
        return messages[randomIndex];
    } catch (error) {
        console.error('Error reading error messages:', error);
        return 'Ocurrió un error. Por favor, intenta nuevamente.';
    }
}