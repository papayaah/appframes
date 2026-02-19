export const handleMediaUpload = async (file: File): Promise<number | null> => {
    try {
        const { importFileToLibrary } = await import('@reactkits.dev/react-media-library');
        const id = await importFileToLibrary(file);
        return typeof id === 'number' ? id : Number(id);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error uploading media:', error);
        return null;
    }
};

export const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return !!target.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
};
