const express = require('express')
const { createRouteHandler } = require('uploadthing/express')
const uploadRouter = require('./uploadthing')

const app = express()

app.use(
	'/api/uploadthing',
	createRouteHandler({
		router: uploadRouter,
		config: {
			allowedOrigins: ['http://localhost:3000'],
			maxRetries: 3,
		},
	})
)

const PORT = 3000
app.listen(PORT, () => {
	console.log(`Server berjalan di http://localhost:${PORT}`)
})
