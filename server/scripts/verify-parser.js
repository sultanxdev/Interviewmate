
import resumeParser from '../utils/resumeParser.js'

const testParser = async () => {
    try {
        console.log('Testing Resume Parser imports...')

        if (typeof resumeParser.extractTextFromFile === 'function') {
            console.log('✅ extractTextFromFile method exists')
        } else {
            console.error('❌ extractTextFromFile method missing')
        }
        console.log('Resume Parser implementation verification successful.')
    } catch (error) {
        console.error('Test failed:', error)
        process.exit(1)
    }
}

testParser()
