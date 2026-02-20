import React from 'react';
import { useLayout } from '../context/LayoutContext';

export interface WelcomeModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** Called when dismissed */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Welcome message */
    message: string;
    /** Image or illustration URL (optional) */
    image?: string;
    /** Primary button label */
    primaryActionLabel?: string;
    /** Called when primary button is clicked */
    onPrimaryAction?: () => void;
    /** Secondary button label */
    secondaryActionLabel?: string;
    /** Called when secondary button is clicked */
    onSecondaryAction?: () => void;
    /** Children for custom content below message */
    children?: React.ReactNode;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    image,
    primaryActionLabel = 'Get Started',
    onPrimaryAction,
    secondaryActionLabel,
    onSecondaryAction,
    children,
}) => {
    const { preset } = useLayout();
    const { Modal, Box, Text, Button } = preset!;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md" centered>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
                {image && (
                    <img
                        src={image}
                        alt={title}
                        style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                )}

                <Box>
                    <Text bold size="lg">{title}</Text>
                    <Text size="md" color="#666" style={{ marginTop: 8 }}>
                        {message}
                    </Text>
                </Box>

                {children}

                <Box style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center', marginTop: 8 }}>
                    {secondaryActionLabel && (
                        <Button variant="secondary" onClick={onSecondaryAction ?? onClose}>
                            {secondaryActionLabel}
                        </Button>
                    )}
                    <Button variant="primary" onClick={onPrimaryAction ?? onClose}>
                        {primaryActionLabel}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
