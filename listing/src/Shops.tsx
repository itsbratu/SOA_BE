import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { io } from 'socket.io-client';
import { useUser } from 'login/UserStorage';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Typography,
  Container,
  Grid,
  Paper,
} from '@mui/material';
import { LocationOn, AttachMoney, CalendarToday, Store } from '@mui/icons-material';
import { styled } from '@mui/system';

export type Shop = {
  id: string;
  name: string;
  location: string;
  income: number;
  openedAt: Date;
};

// Styled components for custom styles
const StyledButton = styled(Button)({
  backgroundColor: '#007BFF',
  color: 'white',
  padding: '10px 20px',
  fontSize: '16px',
  borderRadius: '5px',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#0056b3',
  },
});

const StyledPaper = styled(Paper)({
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  position: 'relative', // For positioning delete and edit buttons
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
  },
});

const ButtonWrapper = styled('div')({
  position: 'absolute',
  top: '10px',
  right: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

const ShopList: React.FC = () => {
  const { user, setUser } = useUser();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [firstFetch, setFirstFetch] = useState(true);
  const [newShop, setNewShop] = useState<Shop>({
    id: '',
    name: '',
    location: '',
    income: 0,
    openedAt: new Date(),
  });
  const [editingShop, setEditingShop] = useState<Shop | null>(null); // For editing
  const [isEditMode, setIsEditMode] = useState(false); // For checking edit mode
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();

  const logout = () => {
    setUser(null);
  };

  const socket = io('http://localhost:3006');

  socket.on('notification', () => {
    setSnackbarMessage('Updated the shops listing');
    setSnackbarOpen(true);
  });

  // Fetch shops data
  const { data: shops, error, isLoading } = useQuery<Shop[]>(
    'shops',
    async () => {
      const response = await fetch('http://localhost:3000/shops');
      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }
      return response.json();
    },
    {
      refetchInterval: 10000,
      onSuccess: () => {
        if (!firstFetch) {
          setSnackbarMessage('Updated the shops listing');
          setSnackbarOpen(true);
        } else {
          setFirstFetch(false);
        }
      },
    }
  );

  useEffect(() => {
    if (snackbarOpen) {
      const timer = setTimeout(() => {
        setSnackbarOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbarOpen]);

  // Add shop mutation
  const addShopMutation = useMutation(
    async (newShop: Shop) => {
      const response = await fetch('http://localhost:3000/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShop),
      });

      if (!response.ok) {
        throw new Error('Failed to add shop');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shops');
        setOpenDialog(false);
        setNewShop({
          id: '',
          name: '',
          location: '',
          income: 0,
          openedAt: new Date(),
        });
      },
      onError: (error) => {
        console.error('Error adding shop:', error);
      },
    }
  );

  // Edit shop mutation
  const editShopMutation = useMutation(
    async (updatedShop: Shop) => {
      const response = await fetch(`http://localhost:3000/shops/${updatedShop.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedShop),
      });

      if (!response.ok) {
        throw new Error('Failed to update shop');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('shops');
        setOpenDialog(false);
        setEditingShop(null); // Reset after update
        setIsEditMode(false); // Disable edit mode
      },
      onError: (error) => {
        console.error('Error updating shop:', error);
      },
    }
  );

  // Delete shop mutation
  const deleteShopMutation = useMutation(
    async (shopId: string) => {
      const response = await fetch(`http://localhost:3000/shops/${shopId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete shop');
      }

      return shopId; // Return shopId to remove it from the cache
    },
    {
      onSuccess: (shopId) => {
        queryClient.invalidateQueries('shops');
        console.log(`Shop with id ${shopId} deleted`);
      },
      onError: (error) => {
        console.error('Error deleting shop:', error);
      },
    }
  );

  const validateForm = (): boolean => {
    const shopToValidate = isEditMode ? editingShop : newShop;
    const { name , location, income, openedAt } = shopToValidate || {
      name: '',
      location: '',
      income: 100,
      openedAt: ''
    };

    return (
      !!name &&
      !!location &&
      (isEditMode ? true : income > 0) &&
      !isNaN(income) &&
      new Date(openedAt) <= new Date()
    );
  };
  

  const handleAddShopSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      addShopMutation.mutate(newShop);
    } else {
      alert('Please fill in all fields correctly.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (isEditMode && editingShop) {
      setEditingShop((prevState) => ({
        ...prevState!,
        [name]: name === 'openedAt' ? new Date(value) : value,
      }));
    } else {
      setNewShop((prevState) => ({
        ...prevState,
        [name]: name === 'openedAt' ? new Date(value) : value,
      }));
    }
  };

  // Handle shop deletion
  const handleDeleteShop = (shopId: string) => {
    deleteShopMutation.mutate(shopId);
  };

  // Handle shop editing
  const handleEditShop = (shop: Shop) => {
    setEditingShop({
      ...shop,
      openedAt: new Date(shop.openedAt), // Ensure openedAt is Date object
    });
    setIsEditMode(true);
    setOpenDialog(true);
  };

  // Reset new shop form when opening add new shop dialog
  const handleOpenAddShopDialog = () => {
    setIsEditMode(false); // Set edit mode to false
    setNewShop({
      id: '',
      name: '',
      location: '',
      income: 0,
      openedAt: new Date(),
    }); // Reset the new shop form
    setOpenDialog(true); // Open the dialog
  };

  return (
    <Container>
      {user ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <StyledButton onClick={logout}>Logout</StyledButton>
            <StyledButton onClick={handleOpenAddShopDialog} style={{ backgroundColor: '#28a745' }}>
              Add Shop
            </StyledButton>
          </div>

          <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
            <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>

          <Grid container spacing={2}>
            {isLoading ? (
              <Typography variant="h6">Loading...</Typography>
            ) : error ? (
              <Typography variant="h6" color="error">Error fetching shops</Typography>
            ) : (
              shops?.map((shop) => (
                <Grid item xs={12} md={6} key={shop.id}>
                  <StyledPaper elevation={3}>
                    <Typography variant="h6" sx={{marginBottom: '10px'}}>{shop.name}</Typography>
                    <Typography variant="body1" display="flex" alignItems="center" style={{ marginBottom: '10px' }}>
                      <LocationOn style={{ marginRight: '8px' }} />
                      {shop.location}
                    </Typography>
                    <Typography variant="body1" display="flex" alignItems="center" style={{ marginBottom: '10px', color: shop.income > 0 ? 'green' : 'red'}}>
                      <AttachMoney style={{ marginRight: '8px' }} />
                      {shop.income.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" display="flex" alignItems="center" style={{ marginBottom: '10px' }}>
                      <CalendarToday style={{ marginRight: '8px' }} />
                      {new Date(shop.openedAt).toLocaleDateString()}
                    </Typography>

                    <ButtonWrapper>
                      <Button color="error" onClick={() => handleDeleteShop(shop.id)} variant="outlined">Delete</Button>
                      <Button color="primary" onClick={() => handleEditShop(shop)} variant="outlined">Edit</Button>
                    </ButtonWrapper>
                  </StyledPaper>
                </Grid>
              ))
            )}
          </Grid>

          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>{isEditMode ? 'Edit Shop' : 'Add Shop'}</DialogTitle>
            <DialogContent>
              <TextField
                label="Shop Name"
                name="name"
                value={isEditMode ? editingShop?.name : newShop.name}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                helperText="Insert the name of the shop"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Store /></InputAdornment>,
                }}
              />
              <TextField
                label="Location"
                name="location"
                value={isEditMode ? editingShop?.location : newShop.location}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                helperText="Insert the location of the shop"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                }}
              />
              {!isEditMode && <TextField
                label="Income"
                name="income"
                type="number"
                value={isEditMode ? editingShop?.income : newShop.income}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                helperText="Insert the income of the shop"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>,
                }}
              />}
              <TextField
                label="Opened At"
                name="openedAt"
                value={isEditMode ? editingShop?.openedAt?.toISOString().split('T')[0] : newShop.openedAt?.toISOString().split('T')[0]}
                onChange={handleInputChange}
                type="date"
                fullWidth
                required
                margin="normal"
                helperText="Select the opening date of the shop"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CalendarToday /></InputAdornment>,
                }}
                inputProps={{
                  max: new Date().toISOString().split('T')[0], // Limit to today or earlier
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={isEditMode ? () => editShopMutation.mutate(editingShop!) : handleAddShopSubmit}
                color="primary"
                disabled={!validateForm()}
              >
                {isEditMode ? 'Edit' : 'Add'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography variant="h6" align="center">
          Please log in to manage shops
        </Typography>
      )}
    </Container>
  );
};

export default ShopList;
