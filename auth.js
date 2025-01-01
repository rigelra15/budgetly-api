const express = require('express')
const bodyParser = require('body-parser')
const admin = require('firebase-admin')

// Inisialisasi Firebase Admin SDK
admin.initializeApp({
	credential: admin.credential.cert(
		require('./budgetly-app-dcdg-firebase-adminsdk-lsmep-b84b393414.json')
	),
})

const app = express()
const PORT = 3000

// Middleware
app.use(bodyParser.json())

// Endpoint untuk registrasi akun
app.post('/api/register', async (req, res) => {
	const { email, password, displayName } = req.body

	if (!email || !password) {
		return res.status(400).json({ error: 'Email dan password wajib diisi.' })
	}

	try {
		// Buat pengguna baru di Firebase Authentication
		const userRecord = await admin.auth().createUser({
			email,
			password,
			displayName,
		})

		return res.status(201).json({
			message: 'Pengguna berhasil didaftarkan.',
			name: userRecord.displayName,
			uid: userRecord.uid,
		})
	} catch (error) {
		console.error('Error saat mendaftarkan pengguna:', error)
		return res.status(500).json({ error: error.message })
	}
})

// Endpoint untuk login akun
app.post('/api/login', async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({ error: 'Email dan password wajib diisi.' })
	}

	try {
		// Verifikasi pengguna menggunakan Firebase Admin SDK
		const user = await admin.auth().getUserByEmail(email)
		if (!user) {
			return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
		}

		// Untuk login, Anda biasanya menggunakan custom token atau verifikasi lain di client-side.
		// Karena Firebase tidak menyimpan password plaintext, validasi password dilakukan di client.
		return res.status(200).json({
			message: 'Login berhasil.',
			uid: user.uid,
			email: user.email,
			displayName: user.displayName,
		})
	} catch (error) {
		console.error('Error saat login pengguna:', error)
		return res.status(500).json({ error: error.message })
	}
})

app.post('/api/verify-token', async (req, res) => {
	const { idToken } = req.body

	if (!idToken) {
		return res.status(400).json({ error: 'ID Token tidak ditemukan.' })
	}

	try {
		const decodedToken = await admin.auth().verifyIdToken(idToken)
		return res.status(200).json({
			message: 'Token valid.',
			uid: decodedToken.uid,
			email: decodedToken.email,
		})
	} catch (error) {
		console.error('Error saat verifikasi token:', error)
		return res.status(401).json({ error: 'Token tidak valid.' })
	}
})

// Jalankan server
app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
