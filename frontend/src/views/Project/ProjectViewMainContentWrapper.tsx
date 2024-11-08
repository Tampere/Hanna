import { Paper, css } from '@mui/material';
import { useSetAtom } from 'jotai';
import { PropsWithChildren, useEffect, useRef, useState } from 'react';

import { ExpandButton } from '@frontend/components/ExpandButton';
import { useTranslations } from '@frontend/stores/lang';
import { noGeomInfoBoxAtom } from '@frontend/stores/map';

interface Props extends PropsWithChildren {
  renderForm: () => JSX.Element | null;
  formWidth?: number;
}

export function ProjectViewMainContentWrapper(props: Props) {
  const [formVisible, setFormVisible] = useState(true);
  const setNoGeomInfoBoxAvailable = useSetAtom(noGeomInfoBoxAtom);
  const tr = useTranslations();

  const formWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formVisible) {
      formWrapperRef.current?.scrollTo(0, 0);
    }
  }, [formVisible]);

  useEffect(() => {
    setNoGeomInfoBoxAvailable(true);
  }, []);

  const shiftOnHide = ((props.formWidth ?? 400) - 30) * -1;

  return (
    <div
      css={css`
        display: grid;
        transition: grid-template-columns 0.3s;
        grid-template-columns: ${formVisible
          ? `${props.formWidth ?? 400}px minmax(512px, 2fr)`
          : '30px minmax(512px, 2fr)'};
        gap: 16px;
        height: 100%;
        flex: 1;
        overflow: hidden;
        padding: 0 16px;
      `}
    >
      <Paper
        ref={formWrapperRef}
        css={css`
          transform: translateX(${formVisible ? 0 : shiftOnHide}px);
          padding: 24px;
          height: 100%;
          overflow-y: auto;
          position: relative;
          width: ${props.formWidth ?? 400}px;
          transition: transform ease-out 0.3s;
          overflow-y: ${formVisible ? 'auto' : 'hidden'};
          form {
            transition: opacity 0.5s;
            opacity: ${formVisible ? 1 : 0};
          }
        `}
        variant="outlined"
      >
        <ExpandButton
          cssProp={css`
            position: absolute;
            top: 2px;
            right: 2px;
          `}
          iconOrientation="horizontal"
          expandedTitle={tr('projectView.hideForm')}
          collapsedTitle={tr('projectView.showForm')}
          expanded={formVisible}
          setExpanded={setFormVisible}
        />
        {props.renderForm()}
      </Paper>
      {props.children}
    </div>
  );
}
