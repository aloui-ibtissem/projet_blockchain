import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, Collapse, CircularProgress, Alert,
  Checkbox, FormControlLabel, List, ListItem, ListItemText, IconButton, Divider, Chip
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;
const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      },
    },
  },
});

function DashboardEtudiant() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const [message, setMessage] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [cibles, setCibles] = useState({
    EncadrantAcademique: false,
    EncadrantProfessionnel: false,
  });
  const [rapport, setRapport] = useState(null);

  // Form handling with React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      sujet: '',
      objectifs: '',
      dateDebut: '',
      dateFin: '',
      encadrantAcademique: '',
      encadrantProfessionnel: '',
    },
  });

  // Authentication check
  React.useEffect(() => {
    if (!token || role !== 'Etudiant') return navigate('/login');
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate, token, role]);

  // Data fetching with React Query
  const { data: currentStage, isLoading: stageLoading } = useQuery({
    queryKey: ['stage'],
    queryFn: () => axios.get(`${API_URL}/stage/mon-stage`, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
    }).then(res => res.data),
    enabled: !!token,
  });

  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => axios.get(`${API_URL}/stage/notifications`, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
    }).then(res => res.data),
    enabled: !!token,
  });

  const { data: stagesHistoriques = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['stagesHistoriques'],
    queryFn: () => axios.get(`${API_URL}/stage/historique`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),
    enabled: !!token,
  });

  const { data: rapportsHistoriques = [], isLoading: rapportsLoading } = useQuery({
    queryKey: ['rapports'],
    queryFn: () => axios.get(`${API_URL}/rapport/mes-rapports`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.data),
    enabled: !!token,
  });

  const { data: commentaires = [], isLoading: commentairesLoading } = useQuery({
    queryKey: ['commentaires', currentStage?.rapportId],
    queryFn: () => axios.get(`${API_URL}/rapport/commentaires/${currentStage?.rapportId}`, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
    }).then(res => res.data),
    enabled: !!currentStage?.rapportId,
  });

  const { data: attestationUrl, isLoading: attestationLoading, refetch: fetchAttestation } = useQuery({
    queryKey: ['attestation'],
    queryFn: () => axios.get(`${API_URL}/attestation/etudiant/ma-attestation`, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
    }).then(res => res.data.attestationUrl || ''),
    enabled: false,
  });

  // Mutations for form submissions
  const proposeStageMutation = useMutation({
    mutationFn: (data) => axios.post(`${API_URL}/stage/proposer`, data, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
    }),
    onSuccess: () => {
      setMessage('Stage proposé avec succès.');
      reset();
      queryClient.invalidateQueries(['stage', 'stagesHistoriques', 'notifications']);
      setTimeout(() => setMessage(''), 5000);
    },
    onError: () => setMessage('Erreur lors de la proposition du stage.'),
  });

  const submitRapportMutation = useMutation({
    mutationFn: (formData) => axios.post(`${API_URL}/rapport/soumettre`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        withCredentials: true,
        'Content-Type': 'multipart/form-data',
      },
    }),
    onSuccess: () => {
      setMessage('Rapport soumis avec succès.');
      setRapport(null);
      setCibles({ EncadrantAcademique: false, EncadrantProfessionnel: false });
      queryClient.invalidateQueries(['stage', 'rapports', 'stagesHistoriques', 'notifications']);
      setTimeout(() => setMessage(''), 5000);
    },
    onError: () => setMessage('Erreur lors de la soumission du rapport.'),
  });

  const downloadAttestationMutation = useMutation({
    mutationFn: () => axios.get(`${API_URL}/attestation/download`, {
      headers: { Authorization: `Bearer ${token}`, withCredentials: true },
      responseType: 'blob',
    }),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attestation.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onError: () => setMessage('Erreur lors du téléchargement.'),
  });

  // Form submission handlers
  const onProposeStage = (data) => proposeStageMutation.mutate(data);

  const onSubmitRapport = () => {
    if (!rapport) return setMessage('Veuillez sélectionner un fichier.');
    const destinataires = Object.keys(cibles).filter(k => cibles[k]);
    if (destinataires.length === 0) return setMessage('Veuillez cocher au moins un encadrant.');
    const formData = new FormData();
    formData.append('fichier', rapport);
    formData.append('cibles', JSON.stringify(destinataires));
    submitRapportMutation.mutate(formData);
  };

  const handleCheckboxChange = (e) => setCibles({ ...cibles, [e.target.name]: e.target.checked });

  if (stageLoading || notifLoading || stagesLoading || rapportsLoading || commentairesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Tableau de Bord Étudiant
        </Typography>
        {message && (
          <Alert severity={message.includes('Erreur') ? 'error' : 'success'} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {/* Notifications */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications <Chip label={notifications.length} color="secondary" size="small" />
            </Typography>
            <IconButton onClick={() => setShowNotif(!showNotif)}>
              {showNotif ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </CardContent>
          <Collapse in={showNotif}>
            <CardContent sx={{ maxHeight: 180, overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                <List>
                  {notifications.map(n => (
                    <ListItem key={n.id} divider>
                      <ListItemText
                        primary={n.message}
                        secondary={new Date(n.date_envoi).toLocaleDateString()}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Aucune notification</Typography>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Current Stage */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Stage Actuel</Typography>
                {currentStage ? (
                  <>
                    <Typography><strong>ID:</strong> {currentStage.identifiant_unique}</Typography>
                    <Typography><strong>Titre:</strong> {currentStage.titre}</Typography>
                    <Typography><strong>Entreprise:</strong> {currentStage.entreprise}</Typography>
                    <Typography>
                      <strong>Période:</strong> {new Date(currentStage.dateDebut).toLocaleDateString()} → {new Date(currentStage.dateFin).toLocaleDateString()}
                    </Typography>
                    <Typography><strong>Encadrant Académique:</strong> {currentStage.acaPrenom} {currentStage.acaNom}</Typography>
                    <Typography><strong>Encadrant Professionnel:</strong> {currentStage.proPrenom} {currentStage.proNom}</Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">Aucun stage en cours.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Historical Stages */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Stages Historiques</Typography>
                {stagesHistoriques.length > 0 ? (
                  <List>
                    {stagesHistoriques.map((s, i) => (
                      <ListItem key={i} divider>
                        <ListItemText
                          primary={`${s.identifiant_unique} — ${s.titre} — ${s.entreprise}`}
                          secondary={
                            <>
                              Période: {new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}
                              <br />
                              {s.identifiantRapport && (
                                <a href={`${BASE}/Uploads/${s.fichier}`} target="_blank" rel="noreferrer">Voir le rapport</a>
                              )}
                              {s.ipfsUrl && (
                                <>
                                  {' | '}
                                  <a href={s.ipfsUrl} target="_blank" rel="noreferrer">Voir l’attestation</a>
                                </>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">Aucun stage historique encore.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Propose Stage */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Proposer un Stage</Typography>
                <form onSubmit={handleSubmit(onProposeStage)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Sujet"
                        {...register('sujet', { required: 'Sujet est requis' })}
                        error={!!errors.sujet}
                        helperText={errors.sujet?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Objectifs"
                        {...register('objectifs', { required: 'Objectifs sont requis' })}
                        error={!!errors.objectifs}
                        helperText={errors.objectifs?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date de Début"
                        InputLabelProps={{ shrink: true }}
                        {...register('dateDebut', { required: 'Date de début est requise' })}
                        error={!!errors.dateDebut}
                        helperText={errors.dateDebut?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Date de Fin"
                        InputLabelProps={{ shrink: true }}
                        {...register('dateFin', { required: 'Date de fin est requise' })}
                        error={!!errors.dateFin}
                        helperText={errors.dateFin?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Encadrant Académique"
                        {...register('encadrantAcademique', { required: 'Email est requis', pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' } })}
                        error={!!errors.encadrantAcademique}
                        helperText={errors.encadrantAcademique?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Encadrant Professionnel"
                        {...register('encadrantProfessionnel', { required: 'Email est requis', pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' } })}
                        error={!!errors.encadrantProfessionnel}
                        helperText={errors.encadrantProfessionnel?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" color="primary" type="submit">
                        Soumettre
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Rapport */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Soumettre un Rapport</Typography>
                <Box>
                  {Object.keys(cibles).map(name => (
                    <FormControlLabel
                      key={name}
                      control={<Checkbox name={name} checked={cibles[name]} onChange={handleCheckboxChange} />}
                      label={`Envoyer à ${name}`}
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  type="file"
                  inputProps={{ accept: '.pdf,.doc,.docx' }}
                  onChange={e => setRapport(e.target.files[0])}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={onSubmitRapport}>
                  Envoyer
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Historical Reports */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Rapports</Typography>
                {rapportsHistoriques.length > 0 ? (
                  <List>
                    {rapportsHistoriques.map((r, i) => (
                      <ListItem key={i} divider>
                        <ListItemText
                          primary={`${r.identifiantRapport} — ${r.titre}`}
                          secondary={<a href={`${BASE}/Uploads/${r.fichier}`} target="_blank" rel="noreferrer">Voir PDF</a>}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">Aucun rapport validé encore.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Attestation */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Attestation</Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => fetchAttestation()}
                  disabled={attestationLoading}
                  sx={{ mr: 2 }}
                >
                  Vérifier
                </Button>
                {attestationUrl && (
                  <Typography sx={{ mt: 2 }}>
                    <a href={attestationUrl} target="_blank" rel="noreferrer">Voir l’attestation en ligne</a>
                  </Typography>
                )}
                {attestationUrl && (
                  <Button variant="outlined" onClick={() => downloadAttestationMutation.mutate()} sx={{ mt: 2 }}>
                    Télécharger
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardEtudiant />
    </QueryClientProvider>
  );
}

export default App;