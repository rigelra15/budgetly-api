const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const path = require('path')

// Inisialisasi Firebase
admin.initializeApp({
	credential: admin.credential.cert(
		require('./budgetly-app-dcdg-firebase-adminsdk-lsmep-b84b393414.json')
	),
	databaseURL: 'https://budgetly-app-dcdg.firebaseio.com',
})

// Import modul
const userRoutes = require('./routes/users')
const transactionRoutes = require('./routes/transactions')
const budgetRoutes = require('./routes/budgets')
const savingsRoutes = require('./routes/savings')
const aiRoutes = require('./routes/aiInsights')

const app = express()
const PORT = 3000

app.use(bodyParser.json())

// Middleware untuk menyajikan file statis di folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rute API
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/savings', savingsRoutes)
app.use('/api/ai', aiRoutes)

// Jalankan server
app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
