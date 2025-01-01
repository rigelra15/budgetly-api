const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const admin = require('firebase-admin')

admin.initializeApp({
	credential: admin.credential.cert(
		require('./budgetly-app-dcdg-firebase-adminsdk-lsmep-b84b393414.json')
	),
	databaseURL: 'https://budgetly-app-dcdg.firebaseio.com', // Ganti dengan URL database Anda
})

const db = admin.firestore() // Gunakan Firestore
const app = express()
const PORT = 3000

app.use(bodyParser.json())

// Endpoint registrasi
app.post('/api/register', async (req, res) => {
	const { displayName, email, password } = req.body

	if (!displayName || !email || !password) {
		return res.status(400).json({ error: 'Email dan password wajib diisi.' })
	}

	try {
		// Periksa apakah email sudah digunakan
		const emailCheckSnapshot = await db
			.collection('users')
			.where('email', '==', email)
			.get()
		if (!emailCheckSnapshot.empty) {
			return res.status(400).json({ error: 'Email sudah digunakan.' })
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10)

		// Buat ID unik untuk pengguna
		const userId = db.collection('users').doc().id

		// Simpan pengguna ke Firestore
		await db.collection('users').doc(userId).set({
			id: userId,
			email,
			displayName,
			password: hashedPassword,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})

		res.status(201).json({ message: 'Registrasi berhasil!', userId })
	} catch (error) {
		console.error('Error saat registrasi:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint login
app.post('/api/login', async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({ error: 'Email dan password wajib diisi.' })
	}

	try {
		// Cari pengguna berdasarkan email
		const userSnapshot = await db
			.collection('users')
			.where('email', '==', email)
			.get()

		if (userSnapshot.empty) {
			return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
		}

		const userDoc = userSnapshot.docs[0]
		const userData = userDoc.data()

		// Validasi password
		const isPasswordValid = await bcrypt.compare(password, userData.password)
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Password salah.' })
		}

		res.status(200).json({
			message: 'Login berhasil!',
			displayName: userData.displayName,
			userId: userData.id,
			email: userData.email,
		})
	} catch (error) {
		console.error('Error saat login:', error)
		res.status(500).json({ error: error.message })
	}
})

app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
