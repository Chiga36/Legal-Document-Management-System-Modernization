import React, { useState, useEffect } from 'react';
import { 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TablePagination, TableRow, IconButton, Button, Chip, Typography,
  TextField, InputAdornment, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, FormControl, InputLabel, MenuItem,
  Select, Box, Tooltip, CircularProgress
} from '@material-ui/core';
import { 
  Delete as DeleteIcon, 
  GetApp as DownloadIcon, 
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  Sort as SortIcon
} from '@material-ui/icons';
import { format } from 'date-fns';
import axios from '../utils/axios';

const DocumentList = () => {
  // State for documents and pagination
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  
  // State for filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // State for dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('read');
  
  // Load documents on mount and when filters change
  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, [page, rowsPerPage, statusFilter, sortField, sortDirection]);
  
  // Fetch documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = `/api/documents?skip=${page * rowsPerPage}&limit=${rowsPerPage}`;
      
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      
      if (sortField) {
        url += `&sortBy=${sortField}:${sortDirection}`;
      }
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await axios.get(url);
      setDocuments(response.data.documents);
      setTotalDocuments(response.data.total);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch users for sharing
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchDocuments();
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  // Handle document deletion
  const handleDeleteDocument = async () => {
    try {
      await axios.delete(`/api/documents/${documentToDelete._id}`);
      setDeleteDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };
  
  // Open share dialog
  const openShareDialog = (document) => {
    setDocumentToShare(document);
    setShareDialogOpen(true);
  };
  
  // Handle document sharing
  const handleShareDocument = async () => {
    try {
      const accessRights = [...documentToShare.accessRights];
      
      // Check if user already has access
      const existingAccessIndex = accessRights.findIndex(
        access => access.user._id === selectedUser
      );
      
      if (existingAccessIndex >= 0) {
        // Update existing access
        accessRights[existingAccessIndex].permission = selectedPermission;
      } else {
        // Add new access
        accessRights.push({
          user: selectedUser,
          permission: selectedPermission
        });
      }
      
      await axios.post(`/api/documents/${documentToShare._id}/access`, {
        accessRights
      });
      
      setShareDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };
  
  // Handle document download
  const handleDownloadDocument = async (document) => {
    try {
      const response = await axios.get(`/api/documents/${document._id}`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };
  
  // Render status chip
  const renderStatusChip = (status) => {
    let color;
    switch (status) {
      case 'draft':
        color = 'default';
        break;
      case 'review':
        color = 'primary';
        break;
      case 'published':
        color = 'secondary';
        break;
      case 'archived':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} color={color} size="small" />;
  };
  
  return (
    <Paper>
      <Box p={2}>
        <Typography variant="h6" component="h2">
          Documents
        </Typography>
        
        {/* Search and filters */}
        <Box display="flex" mb={2} mt={2}>
          <TextField
            label="Search documents"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            style={{ marginRight: 16 }}
          />
          
          <FormControl variant="outlined" size="small" style={{ minWidth: 120, marginRight: 16 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            startIcon={<FilterIcon />}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
      
      {/* Documents table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Title
                  <IconButton size="small" onClick={() => handleSortChange('title')}>
                    <SortIcon fontSize="small" color={sortField === 'title' ? 'primary' : 'action'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Uploaded By
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Status
                  <IconButton size="small" onClick={() => handleSortChange('status')}>
                    <SortIcon fontSize="small" color={sortField === 'status' ? 'primary' : 'action'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  Updated
                  <IconButton size="small" onClick={() => handleSortChange('updatedAt')}>
                    <SortIcon fontSize="small" color={sortField === 'updatedAt' ? 'primary' : 'action'} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => (
                <TableRow key={document._id}>
                  <TableCell>{document.title}</TableCell>
                  <TableCell>{document.uploadedBy?.name || 'Unknown'}</TableCell>
                  <TableCell>{renderStatusChip(document.status)}</TableCell>
                  <TableCell>
                    {format(new Date(document.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {(document.fileSize / 1024).toFixed(1)} KB
                  </TableCell>
                  <TableCell>
                    {document.fileType.split('/')[1]?.toUpperCase() || document.fileType}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleDownloadDocument(document)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownloadDocument(document)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton size="small" onClick={() => openShareDialog(document)}>
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => openDeleteDialog(document)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalDocuments}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the document "{documentToDelete?.title}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteDocument} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Share Document Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      >
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Share "{documentToShare?.title}" with another user
          </DialogContentText>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="user-select-label">User</InputLabel>
            <Select
              labelId="user-select-label"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="permission-select-label">Permission</InputLabel>
            <Select
              labelId="permission-select-label"
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleShareDocument} 
            color="primary"
            disabled={!selectedUser || !selectedPermission}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DocumentList;