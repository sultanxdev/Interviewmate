
import fs from 'fs';
import path from 'path';

async function test() {
    try {
        console.log('Importing pdf-parse...');
        const pdf = await import('pdf-parse').then(m => m.default || m);
        console.log('✅ pdf-parse imported');
    } catch (e) {
        fs.writeFileSync('import-error.txt', `pdf-parse error: ${e.message}\n${e.stack}\n`);
    }

    try {
        console.log('Importing mammoth...');
        const mammoth = await import('mammoth');
        console.log('✅ mammoth imported');
    } catch (e) {
        fs.writeFileSync('import-error.txt', `mammoth error: ${e.message}\n${e.stack}\n`, { flag: 'a' });
    }

    try {
        console.log('Importing resumeParser...');
        const resumeParser = await import('../utils/resumeParser.js');
        console.log('✅ resumeParser imported');
    } catch (e) {
        fs.writeFileSync('import-error.txt', `resumeParser error: ${e.stack}\n`, { flag: 'a' });
    }
}

test();
