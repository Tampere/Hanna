import { Box, css } from '@mui/material';
import { useEffect, useState } from 'react';

export function StepIndicator({ steps, activeStep }: { steps: number; activeStep: number }) {
  const MAX_VISIBLE_STEPS = 25;
  const [visibleStepRange, setVisibleStepRange] = useState<[number, number]>([
    0,
    MAX_VISIBLE_STEPS - 1,
  ]);
  const withCutOff = steps > MAX_VISIBLE_STEPS;

  function updateStepRange(previousRange: [number, number]): [number, number] {
    if (activeStep === previousRange[0] && previousRange[0] > 0) {
      return [previousRange[0] - 1, previousRange[1] - 1];
    } else if (activeStep === previousRange[1] && previousRange[1] < steps - 1) {
      return [previousRange[0] + 1, previousRange[1] + 1];
    }
    return previousRange;
  }

  useEffect(() => {
    setVisibleStepRange(updateStepRange);
  }, [activeStep]);

  return (
    <Box
      css={css`
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        height: 8px;
      `}
    >
      {Array.from({ length: steps }).map((_, currentStep) => {
        const isEndStep = currentStep === 0 || currentStep === steps - 1;
        if (currentStep < visibleStepRange[0] || currentStep > visibleStepRange[1]) return null;

        return (
          <div
            key={currentStep}
            css={(theme) => css`
              background-color: ${activeStep === currentStep
                ? theme.palette.primary.main
                : '#00000033'};
              border-radius: 50%;
              width: ${activeStep === currentStep
                ? '8px'
                : withCutOff && !isEndStep && visibleStepRange.includes(currentStep)
                  ? '2px'
                  : '4px'};
              height: ${activeStep === currentStep
                ? '8px'
                : withCutOff && !isEndStep && visibleStepRange.includes(currentStep)
                  ? '2px'
                  : '4px'};
              margin: 0 2px;
              -webkit-transition:
                background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
                width 150ms,
                height 150ms;
              transition:
                background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
                width 150ms,
                height 150ms;
            `}
          />
        );
      })}
    </Box>
  );
}
