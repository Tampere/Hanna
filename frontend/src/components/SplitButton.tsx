import { SerializedStyles } from '@emotion/react';
import { ArrowDropDown } from '@mui/icons-material';
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  css,
} from '@mui/material';
import { useRef, useState } from 'react';

interface Props {
  options: string[];
  renderButton: (label: string, selectedIndex: number) => JSX.Element;
  cssProp?: SerializedStyles;
  variant?: 'contained' | 'outlined';
  hideSelectedOptionFromList?: boolean;
  disableButtonSelection?: boolean;
}

export function SplitButton({
  renderButton,
  options,
  cssProp,
  variant = 'outlined',
  hideSelectedOptionFromList,
  disableButtonSelection,
}: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup {...(cssProp && { css: cssProp })} variant={variant} ref={anchorRef}>
        {renderButton(options[selectedIndex], selectedIndex)}
        <Button disabled={disableButtonSelection} size="small" onClick={handleToggle}>
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Popper
        css={css`
          z-index: 101;
        `}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => {
                    if (hideSelectedOptionFromList && index === selectedIndex) {
                      return null;
                    }
                    return (
                      <MenuItem
                        key={option}
                        selected={index === selectedIndex}
                        onClick={(event) => handleMenuItemClick(event, index)}
                      >
                        {option}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
