import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🌍 Environment variables loaded from root');
if (!process.env.ELEVENLABS_API_KEY) console.warn('⚠️ WARNING: ELEVENLABS_API_KEY is missing — STT and TTS will be unavailable');
if (!process.env.GEMINI_API_KEY) console.warn('⚠️ WARNING: GEMINI_API_KEY is missing in root .env');
