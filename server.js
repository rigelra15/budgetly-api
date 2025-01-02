const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const path = require('path')
require('dotenv').config()

// Inisialisasi Firebase untuk Firestore dan Authentication
const mainApp = admin.initializeApp(
	{
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
		}),
	},
	'mainApp' // Nama instance utama
)

// Inisialisasi Firebase untuk Storage (project kedua)
const storageApp = admin.initializeApp(
	{
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_STORAGE_PROJECT_ID,
			privateKey: process.env.FIREBASE_STORAGE_PRIVATE_KEY.replace(
				/\\n/g,
				'\n'
			),
			clientEmail: process.env.FIREBASE_STORAGE_CLIENT_EMAIL,
		}),
		storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
	},
	'storageApp' // Nama instance untuk Storage
)

// Inisialisasi bucket Storage
const storageBucket = storageApp.storage().bucket()

// Import modul
const userRoutes = require('./routes/users')
const transactionRoutes = require('./routes/transactions')
const budgetRoutes = require('./routes/budgets')
const savingsRoutes = require('./routes/savings')
const aiRoutes = require('./routes/aiInsights')

// Konfigurasi Express
const app = express()
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())

// Middleware untuk menyajikan file statis di folder 'uploads' (jika digunakan lokal)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rute API
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/savings', savingsRoutes)
app.use('/api/ai', aiRoutes)

// Endpoint Debug untuk Firebase Authentication
app.get('/debug-auth', async (req, res) => {
	try {
		const users = await mainApp.auth().listUsers(10) // Ambil 10 pengguna pertama
		res.json({ message: 'Firebase Authentication terhubung!', users })
	} catch (error) {
		console.error('Error Firebase Authentication:', error)
		res.status(500).json({ error: 'Firebase Authentication tidak terhubung.' })
	}
})

// Endpoint Debug untuk Firebase Storage
app.get('/debug-storage', async (req, res) => {
	try {
		const [files] = await storageBucket.getFiles({ maxResults: 5 }) // Ambil 5 file pertama
		res.json({
			message: 'Firebase Storage terhubung!',
			files: files.map((file) => ({
				name: file.name,
				url: `https://storage.googleapis.com/${storageBucket.name}/${file.name}`, // URL publik file
			})),
		})
	} catch (error) {
		console.error('Error Firebase Storage:', error)
		res.status(500).json({ error: 'Firebase Storage tidak terhubung.' })
	}
})

// Penanganan error global
app.use((err, req, res, next) => {
	console.error('Unhandled Error:', err)
	res.status(500).json({ error: 'Internal Server Error' })
})

// Jalankan server
app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
