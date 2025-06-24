import { Box } from '@mui/material';
import Sidebar from '../layouts/Sidebar';
import Navbar from '../layouts/Navbar';
export default function Home() {
  return (
    <>
      <Navbar />
      <Box height={30} />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <h1>Home</h1>
        </Box>
      </Box>
    </>    
  )
}
