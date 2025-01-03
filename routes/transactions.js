const express = require('express')
const admin = require('firebase-admin')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const router = express.Router()
const db = admin.app('mainApp').firestore()
const storageBucket = admin.app('storageApp').storage().bucket()

// Konfigurasi multer untuk menangani file upload
const upload = multer({
	storage: multer.memoryStorage(),
})

// Endpoint untuk mencatat transaksi baru dengan foto dan catatan
router.post('/add', upload.array('photos', 10), async (req, res) => {
	const {
		userId,
		type,
		amount,
		category,
		date,
		description,
		currency,
		account,
		note,
	} = req.body

	if (
		!userId ||
		!type ||
		!amount ||
		!category ||
		!date ||
		!currency ||
		!account
	) {
		return res.status(400).json({ error: 'Field wajib diisi.' })
	}

	try {
		// Konversi amount ke integer
		const parsedAmount = parseInt(amount, 10)
		if (isNaN(parsedAmount)) {
			return res.status(400).json({ error: 'Amount harus berupa angka valid.' })
		}

		const transactionId = db.collection('transactions').doc().id

		let photoPaths = []
		if (req.files) {
			// Simpan setiap file foto ke path "budgetly/transactions/{userId}/{transactionId}/{uuidv4}"
			for (const file of req.files) {
				const uniqueFileName = `budgetly/transactions/${userId}/${transactionId}/${uuidv4()}-${
					file.originalname
				}`
				const fileRef = storageBucket.file(uniqueFileName)

				await fileRef.save(file.buffer, {
					metadata: { contentType: file.mimetype },
				})

				photoPaths.push(uniqueFileName)
			}
		}

		// Simpan transaksi ke Firestore
		await db
			.collection('transactions')
			.doc(transactionId)
			.set({
				transactionId,
				userId,
				type,
				amount: parsedAmount, // Simpan amount sebagai integer
				category,
				currency,
				account,
				date: new Date(date),
				description: description || '',
				note: note || '',
				photos: photoPaths, // Simpan path foto di Firestore
			})

		res
			.status(201)
			.json({ message: 'Transaksi berhasil dicatat!', transactionId })
	} catch (error) {
		console.error('Error mencatat transaksi:', error)
		res.status(500).json({ error: 'Gagal mencatat transaksi.' })
	}
})

// Endpoint untuk menghapus transaksi
router.delete('/:transactionId', async (req, res) => {
	const { transactionId } = req.params

	if (!transactionId) {
		return res.status(400).json({ error: 'ID transaksi wajib diisi.' })
	}

	try {
		await db.collection('transactions').doc(transactionId).delete()

		res.status(200).json({ message: 'Transaksi berhasil dihapus.' })
	} catch (error) {
		console.error('Error menghapus transaksi:', error)
		res.status(500).json({ error: 'Gagal menghapus transaksi.' })
	}
})

// Endpoint untuk mengupdate transaksi
router.put('/:transactionId', async (req, res) => {
	const { transactionId } = req.params
	const { type, amount, category, date, description, currency, account } =
		req.body

	if (
		!transactionId ||
		!type ||
		!amount ||
		!category ||
		!date ||
		!currency ||
		!account
	) {
		return res.status(400).json({ error: 'Field wajib diisi.' })
	}

	try {
		const parsedAmount = parseInt(amount, 10)
		if (isNaN(parsedAmount)) {
			return res.status(400).json({ error: 'Amount harus berupa angka valid.' })
		}

		await db
			.collection('transactions')
			.doc(transactionId)
			.update({
				type,
				amount: parsedAmount,
				category,
				currency,
				account,
				date: new Date(date),
				description: description || '',
			})

		res.status(200).json({ message: 'Transaksi berhasil diupdate.' })
	} catch (error) {
		console.error('Error mengupdate transaksi:', error)
		res.status(500).json({ error: 'Gagal mengupdate transaksi.' })
	}
})

// Endpoint untuk mendapatkan data transaksi
router.get('/:transactionId', async (req, res) => {
	const { transactionId } = req.params

	if (!transactionId) {
		return res.status(400).json({ error: 'ID transaksi wajib diisi.' })
	}

	try {
		const transaction = await db
			.collection('transactions')
			.doc(transactionId)
			.get()

		if (!transaction.exists) {
			return res.status(404).json({ error: 'Transaksi tidak ditemukan.' })
		}

		res.status(200).json({ ...transaction.data(), transactionId })
	} catch (error) {
		console.error('Error saat mengambil data transaksi:', error)
		res.status(500).json({ error: 'Gagal mengambil data transaksi.' })
	}
})

router.get('/currency', async (req, res) => {
	try {
		const currencies = 'EUR,USD,CAD,IDR' // Mata uang yang ingin diambil
		const apiUrl = `https://api.freecurrencyapi.com/v1/latest`

		// Fetch dari API eksternal
		const response = await axios.get(apiUrl, {
			params: {
				apikey: process.env.CURRENCY_API_KEY, // API Key FreeCurrencyAPI
				currencies, // Mata uang yang dipilih
			},
		})

		// Format data yang diterima
		const currencyData = response.data.data

		// Ubah data ke bentuk array (opsional jika diperlukan)
		const currencyList = Object.keys(currencyData).map((currencyCode) => ({
			currency: currencyCode,
			rate: currencyData[currencyCode],
		}))

		res.status(200).json({ currencies: currencyList })
	} catch (error) {
		console.error('Error saat mengambil data mata uang:', error.message)
		res.status(500).json({ error: 'Gagal mengambil data mata uang.' })
	}
})

// Endpoint untuk mendapatkan foto transaksi dengan Signed URL
router.get('/:transactionId/photos', async (req, res) => {
	const { transactionId } = req.params

	if (!transactionId) {
		return res.status(400).json({ error: 'ID transaksi wajib diisi.' })
	}

	try {
		const transactionDoc = await db
			.collection('transactions')
			.doc(transactionId)
			.get()

		if (!transactionDoc.exists) {
			return res.status(404).json({ error: 'Transaksi tidak ditemukan.' })
		}

		const transactionData = transactionDoc.data()
		const photoPaths = transactionData.photos || []

		const signedUrls = await Promise.all(
			photoPaths.map(async (filePath) => {
				const options = {
					version: 'v4',
					action: 'read',
					expires: Date.now() + 15 * 60 * 1000, // Signed URL berlaku 15 menit
				}

				const [signedUrl] = await storageBucket
					.file(filePath)
					.getSignedUrl(options)
				return signedUrl
			})
		)

		res.status(200).json({ signedUrls })
	} catch (error) {
		console.error('Error saat mendapatkan Signed URL foto:', error)
		res.status(500).json({ error: 'Gagal mendapatkan Signed URL foto.' })
	}
})

module.exports = router
