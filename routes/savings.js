const express = require('express')
const admin = require('firebase-admin')
const router = express.Router()
const db = admin.app('mainApp').firestore()

// Endpoint untuk menambahkan tabungan baru
router.post('/', async (req, res) => {
	const { userId, goal, targetAmount, currentAmount, deadline } = req.body

	if (!userId || !goal || !targetAmount || !deadline) {
		return res.status(400).json({ error: 'Field wajib diisi.' })
	}

	try {
		const savingId = db.collection('savings').doc().id

		await db
			.collection('savings')
			.doc(savingId)
			.set({
				savingId,
				userId,
				goal,
				targetAmount,
				currentAmount: currentAmount || 0,
				deadline: new Date(deadline),
			})

		res
			.status(201)
			.json({ message: 'Tabungan berhasil ditambahkan!', savingId })
	} catch (error) {
		console.error('Error menambahkan tabungan:', error)
		res.status(500).json({ error: 'Gagal menambahkan tabungan.' })
	}
})

module.exports = router
