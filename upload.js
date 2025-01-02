const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')

const app = express()
const router = express.Router()

app.use(bodyParser.json())
const upload = multer({ storage: multer.memoryStorage() })

;(async () => {
	const { Uploadthing } = await import('uploadthing')
	const uploadthing = new Uploadthing(process.env.UPLOADTHING_API_KEY)

	router.post('/upload', upload.single('file'), async (req, res) => {
		try {
			const userId = req.body.userId

			if (!req.file || !userId) {
				return res.status(400).json({ error: 'File dan userId wajib diisi.' })
			}

			const result = await uploadthing.uploadFile(req.file.buffer, {
				path: `profiles/${userId}/${Date.now()}-${req.file.originalname}`,
			})

			res.status(200).json({
				message: 'File berhasil diunggah!',
				fileUrl: result.url,
			})
		} catch (error) {
			console.error('Error saat mengunggah file:', error)
			res.status(500).json({ error: error.message })
		}
	})

	app.use('/api', router)

	app.listen(3000, () => {
		console.log('Server is running on port 3000')
	})
})()
