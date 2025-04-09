import React, { useState, useCallback, useRef } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Box, 
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  LinearProgress,
  Snackbar
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@material-ui/icons';
import { useDropzone } from 'react-dropzone';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

const DocumentUpload = () => {
  // Auth context for user info and token
  const { currentUser, token } = useAuth();
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Files', 'Document Metadata', 'Review & Upload'];
  
  // File upload state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Metadata state
  const [documentType, setDocumentType] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Document type options
  const documentTypes = [
    'Contract', 
    'Legal Brief', 
    'Court Filing', 
    'Client Communication', 
    'Legal Research', 
    'Memorandum', 
    'Affidavit',
    'Evidence',
    'Other'
  ];
  
  // File upload handler using react-dropzone
  const onDrop = useCallback(acceptedFiles => {
    // Filter for valid file types and size limits
    const validFiles = acceptedFiles.filter(file => {
      // Size limit: 50MB
      const sizeLimit = 50 * 1024 * 1024;
      if (file.size > sizeLimit) {
        setUploadError(`File ${file.name} exceeds the 50MB size limit.`);
        return false;
      }
      
      // Check file type (PDF, DOCX, etc.)
      const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'image/jpeg',
        'image/png'
      ];
      
      if (!validTypes.includes(file.type)) {
        setUploadError(`File ${file.name} has an unsupported format.`);
        return false;
      }
      
      return true;
    });
    
    // Add files to state
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  }, []);
  
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });
  
  // Remove file from list
  const removeFile = (fileIndex) => {
    setFiles(files.filter((_, index) => index !== fileIndex));
  };
  
  // Add tag to metadata
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  // Remove tag from metadata
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle next step in stepper
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step in stepper
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Reset all form fields and go back to first step
  const handleReset = () => {
    setActiveStep(0);
    setFiles([]);
    setDocumentType('');
    setDocumentTitle('');
    setTags([]);
    setCaseNumber('');
    setClientName('');
    setConfidential(false);
    setExpiryDate('');
    setDescription('');
    setUploadProgress({});
    setUploadError('');
    setUploadSuccess(false);
  };
  
  // Upload files to server
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('title', documentTitle || file.name);
        formData.append('tags', JSON.stringify(tags));
        formData.append('caseNumber', caseNumber);
        formData.append('clientName', clientName);
        formData.append('confidential', confidential);
        formData.append('expiryDate', expiryDate);
        formData.append('description', description);
        
        // Upload file with progress tracking
        return axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            
            setUploadProgress(prev => ({
              ...prev,
              [index]: percentCompleted
            }));
          }
        });
      });
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      setUploadSuccess(true);
      // Move to success step or reset form
      setTimeout(() => {
        handleReset();
      }, 3000);
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(
        err.response?.data?.error || 
        'An error occurred during the upload. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };
  
  // Close alert
  const handleCloseAlert = () => {
    setUploadError('');
    setUploadSuccess(false);
  };
  
  // Render step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          // File Selection Step
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Select Documents to Upload
            </Typography>
            
            <Box 
              {...getRootProps()} 
              p={3} 
              border={2} 
              borderRadius={4} 
              borderColor={isDragActive ? 'primary.main' : 'grey.400'} 
              borderStyle="dashed"
              bgcolor={isDragActive ? 'primary.light' : 'background.paper'}
              textAlign="center"
              mb={3}
            >
              <input {...getInputProps()} />
              <UploadIcon style={{ fontSize: 48, color: '#3f51b5', marginBottom: 16 }} />
              <Typography variant="body1" gutterBottom>
                {isDragActive ? 
                  'Drop the files here...' : 
                  'Drag and drop files here, or click to select files'
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supported formats: PDF, Word, Excel, JPEG, PNG (Max size: 50MB)
              </Typography>
            </Box>
            
            {files.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Files ({files.length})
                </Typography>
                <Paper variant="outlined">
                  {files.map((file, index) => (
                    <Box 
                      key={`${file.name}-${index}`}
                      display="flex"
                      alignItems="center"
                      p={1}
                      borderBottom={index < files.length - 1 ? 1 : 0}
                      borderColor="grey.300"
                    >
                      <FileIcon color="primary" style={{ marginRight: 8 }} />
                      <Box flexGrow={1}>
                        <Typography variant="body2" noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => removeFile(index)}
                        aria-label="remove file"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>
        );
        
      case 1:
        return (
          // Metadata Step
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Document Metadata
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel id="document-type-label">Document Type</InputLabel>
                  <Select
                    labelId="document-type-label"
                    id="document-type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    label="Document Type"
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  id="document-title"
                  label="Document Title"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  id="case-number"
                  label="Case Number"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  id="client-name"
                  label="Client Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box mb={1}>
                  <Typography variant="subtitle2">Tags</Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" mb={1}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      color="primary"
                      variant="outlined"
                      style={{ margin: '0 8px 8px 0' }}
                    />
                  ))}
                </Box>
                <Box display="flex">
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="default"
                    startIcon={<AddIcon />}
                    onClick={addTag}
                    style={{ marginLeft: 8 }}
                  >
                    Add
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="confidential-label">Confidentiality</InputLabel>
                  <Select
                    labelId="confidential-label"
                    id="confidential"
                    value={confidential}
                    onChange={(e) => setConfidential(e.target.value)}
                    label="Confidentiality"
                  >
                    <MenuItem value={false}>Standard</MenuItem>
                    <MenuItem value={true}>Confidential</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  id="expiry-date"
                  label="Expiry Date (if applicable)"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  id="description"
                  label="Description"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          // Review Step
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Review & Upload
            </Typography>
            
            <Paper variant="outlined">
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Selected Files:</Typography>
                    <Box pl={2}>
                      {files.map((file, index) => (
                        <Box key={index} display="flex" alignItems="center" mb={1}>
                          <FileIcon color="primary" fontSize="small" style={{ marginRight: 8 }} />
                          <Typography variant="body2">{file.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Metadata:</Typography>
                    <Box pl={2}>
                      <Typography variant="body2"><strong>Type:</strong> {documentType}</Typography>
                      <Typography variant="body2"><strong>Title:</strong> {documentTitle || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Case Number:</strong> {caseNumber || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Client:</strong> {clientName || 'Not specified'}</Typography>
                      <Typography variant="body2"><strong>Confidentiality:</strong> {confidential ? 'Confidential' : 'Standard'}</Typography>
                      {tags.length > 0 && (
                        <Typography variant="body2">
                          <strong>Tags:</strong> {tags.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
            
            {uploading && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Progress:
                </Typography>
                {files.map((file, index) => (
                  <Box key={index} mt={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" noWrap style={{ maxWidth: '80%' }}>
                        {file.name}
                      </Typography>
                      <Typography variant="body2">
                        {uploadProgress[index] || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress[index] || 0}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  // Next button disabled logic
  const isNextDisabled = () => {
    if (activeStep === 0) {
      return files.length === 0;
    }
    if (activeStep === 1) {
      return !documentType || !documentTitle;
    }
    return false;
  };
  
  return (
    <Paper elevation={3}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Upload Documents
        </Typography>
        <Divider style={{ marginBottom: 24 }} />
        
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box mt={4}>
          {getStepContent(activeStep)}
        </Box>
        
        {uploadError && (
          <Box mt={2}>
            <Alert severity="error" onClose={handleCloseAlert}>
              {uploadError}
            </Alert>
          </Box>
        )}
        
        <Box mt={3} display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isNextDisabled()}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      
      <Snackbar 
        open={uploadSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity="success">
          Documents uploaded successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DocumentUpload;