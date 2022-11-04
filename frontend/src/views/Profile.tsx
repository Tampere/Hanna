import { Logout } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';

import { authAtom } from '@frontend/stores/auth';
import { Language, langAtom } from '@frontend/stores/lang';

export function Profile() {
  const [user] = useAtom(authAtom);
  const [lang, setLang] = useAtom(langAtom);

  return (
    user.userId && (
      <Box>
        <Typography variant="h4">Hei {user.userId}</Typography>
        <Typography variant="body1">Tässä on profiilisi tiedot</Typography>
        <select value={lang} onChange={(e) => setLang(e.target.value as Language)}>
          <option value="fi">Suomi</option>
          <option value="en">English</option>
        </select>
        <Box>
          <Button
            variant="contained"
            endIcon={<Logout />}
            onClick={async () => {
              const resp = await fetch(`/api/v1/user/logout`);
              if (!resp.ok) console.log('virhe');
            }}
          >
            Kirjaudu ulos
          </Button>
        </Box>
      </Box>
    )
  );
}
