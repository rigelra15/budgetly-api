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

const conversations = {}

const promptSchema = Joi.object({
	userId: Joi.string().required(),
	prompt: Joi.string().min(5).max(500).required(),
})

const cleanResponse = (response) => {
	response = response.replace(/\*\*(.*?)\*\*/g, '$1')

	response = response.replace(/^\* /gm, '- ')

	return response
}

app.post('/generate', async (req, res) => {
	const { error } = promptSchema.validate(req.body)
	if (error) {
		return res.status(400).json({ error: error.details[0].message })
	}

	const { userId, prompt } = req.body

	try {
		const previousConversation = conversations[userId] || ''

		const fullPrompt = `${previousConversation}\nYou: ${prompt}\nAI:`

		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
		const result = await model.generateContent(fullPrompt)

		const cleanedResponse = cleanResponse(result.response.text())

		const maxConversationLength = 5
		conversations[userId] = (
			previousConversation + `\nYou: ${prompt}\nAI: ${cleanedResponse}`
		)
			.split('\n')
			.slice(-maxConversationLength * 2)
			.join('\n')

		res.json({ response: cleanedResponse })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/reset-conversation', (req, res) => {
	const { userId } = req.body

	if (!userId) {
		return res.status(400).json({ error: 'userId is required' })
	}

	delete conversations[userId]
	res.json({ message: 'Conversation reset successfully' })
})

app.post('/predict-budget', async (req, res) => {
	const { userId, spendingHistory } = req.body

	if (!userId || !spendingHistory || spendingHistory.length === 0) {
		return res
			.status(400)
			.json({ error: 'UserId and spendingHistory are required.' })
	}

	const prompt = `
		Based on the following spending history:
		${spendingHistory
			.map((item) => `- ${item.date}: ${item.category} - ${item.amount}`)
			.join('\n')}
		Predict the budget for the next month by category and provide a breakdown.
	`

	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
		const result = await model.generateContent(prompt)
		res.json({ response: result.response.text() })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/suggest-savings', async (req, res) => {
	const { userId, spendingData } = req.body

	if (!userId || !spendingData || spendingData.length === 0) {
		return res
			.status(400)
			.json({ error: 'UserId and spendingData are required.' })
	}

	const prompt = `
		Analyze the following spending data and suggest ways to save money:
		${spendingData.map((item) => `- ${item.category}: ${item.amount}`).join('\n')}
	`

	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
		const result = await model.generateContent(prompt)
		res.json({ response: result.response.text() })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/chat-finance', async (req, res) => {
	const { userId, question } = req.body

	if (!userId || !question) {
		return res.status(400).json({ error: 'UserId and question are required.' })
	}

	const prompt = `
		User asked: "${question}"
		Provide a helpful financial tip or response in simple terms.
	`

	try {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
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
