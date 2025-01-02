const { v4: uuidv4 } = require('uuid')
const express = require('express')
const bcrypt = require('bcrypt')
const admin = require('firebase-admin')
const multer = require('multer')
const fs = require('fs')

const router = express.Router()
const db = admin.app('mainApp').firestore()
const storageBucket = admin.app('storageApp').storage().bucket()

const upload = multer({ storage: multer.memoryStorage() })

const generateSignedUrl = async (fileName) => {
	const options = {
		version: 'v4',
		action: 'read',
		expires: Date.now() + 15 * 60 * 1000,
	}

	try {
		const [url] = await storageBucket.file(fileName).getSignedUrl(options)
		return url
	} catch (error) {
		console.error('Error generating signed URL:', error)
		throw error
	}
}

router.post('/register', upload.single('profilePic'), async (req, res) => {
	const { displayName, email, password } = req.body

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

		let profilePicPath = null

		if (req.file) {
			// Jika ada file yang diunggah
			const uniqueFileName = `budgetlyApp/profiles/${uuidv4()}-${
				req.file.originalname
			}`
			const file = storageBucket.file(uniqueFileName)

			// Simpan file ke Firebase Storage
			await file.save(req.file.buffer, {
				metadata: { contentType: req.file.mimetype },
			})

			profilePicPath = uniqueFileName
		} else {
			// Jika tidak ada file yang diunggah, gunakan foto default
			profilePicPath = 'budgetlyApp/profiles/person_default.png' // Lokasi foto default
		}

		// Simpan pengguna ke Firestore
		await db.collection('users').doc(userId).set({
			id: userId,
			email,
			displayName,
			password: hashedPassword,
			profilePic: profilePicPath, // Path ke foto profil (default atau unggahan)
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})

		res.status(201).json({
			message: 'Registrasi berhasil!',
			userId,
			profilePicPath,
		})
	} catch (error) {
		console.error('Error saat registrasi:', error)
		res.status(500).json({ error: error.message })
	}
})

router.post('/login', async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({ error: 'Email dan password wajib diisi.' })
	}

	try {
		const userSnapshot = await db
			.collection('users')
			.where('email', '==', email)
			.get()

		if (userSnapshot.empty) {
			return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
		}

		const userDoc = userSnapshot.docs[0]
		const userData = userDoc.data()

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

router.get('/user/:userId/profile-pic', async (req, res) => {
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
		const filePath = userData.profilePic

		if (!filePath) {
			return res.status(404).json({ error: 'Foto profil tidak ditemukan.' })
		}

		const options = {
			version: 'v4',
			action: 'read',
			expires: Date.now() + 15 * 60 * 1000,
		}

		const [signedUrl] = await storageBucket.file(filePath).getSignedUrl(options)

		res.status(200).json({ signedUrl })
	} catch (error) {
		console.error('Error saat membuat Signed URL:', error)
		res.status(500).json({ error: error.message })
	}
})

router.put(
	'/user/:userId/profile-pic',
	upload.single('profilePic'),
	async (req, res) => {
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

			let profilePicPath = userData.profilePic
			if (req.file) {
				const uniqueFileName = `budgetlyApp/profiles/${uuidv4()}-${
					req.file.originalname
				}`
				const file = storageBucket.file(uniqueFileName)

				await file.save(req.file.buffer, {
					metadata: { contentType: req.file.mimetype },
				})

				profilePicPath = uniqueFileName
			}

			await db.collection('users').doc(userId).update({
				profilePic: profilePicPath,
			})

			res
				.status(200)
				.json({ message: 'Foto profil berhasil diupdate.', profilePicPath })
		} catch (error) {
			console.error('Error saat mengupdate foto profil:', error)
			res.status(500).json({ error: error.message })
		}
	}
)

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
