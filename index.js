const express = require('express')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const rateLimit = require('express-rate-limit')
const Joi = require('joi')
const cors = require('cors')
const helmet = require('helmet')

const app = express()
app.use(express.json())
app.use(cors())
app.use(helmet())
require('dotenv').config()

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: 'Too many requests, please try again later.',
})
app.use(limiter)

const apiKey = process.env.GENERATIVE_AI_KEY
if (!apiKey) {
	throw new Error('API Key is missing. Please set GENERATIVE_AI_KEY.')
}

const genAI = new GoogleGenerativeAI(apiKey)

const promptSchema = Joi.object({
	prompt: Joi.string().min(5).max(500).required(),
})

app.post('/generate', async (req, res) => {
	const { error } = promptSchema.validate(req.body)
	if (error) {
		return res.status(400).json({ error: error.details[0].message })
	}

	const { prompt } = req.body

	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
		const result = await model.generateContent(prompt)
		res.json({ response: result.response.text() })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
