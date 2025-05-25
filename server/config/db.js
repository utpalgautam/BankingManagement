require('dotenv').config()
const mongoose = require('mongoose')

const connctToDB = async () => {
    try {
        mongoose.connect(
        process.env.MONGO_URI,
        )
        console.log('MONGODB CONNECTED SUCCESSFULLY')
    } catch(e) {
        console.log('MONGODB CONNECTION FAILED')
        process.exit(1)
    }
}

module.exports = connctToDB