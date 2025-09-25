import * as React from 'react';


class GraphicalPassword {

    imageSet: Array<string>;
    selectedImages: Array<number>;
    passwordSequence?: Array<number>;

    constructor(imageSet: Array<string>) {
        this.imageSet = imageSet; // Array of image URLs or IDs
        this.selectedImages = []; // User's password sequence
    }

    // Display images for user to select
    renderImages(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        this.imageSet.forEach((imgSrc, idx) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Password image ${idx + 1}`;
            img.className = 'graphical-password-image';
            img.onclick = () => this.selectImage(idx);
            container.appendChild(img);
        });
    }

    // Handle image selection
    selectImage(imageIndex: any) {
        this.selectedImages.push(imageIndex);
    }

    // Set password (during registration)
    setPassword() {
        this.passwordSequence = [...this.selectedImages];
        this.selectedImages = [];
    }

    // Verify password (during login)
    verifyPassword(inputSequence: any) {
        if (!this.passwordSequence) return false;
        return JSON.stringify(this.passwordSequence) === JSON.stringify(inputSequence);
    }

    // Reset selection
    resetSelection() {
        this.selectedImages = [];
    }
}

export default GraphicalPassword;