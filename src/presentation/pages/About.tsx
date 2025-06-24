import { Box } from '@mui/material';
import Sidebar from '../layouts/Sidebar';
import Navbar from '../layouts/Navbar';

export default function About() {
  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <h1>About</h1>
        </Box>
      </Box>
    </>    
  )
}
