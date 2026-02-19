import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface UseProjectImportDropProps {
    onImportProject: (file: File) => Promise<void>;
}

export function useProjectImportDrop({ onImportProject }: UseProjectImportDropProps) {
    const [importDragOver, setImportDragOver] = useState(false);
    const importDragCounter = useRef(0);
    const importProjectRef = useRef(onImportProject);

    // Keep ref up to date
    useEffect(() => {
        importProjectRef.current = onImportProject;
    }, [onImportProject]);

    useEffect(() => {
        const isAppframesDrag = (e: DragEvent) => {
            if (!e.dataTransfer) return false;
            let hasFile = false;
            let hasImage = false;
            // Check if any dragged item looks like an .appframes or .zip file
            // During dragenter/dragover we can't see filenames, but we can see MIME types.
            // If we see an image type, it's definitely NOT an appframes project file import.
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i];
                if (item.kind === 'file') {
                    hasFile = true;
                    if (item.type.startsWith('image/')) {
                        hasImage = true;
                        break;
                    }
                }
            }
            return hasFile && !hasImage;
        };

        const handleDragEnter = (e: DragEvent) => {
            if (!isAppframesDrag(e)) return;
            e.preventDefault();
            importDragCounter.current++;
            if (importDragCounter.current === 1) {
                setImportDragOver(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            importDragCounter.current--;
            if (importDragCounter.current <= 0) {
                importDragCounter.current = 0;
                setImportDragOver(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            // Always preventDefault for file drags so the browser allows the drop event to fire
            if (importDragCounter.current > 0 || isAppframesDrag(e)) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
            }
        };

        const handleDrop = async (e: DragEvent) => {
            // Always prevent the browser's default drop behavior (navigating to the file)
            e.preventDefault();
            e.stopPropagation();

            importDragCounter.current = 0;
            setImportDragOver(false);

            if (!e.dataTransfer?.files.length) return;

            const file = e.dataTransfer.files[0];
            const name = file.name.toLowerCase();
            if (!name.endsWith('.appframes') && !name.endsWith('.zip')) return;

            notifications.show({ id: 'import', title: 'Importing project', message: 'Processing archive...', loading: true, autoClose: false });
            try {
                await importProjectRef.current(file);
                notifications.update({ id: 'import', title: 'Import complete', message: 'Project imported successfully.', loading: false, autoClose: 3000 });
            } catch (err) {
                notifications.update({ id: 'import', title: 'Import failed', message: err instanceof Error ? err.message : 'Unknown error', color: 'red', loading: false, autoClose: 5000 });
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    return { importDragOver };
}
