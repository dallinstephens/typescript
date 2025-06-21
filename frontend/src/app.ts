// Reference for welcomePerson code: 
// https://www.digitalocean.com/community/tutorials/how-to-work-with-typescript-in-visual-studio-code

// export {};

// function welcomePerson(person: Person) {
//   console.log(`Welcome ${person.firstName} ${person.lastName}!`);
//   return `Welcome ${person.firstName} ${person.lastName}!`;
// }

// const dallin = {
//   firstName: "Dallin",
//   lastName: "Stephens"
// };

// welcomePerson(dallin);

// interface Person {
//   firstName: string;
//   lastName: string;
// }

// Get DOM elements
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const uploadButton = document.getElementById('uploadButton') as HTMLButtonElement;
const messageDisplay = document.getElementById('messageDisplay') as HTMLDivElement;
const fileList = document.getElementById('fileList') as HTMLUListElement;
const loadingFilesMessage = document.getElementById('loadingFilesMessage') as HTMLLIElement;

let isLoading: boolean = false; // Global loading state

/**
 * Displays a message in the message display area.
 * @param msg The message to display.
 * @param isError If true, styles the message as an error.
 */
function showMessage(msg: string, isError: boolean = false): void {
    messageDisplay.textContent = msg;
    messageDisplay.classList.remove('hidden', 'bg-blue-50', 'bg-red-50', 'border-blue-200', 'border-red-200', 'text-blue-700', 'text-red-700');
    if (isError) {
        messageDisplay.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
    } else {
        messageDisplay.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
    }
    messageDisplay.classList.remove('hidden');
}

/**
 * Sets the loading state and updates UI accordingly.
 * @param loading Whether the app is currently loading/uploading.
 */
function setLoading(loading: boolean): void {
    isLoading = loading;
    if (loading) {
        uploadButton.disabled = true;
        uploadButton.innerHTML = `<div class="loading-spinner"></div> Uploading...`;
        uploadButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        uploadButton.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-pink-500', 'hover:from-purple-700', 'hover:to-pink-600', 'shadow-lg');
    } else {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload';
        uploadButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        uploadButton.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-500', 'hover:from-purple-700', 'hover:to-pink-600', 'shadow-lg');
    }
}

/**
 * Fetches the list of available files from the server.
 */
async function fetchFiles(): Promise<void> {
    loadingFilesMessage.classList.remove('hidden'); // Show loading message
    fileList.innerHTML = ''; // Clear existing list

    try {
        // Connect to your backend files endpoint
        const response = await fetch('http://localhost:5000/files');
        
        // Ensure response is OK before parsing
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const files: string[] = await response.json(); // For real API

        if (files.length === 0) {
            fileList.innerHTML = '<li class="text-gray-500 text-center">No files available for download.</li>';
        } else {
            files.forEach(filename => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition duration-200 hover:shadow-md';
                listItem.innerHTML = `
                    <span class="text-gray-800 font-medium">${filename}</span>
                    <button
                        data-filename="${filename}"
                        class="download-btn px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg font-medium text-sm transition duration-300 btn-hover btn-active hover:from-pink-600 hover:to-red-600 shadow-md"
                    >
                        Download
                    </button>
                `;
                fileList.appendChild(listItem);
            });
        }
        showMessage('Files loaded successfully from server.');
    } catch (error: any) {
        console.error('Error fetching files:', error);
        showMessage(`Error loading files: ${error.message || 'Unknown error'}`, true);
    } finally {
        loadingFilesMessage.classList.add('hidden'); // Hide loading message
    }
}

/**
 * Handles the file upload process.
 */
async function handleUpload(): Promise<void> {
    const file = fileInput.files ? fileInput.files[0] : null;

    if (!file) {
        showMessage('Please select a file to upload.', true);
        return;
    }

    setLoading(true);
    showMessage('Uploading file...');

    const formData = new FormData();
    formData.append('file', file); // 'file' must match the Multer field name on backend

    try {
        // Connect to your backend upload endpoint
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Upload success:', result);
            showMessage(`File uploaded successfully: ${file.name}`);
            fileInput.value = ''; // Clear the file input
            fetchFiles(); // Refresh the file list
        } else {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            showMessage(`Upload failed: ${response.status} - ${errorText}`, true);
        }
    } catch (error: any) {
        console.error('Error during upload:', error);
        showMessage(`Error uploading file: ${error.message || 'Unknown error'}`, true);
    } finally {
        setLoading(false);
    }
}

/**
 * Handles the file download process.
 * @param filename The name of the file to download.
 */
function handleDownload(filename: string): void {
    showMessage(`Initiating download for ${filename}...`);
    // Connect to your backend download endpoint
    window.location.href = `http://localhost:5000/download/${filename}`;
    showMessage(`Download initiated for ${filename}.`);
}

// Event Listeners
// Fetch files when the page finishes loading
window.addEventListener('load', () => {
    fetchFiles();
});

// Attach event listener to the upload button
uploadButton.addEventListener('click', handleUpload);

// Use event delegation for dynamically added download buttons
fileList.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    // Check if the clicked element (or its parent) has the 'download-btn' class
    if (target.classList.contains('download-btn')) {
        const filename = target.dataset.filename; // Get the filename from the data-filename attribute
        if (filename) {
            handleDownload(filename); // Call the download handler
        }
    }
});

// Display a message when a file is selected in the input
fileInput.addEventListener('change', () => {
    const file = fileInput.files ? fileInput.files[0] : null;
    if (file) {
        showMessage(`File selected: ${file.name}`);
    } else {
        showMessage('No file selected.');
    }
});