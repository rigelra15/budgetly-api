const express = require('express')
const admin = require('firebase-admin')
const router = express.Router()
const db = admin.firestore()

// Endpoint untuk mencatat transaksi baru
router.post('/', async (req, res) => {
	const { userId, type, amount, category, date, description } = req.body

	if (!userId || !type || !amount || !category || !date) {
		return res.status(400).json({ error: 'Field wajib diisi.' })
	}

	try {
		const transactionId = db.collection('transactions').doc().id

		await db
			.collection('transactions')
			.doc(transactionId)
			.set({
				transactionId,
				userId,
				type,
				amount,
				category,
				date: new Date(date),
				description: description || '',
			})

		res
			.status(201)
			.json({ message: 'Transaksi berhasil dicatat!', transactionId })
	} catch (error) {
		console.error('Error mencatat transaksi:', error)
		res.status(500).json({ error: 'Gagal mencatat transaksi.' })
	}
})

module.exports = router
