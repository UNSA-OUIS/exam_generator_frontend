import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

export function LevelForm() {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el nivel
    console.log('Level name:', name);
    setName('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', gap: 2 }}>
      <TextField
        label="Level name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />  
      <Button type="submit" variant="contained" color="primary">
        Create Level
      </Button>
    </Box>
  );
}