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

// These are common image extensions.
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

/**
 * This will be used to see if file
 * uploaded is an image or not. If it is an image, and image thumbnail of
 * the image will display. If the file uploaded is not an image, a standard
 * placeholder thumbnail image will display.
 * @param filename The name of the file.
 * @returns True if it's an image file, false otherwise.
 */

function isImageFile(filename: string): boolean {
    const parts = filename.split('.');
    if (parts.length > 1) {
        const extension = parts[parts.length - 1].toLowerCase();
        return IMAGE_EXTENSIONS.includes(extension);
    }
    return false;
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
        uploadButton.classList.remove('bg-gradient-to-r', 'from-red-700', 'to-red-500', 'hover:from-red-800', 'hover:to-red-600', 'shadow-lg');
    } else {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload';
        uploadButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        uploadButton.classList.add('bg-gradient-to-r', 'from-red-700', 'to-red-500', 'hover:from-red-800', 'hover:to-red-600', 'shadow-lg');
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
                listItem.className = 'flex items-center justify-between bg-white p-2 rounded-lg shadow-sm border border-gray-400 transition duration-200 hover:shadow-md';
                
                // Display thumbnail image if it is image. Otherwise, display placeholder thumbnail image.
                let fileThumbnailHtml = '';
                if (isImageFile(filename)) {
                    fileThumbnailHtml = `
                        <img
                            src="http://localhost:5000/download/${filename}"
                            alt="${filename}"
                            class="w-12 h-12 object-cover rounded-md border border-gray-300"
                            onerror="this.onerror=null;this.style.display='none';"
                        />`;
                }
                else {
                    fileThumbnailHtml = `
                    <div class="w-12 h-12 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-500">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>`;
                }
                
                listItem.innerHTML = `
                    <div class="flex items-center space-x-2">
                        ${fileThumbnailHtml}
                        <span class="text-gray-800 font-medium flex-grow min-w-0 break-words">${filename}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button
                            data-filename="${filename}"
                            class="download-btn px-4 py-2 bg-gradient-to-r from-red-700 to-red-500 text-white rounded-lg font-medium text-sm transition duration-300 btn-hover btn-active hover:from-red-800 hover:to-red-600 shadow-md"
                        >
                            Download
                        </button>
                        <button
                            data-filename="${filename}"
                            class="delete-btn px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-lg font-medium text-sm transition duration-300 btn-hover btn-active hover:from-gray-900 hover:to-gray-700 shadow-md" 
                        >
                            Delete
                        </button>
                    </div>
                `;
                fileList.appendChild(listItem);
            });
        }
        if (files.length === 0) {
            showMessage('Welcome to File Manager!');
        }
        else {
            showMessage('Files loaded successfully from server.');
        }
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

/**
 * This is used to delete files.
 * @param filename The name of the file to delete.
 */
async function handleDelete(filename: string): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return; // This means the user cancelled the deletion.
    }

    setLoading(true); // This indicates the loading state.
    showMessage(`Deleteing file: ${filename}...`);

    try {
        const response = await fetch(`http://localhost:5000/delete/${filename}`, {
            method: 'DELETE', // Use DELETE HTTP method
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Delete success:', result);
            showMessage(`File deleted successfully: ${filename}`);
            fetchFiles(); // Refresh the file list after deletion.
        }
        else {
            const errorText = await response.text();
            console.error('Delete failed', response.status, errorText);
            showMessage(`Delete failed: ${response.status} - ${errorText}`, true);
        }
    }
    catch (error: any) {
        console.error('Error during deletion:', error);
        showMessage(`Error deleting file: ${error.message || 'Unknown error'}`, true);
    }
    finally {
        setLoading(false); // Reset loading state.
    }
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
    // Check if the clicked element (or its parent) has the 'delete-btn' class.
    else if (target.classList.contains('delete-btn')) {
        const filename = target.dataset.filename; // Get the filename from the data-filename attribute.
        if (filename) {
            handleDelete(filename); // Call the delete handler.
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