import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, ButtonGroup, ButtonGroupTypeMap, Popover } from '@mui/material';
import { PropsWithChildren, useRef, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

export function SaveOptionsButton(
  props: {
    saveAndReturn: () => void;
    disabled: boolean;
  } & PropsWithChildren,
) {
  const tr = useTranslations();
  const { saveAndReturn } = props;

  const popperRef = useRef<
    React.ElementRef<ButtonGroupTypeMap['defaultComponent']> & {
      clientWidth: number;
    }
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <ButtonGroup
      disabled={props.disabled}
      size="small"
      color="primary"
      variant="contained"
      aria-label="outlined button group"
      ref={popperRef}
    >
      <Button
        onClick={() => {
          saveAndReturn();
        }}
      >
        {tr('projectObjectForm.createAndReturnBtnLabel')}
      </Button>
      <Button onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <ArrowDropUp /> : <ArrowDropDown />}
        <Popover
          open={menuOpen}
          anchorEl={popperRef.current}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          onClose={() => setMenuOpen(false)}
        >
          {props.children}
        </Popover>
      </Button>
    </ButtonGroup>
  );
}
