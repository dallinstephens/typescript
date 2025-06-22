import express, { Request, Response } from 'express'; // Import Request and Response types for explicit typing
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Define the type for the Multer file object
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer; // For memory storage, if applicable
}

const storage = multer.diskStorage({
    destination: (req: Request, file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
        const originalname = file.originalname;
        const ext = path.extname(originalname); // This gets the extension such as .jpg.
        const nameWithoutExt = path.basename(originalname, ext); // This is the filename without the extension.

        let newFilename = originalname;
        let counter = 0;
        let filePath = path.join(UPLOAD_DIR, newFilename);

        // This loop is find if the same file frog.jpg has been uploaded before including with a numerical suffix such frog (1).jpg, frog (2).jpg, etc.
        while (fs.existsSync(filePath)) {
            counter++;
            newFilename = `${nameWithoutExt} (${counter})${ext}`;
            filePath = path.join(UPLOAD_DIR, newFilename);
        }

        cb(null, newFilename);
        // cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
    // Multer adds a 'file' property to the request object if upload.single() is used
    const uploadedFile = req.file as MulterFile; // Type assertion for req.file

    if (!uploadedFile) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    console.log(`File uploaded: ${uploadedFile.filename}`);
    res.status(200).json({
        message: 'File uploaded successfully!',
        filename: uploadedFile.filename,
        path: uploadedFile.path
    });
});

app.get('/files', (req: Request, res: Response) => {
    fs.readdir(UPLOAD_DIR, (err: NodeJS.ErrnoException | null, files: string[]) => {
        if (err) {
            console.error('Error reading upload directory:', err);
            return res.status(500).json({ message: 'Error retrieving files.' });
        }
        const fileNames = files.filter(name => fs.lstatSync(path.join(UPLOAD_DIR, name)).isFile());
        res.status(200).json(fileNames);
    });
});

app.get('/download/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.access(filePath, fs.constants.F_OK, (err: NodeJS.ErrnoException | null) => {
        if (err) {
            console.error(`File not found: ${filePath}`, err);
            return res.status(404).json({ message: 'File not found.' });
        }
        res.download(filePath, filename, (downloadErr: Error | null) => {
            if (downloadErr) {
                console.error(`Error downloading file ${filename}:`, downloadErr);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Could not download the file.' });
                }
            } else {
                console.log(`File ${filename} downloaded successfully.`);
            }
        });
    });
});

// This is used to delete a file.
app.delete('/delete/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);

    // This checks to see if the file exists before deciding to delete it.
    fs.access(filePath, fs.constants.F_OK, (err: NodeJS.ErrnoException | null) => {
        if (err) {
            console.error(`File not found for deletion: ${filePath}`, err);
            return res.status(404).json({ message: 'File not found.'});
        }

        // This deletes the file.
        fs.unlink(filePath, (unlinkErr: NodeJS.ErrnoException | null) => {
            if (unlinkErr) {
                console.error(`Error deleting file ${filename}:`, unlinkErr);
                return res.status(500).json({ message: 'Could not delete the file.' });               
            }
            console.log(`File deleted: ${filename}`);
            res.status(200).json({ message: `File ${filename} deleted successfully.`});
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Uploads directory: ${UPLOAD_DIR}`);
});