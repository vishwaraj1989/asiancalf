import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Typography from '@mui/material/Typography';

export default function Account() {
  const { user } = useContext(AuthContext);
  if (!user) return <Typography>Loading...</Typography>;
  return (
    <div>
      <Typography variant="h5">My Account</Typography>
      <Typography>Name: {user.name}</Typography>
      <Typography>Email: {user.email}</Typography>
    </div>
  );
}
