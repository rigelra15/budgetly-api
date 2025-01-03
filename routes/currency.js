const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/', async (req, res) => {
	try {
		const currencies = req.query.currencies || 'EUR,USD,CAD,IDR' // Mata uang default
		const apiUrl = `https://api.freecurrencyapi.com/v1/latest`

		if (!process.env.CURRENCY_API_KEY) {
			return res.status(500).json({ error: 'API Key tidak ditemukan.' })
		}

		// Fetch dari API eksternal
		const response = await axios.get(apiUrl, {
			params: {
				apikey: process.env.CURRENCY_API_KEY,
				currencies,
			},
		})

		// Format data yang diterima
		const currencyData = response.data.data
		const currencyList = Object.keys(currencyData).map((currencyCode) => ({
			currency: currencyCode,
			rate: currencyData[currencyCode],
		}))

		res.status(200).json({ currencies: currencyList })
	} catch (error) {
		console.error(
			'Error saat mengambil data mata uang:',
			error.response?.data || error.message
		)
		res.status(500).json({ error: 'Gagal mengambil data mata uang.' })
	}
})

module.exports = router