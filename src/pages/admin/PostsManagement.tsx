import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/auth';
import EnhancedQuillEditor from '../../components/EnhancedQuillEditor';
import BasicQuillEditor from '../../components/BasicQuillEditor';
import '../../styles/PostsManagement.css';
import '../../styles/QuillEditorFixes.css';

// ... rest of the file 