import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// Context & Provider
export interface TourStep {
    targetId: string;
    title: string;
    content: string;
    position: 'right' | 'left' | 'top' | 'bottom';
}

interface TourContextValue {
    isActive: boolean;
    currentStep: number;
    steps: TourStep[];
    startTour: (steps: TourStep[], startAt?: number) => void;
    stopTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    setStep: (step: number) => void;
    isLastStep: boolean;
    isFirstStep: boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);

    const startTour = useCallback((newSteps: TourStep[], startAt = 0) => {
        setSteps(newSteps);
        setCurrentStep(startAt);
        setIsActive(true);
    }, []);

    const stopTour = useCallback(() => {
        setIsActive(false);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, [steps.length]);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const setStep = useCallback((step: number) => {
        setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
    }, [steps.length]);

    const isLastStep = useMemo(() => currentStep === steps.length - 1, [currentStep, steps.length]);
    const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);

    const value = useMemo(() => ({
        isActive,
        currentStep,
        steps,
        startTour,
        stopTour,
        nextStep,
        prevStep,
        setStep,
        isLastStep,
        isFirstStep,
    }), [isActive, currentStep, steps, startTour, stopTour, nextStep, prevStep, setStep, isLastStep, isFirstStep]);

    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
