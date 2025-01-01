const express = require('express')
const bcrypt = require('bcrypt')
const admin = require('firebase-admin')
const multer = require('multer')

const router = express.Router()
const db = admin.firestore() // Gunakan Firestore

// Konfigurasi multer untuk menyimpan file di folder "uploads"
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Direktori tempat file disimpan
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(null, `${uniqueSuffix}-${file.originalname}`)
	},
})

const upload = multer({ storage })

// Endpoint registrasi
router.post('/register', upload.single('profilePic'), async (req, res) => {
	const { displayName, email, password } = req.body
	const profilePic = req.file ? `/uploads/${req.file.filename}` : '' // Path file yang diunggah

	if (!displayName || !email || !password) {
		return res
			.status(400)
			.json({ error: 'Email, displayName, dan password wajib diisi.' })
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
			profilePic, // Path file yang diunggah
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})

		res
			.status(201)
			.json({ message: 'Registrasi berhasil!', userId, profilePic })
	} catch (error) {
		console.error('Error saat registrasi:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint login
router.post('/login', async (req, res) => {
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
			profilePic: userData.profilePic,
		})
	} catch (error) {
		console.error('Error saat login:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint ambil data pengguna yang sedang login
router.get('/user/:userId', async (req, res) => {
	const { userId } = req.params

	if (!userId) {
		return res.status(400).json({ error: 'User ID wajib diisi.' })
	}

	try {
		const userDoc = await db.collection('users').doc(userId).get()

		if (!userDoc.exists) {
			return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
		}

		const userData = userDoc.data()
		delete userData.password

		res.status(200).json(userData)
	} catch (error) {
		console.error('Error saat mengambil data pengguna:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint update data pengguna
router.put('/user/:userId', async (req, res) => {
	const { userId } = req.params
	const { displayName, email } = req.body

	if (!userId || !displayName || !email) {
		return res
			.status(400)
			.json({ error: 'User ID, displayName, dan email wajib diisi.' })
	}

	try {
		await db.collection('users').doc(userId).update({
			displayName,
			email,
		})

		res.status(200).json({ message: 'Data pengguna berhasil diupdate.' })
	} catch (error) {
		console.error('Error saat mengupdate data pengguna:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint hapus data pengguna
router.delete('/user/:userId', async (req, res) => {
	const { userId } = req.params

	if (!userId) {
		return res.status(400).json({ error: 'User ID wajib diisi.' })
	}

	try {
		await db.collection('users').doc(userId).delete()

		res.status(200).json({ message: 'Data pengguna berhasil dihapus.' })
	} catch (error) {
		console.error('Error saat menghapus data pengguna:', error)
		res.status(500).json({ error: error.message })
	}
})

// Endpoint list data pengguna
router.get('/', async (req, res) => {
	try {
		const usersSnapshot = await db.collection('users').get()
		const users = []

		usersSnapshot.forEach((doc) => {
			users.push(doc.data())
		})

		res.status(200).json(users)
	} catch (error) {
		console.error('Error saat mengambil data pengguna:', error)
		res.status(500).json({ error: error.message })
	}
})

module.exports = router
