import React from 'react';
import { useTour } from './TourProvider';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

/**
 * Main Tour component that renders the spotlight and tooltip
 * based on the TourProvider state.
 */
export const Tour: React.FC = () => {
    const { isActive, currentStep, steps, stopTour, nextStep, prevStep, isLastStep } = useTour();

    if (!isActive || steps.length === 0) return null;

    const step = steps[currentStep];

    return (
        <>
            <TourSpotlight
                targetId={step.targetId}
                isActive={isActive}
            />
            <TourTooltip
                step={step}
                currentStepIndex={currentStep}
                totalSteps={steps.length}
                onNext={nextStep}
                onPrev={prevStep}
                onClose={stopTour}
                isLastStep={isLastStep}
                isActive={isActive}
            />
        </>
    );
};
