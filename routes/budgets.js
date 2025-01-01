const express = require('express')
const admin = require('firebase-admin')
const router = express.Router()
const db = admin.firestore()

// Endpoint untuk menambahkan anggaran
router.post('/', async (req, res) => {
	const { userId, category, amount, monthYear } = req.body

	if (!userId || !category || !amount || !monthYear) {
		return res.status(400).json({ error: 'Field wajib diisi.' })
	}

	try {
		const budgetId = db.collection('budgets').doc().id

		await db.collection('budgets').doc(budgetId).set({
			budgetId,
			userId,
			category,
			amount,
			monthYear,
		})

		res
			.status(201)
			.json({ message: 'Anggaran berhasil ditambahkan!', budgetId })
	} catch (error) {
		console.error('Error menambahkan anggaran:', error)
		res.status(500).json({ error: 'Gagal menambahkan anggaran.' })
	}
})

module.exports = router
