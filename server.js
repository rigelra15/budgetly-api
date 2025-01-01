const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const path = require('path')
require('dotenv').config()

// Inisialisasi Firebase
admin.initializeApp({
	credential: admin.credential.cert({
		projectId: process.env.FIREBASE_PROJECT_ID,
		privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
	}),
})

// Import modul
const userRoutes = require('./routes/users')
const transactionRoutes = require('./routes/transactions')
const budgetRoutes = require('./routes/budgets')
const savingsRoutes = require('./routes/savings')
const aiRoutes = require('./routes/aiInsights')

const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())

// Middleware untuk menyajikan file statis di folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rute API
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/savings', savingsRoutes)
app.use('/api/ai', aiRoutes)

app.get('/debug', async (req, res) => {
	try {
		const users = await admin.auth().listUsers(10) // Ambil 10 pengguna pertama
		res.json({ message: 'Firebase SDK terhubung!', users })
	} catch (error) {
		console.error('Error Firebase SDK:', error)
		res.status(500).json({ error: 'Firebase SDK tidak terhubung.' })
	}
})

// Jalankan server
app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
