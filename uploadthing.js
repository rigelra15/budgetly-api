const { createUploadthing } = require('uploadthing/express')

// Inisialisasi Uploadthing
const f = createUploadthing({
	apiKey: process.env.UPLOADTHING_API_KEY,
})

// Definisikan router unggahan file
const uploadRouter = {
	// File route untuk mengunggah gambar
	imageUploader: f({
		image: {
			maxFileSize: '4MB', // Maksimal ukuran file 4MB
			maxFileCount: 1, // Maksimal jumlah file 1
		},
	}).onUploadComplete((data) => {
		// Callback setelah unggahan selesai
		console.log('Upload selesai:', data)
	}),
}

module.exports = uploadRouter
