export async function compareAllSlides(originalId, generateId) {
    return new Promise((resolve, reject) => {
        resolve({
            original: {
                title: '',
                presentationId: originalId,
                imageLinks: [],
            },
            generated: {
                title: '',
                presentationId: generateId,
                imageLinks: [],
            },
        })
    });
}