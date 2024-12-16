import {
  DeleteTwoTone,
  Done,
  EditTwoTone,
  InfoOutlined,
  MoreVert,
  RefreshTwoTone,
} from '@mui/icons-material';
import {
  ClickAwayListener,
  Fade,
  Grow,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  SvgIcon,
  Theme,
  Tooltip,
  Typography,
  css,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

type EditFunction = 'delete' | 'rename' | 'refresh';

const infoPopperStyle = (theme: Theme) => css`
  text-align: center;
  position: relative;
  font-weight: 500;
  font-size: 12px;
  padding: 6px;
  background-color: white;
  color: ${theme.palette.primary.main};
  border: 1px solid ${theme.palette.primary.main};
  width: 200px;
  border-radius: 50px;
  transform: translateY(-10px);
`;

const editFunctionElements = {
  delete: (
    <>
      <ListItemIcon>
        <DeleteTwoTone color="primary" />
      </ListItemIcon>
      <ListItemText>poista</ListItemText>
    </>
  ),
  rename: (
    <>
      <ListItemIcon>
        <EditTwoTone color="primary" />
      </ListItemIcon>
      <ListItemText>uudelleennimeä</ListItemText>
    </>
  ),
  refresh: (
    <>
      <ListItemIcon key="refresh-item">
        <RefreshTwoTone color="primary" />
      </ListItemIcon>
      <ListItemText>päivitä</ListItemText>
    </>
  ),
};

interface Props {
  textContent?: string;
  onInputSave: (newTextContent: string) => void;
  onDelete: () => void;
  handleChipClick?: () => void;
  onCancel?: () => void;
  enabledEditFunctions?: EditFunction[];
  isValid?: boolean;
  isSelected: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  validateInput: (input: string) => boolean;
}

export function MultiFunctionChip({
  textContent,
  onInputSave,
  onDelete,
  handleChipClick,
  enabledEditFunctions,
  isSelected,
  isValid = true,
  onCancel,
  isEditing,
  setIsEditing,
  validateInput,
}: Props) {
  const [inputText, setInputText] = useState(textContent ?? '');
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showInvalidInputPopper, setShowInvalidInputPopper] = useState(false);
  const tr = useTranslations();

  const editMenuAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!textContent) {
      setIsEditing(true);
      inputRef.current?.focus();
    }
  }, []);

  const editFunctions = {
    delete: onDelete,
    rename: () => {
      setIsEditing(true);
      inputRef.current?.focus();
      setShowEditMenu(false);
    },
    refresh: () => {
      onInputSave(inputText);
      setShowEditMenu(false);
    },
  };

  return (
    <ClickAwayListener
      onClickAway={() => {
        setShowEditMenu(false);
        if (
          isEditing &&
          !showInvalidInputPopper &&
          inputText.length > 0 &&
          inputText !== textContent
        ) {
          onInputSave(inputText);
        } else if (isEditing) {
          onCancel?.();
        }
      }}
    >
      <div
        role={isEditing ? 'textbox' : 'button'}
        {...(!isSelected && {
          onClick: () => {
            if (!isEditing) handleChipClick?.();
          },
        })}
        title={inputText}
        ref={editMenuAnchorRef}
        css={(theme) => css`
          cursor: ${isEditing ? 'default' : 'pointer'};
          height: 30px;
          max-width: 200px;
          border-radius: 15px;
          border: ${isEditing
            ? `3px solid ${theme.palette.primary.main}`
            : isSelected
              ? `1px solid ${theme.palette.primary.main}`
              : 'none'};
          padding: 12px;
          display: flex;
          align-items: center;
          :hover {
            background-color: ${isEditing
              ? 'white'
              : isSelected
                ? theme.palette.primary.dark
                : 'rgba(0, 0, 0, 0.12)'};
            input {
              color: ${isEditing ? 'black' : isSelected ? 'white' : 'black'};
            }
            button,
            svg:not(.submit-icon) {
              fill: white;
              color: white;
            }
          }
          background-color: ${isEditing
            ? 'white'
            : isSelected
              ? isValid
                ? theme.palette.primary.main
                : 'white'
              : '#00000014'};
        `}
      >
        <Popper
          open={showInvalidInputPopper}
          placement="top"
          anchorEl={editMenuAnchorRef.current}
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps}>
              <Typography css={infoPopperStyle}>{tr('savedSearchFilter.nameReserved')}</Typography>
            </Fade>
          )}
        </Popper>
        <input
          {...(isSelected && {
            onClick: () => {
              if (!isEditing) handleChipClick?.();
            },
          })}
          onInput={(e) => {
            if (!validateInput((e.target as HTMLInputElement).value)) {
              setShowInvalidInputPopper(true);
            } else if (showInvalidInputPopper) {
              setShowInvalidInputPopper(false);
            }
          }}
          ref={inputRef}
          onKeyDown={(e) => {
            if (!isEditing) return;
            if (e.key === 'Escape') {
              onCancel?.();
              setInputText(textContent ?? '');
              setIsEditing(false);
              setShowInvalidInputPopper(false);
            } else if (e.key === 'Enter' && !showInvalidInputPopper) {
              setIsEditing(false);
              onInputSave(inputText);
            }
          }}
          value={inputText}
          readOnly={!isEditing}
          css={(theme) => css`
            text-align: center;
            border: 0;
            outline: 0;
            min-width: 40px;
            width: ${inputText.length * 6}px;
            cursor: ${isEditing ? 'text' : 'pointer'};
            color: ${isEditing
              ? 'black'
              : isSelected
                ? isValid
                  ? 'white'
                  : theme.palette.primary.main
                : 'black'};
            padding: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 12px;
            background-color: transparent;
          `}
          onChange={(e) => setInputText(e.target.value)}
        />

        {!isValid && (
          <Tooltip title={tr('savedSearchFilters.filterChangedTooltip')}>
            <SvgIcon>
              <InfoOutlined fontSize="small" color="primary" />
            </SvgIcon>
          </Tooltip>
        )}
        {isEditing && (
          <IconButton
            disabled={showInvalidInputPopper}
            css={css`
              padding: 0;
              transform: translateX(8px);
              margin-left: auto;
            `}
            onClick={() => onInputSave(inputText)}
          >
            <Done className="submit-icon" color="primary" fontSize="small" />
          </IconButton>
        )}
        {enabledEditFunctions && isSelected && !isEditing && (
          <>
            <IconButton
              size="small"
              css={(theme) => css`
                color: ${isSelected ? (isValid ? 'white' : theme.palette.primary.main) : 'black'};
                transform: translateX(4px);
                padding: 0;
                border-radius: 50%;
                margin-left: auto;
              `}
              onClick={() => setShowEditMenu((prev) => !prev)}
            >
              <MoreVert fontSize="inherit" />
            </IconButton>

            <Popper
              open={showEditMenu}
              anchorEl={editMenuAnchorRef.current}
              placement="bottom-end"
              transition
              css={css`
                z-index: 1000;
              `}
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                  <Paper
                    css={(theme) => css`
                      text-transform: uppercase;
                      color: ${theme.palette.primary.main};
                      & .MuiButtonBase-root {
                        padding: 4px 10px;
                      }
                      & .MuiTypography-root {
                        font-weight: 500;
                        font-size: 13px;
                      }
                      & .MuiListItemIcon-root {
                        min-width: 35px;
                      }
                    `}
                  >
                    <List>
                      {enabledEditFunctions.map((editFunction) => {
                        if (editFunction === 'refresh' && isValid) {
                          return null;
                        }
                        return (
                          <ListItemButton
                            key={editFunction}
                            onClick={() => editFunctions[editFunction]()}
                          >
                            {editFunctionElements[editFunction]}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </>
        )}
      </div>
    </ClickAwayListener>
  );
}
