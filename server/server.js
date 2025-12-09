const express = require('express');
const cors = require('cors');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.post("/analyze",upload.array("files"), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded." });
    }

    const uploadedFiles = req.files;
    const userPrompt = req.body.userprompt || "";
    console.log("------------------------------------------------");
    console.log(`RECEIVED ${uploadedFiles.length} FILES:`);
    // List all filenames
    uploadedFiles.forEach((f, index) => {
        console.log(` ${index + 1}. ${f.originalname}`);
    });
    console.log("Prompt:", userPrompt);
    console.log("------------------------------------------------");
    res.json({
        answer: `Success! I received ${uploadedFiles.length} files and your prompt: "${userPrompt}"`,
        sources: ["Server Log"]
    });

})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});