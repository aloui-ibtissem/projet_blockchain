import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
const API_URL = BASE.includes('/api') ? BASE : `${BASE}/api`;

export default function DashboardEtudiant() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const role = localStorage.getItem("role")

  const [form, setForm] = useState({ sujet: "", objectifs: "", dateDebut: "", dateFin: "", encadrantAcademique: "", encadrantProfessionnel: "" })
  const [rapport, setRapport] = useState(null)
  const [cibles, setCibles] = useState({ EncadrantAcademique: false, EncadrantProfessionnel: false })
  const [message, setMessage] = useState("")
  const [notifications, setNotifications] = useState([])
  const [currentStage, setCurrentStage] = useState(null)
  const [commentaires, setCommentaires] = useState([])
  const [attestationUrl, setAttestationUrl] = useState("")
  const [stagesHistoriques, setStagesHistoriques] = useState([])
  const [rapportsHistoriques, setRapportsHistoriques] = useState([])

  useEffect(() => {
    if (!token || role !== "Etudiant") return navigate("/login")
    const decoded = jwtDecode(token)
    if (decoded.exp < Date.now() / 1000) {
      localStorage.clear()
      return navigate("/login")
    }
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([fetchStage(), fetchNotifications(), fetchMesRapports(), fetchStagesHistoriques()])
    } catch {
      setMessage("Erreur lors du chargement initial.")
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleCheckboxChange = (e) => setCibles({ ...cibles, [e.target.name]: e.target.checked })

  const proposeStage = async () => {
    try {
      await axios.post(`${API_URL}/stage/proposer`, form, { headers: { Authorization: `Bearer ${token}` } })
      setMessage("Stage proposé.")
      setForm({ sujet: "", objectifs: "", dateDebut: "", dateFin: "", encadrantAcademique: "", encadrantProfessionnel: "" })
      await fetchStage()
    } catch {
      setMessage("Erreur lors de la proposition.")
    }
  }

  const submitRapport = async () => {
    if (!rapport) return setMessage("Sélectionnez un fichier.")
    const destinataires = Object.keys(cibles).filter((k) => cibles[k])
    if (destinataires.length === 0) return setMessage("Choisissez au moins un encadrant.")

    const formData = new FormData()
    formData.append("fichier", rapport)
    formData.append("cibles", JSON.stringify(destinataires))

    try {
      await axios.post(`${API_URL}/rapport/soumettre`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setMessage("Rapport soumis.")
      await fetchMesRapports()
    } catch {
      setMessage("Erreur envoi rapport.")
    }
  }

  const fetchStage = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/mon-stage`, { headers: { Authorization: `Bearer ${token}` } })
      setCurrentStage(res.data)
      if (res.data?.rapportId) fetchCommentaires(res.data.rapportId)
    } catch {
      setCurrentStage(null)
    }
  }

  const fetchCommentaires = async (rapportId) => {
    try {
      const res = await axios.get(`${API_URL}/rapport/commentaires/${rapportId}`, { headers: { Authorization: `Bearer ${token}` } })
      setCommentaires(res.data)
    } catch {
      setCommentaires([])
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      setNotifications(res.data)
    } catch {
      setNotifications([])
    }
  }

  const fetchMesRapports = async () => {
    try {
      const res = await axios.get(`${API_URL}/rapport/mes-rapports`, { headers: { Authorization: `Bearer ${token}` } })
      setRapportsHistoriques(res.data)
    } catch {
      setRapportsHistoriques([])
    }
  }

  const fetchStagesHistoriques = async () => {
    try {
      const res = await axios.get(`${API_URL}/stage/historique`, { headers: { Authorization: `Bearer ${token}` } })
      setStagesHistoriques(res.data)
    } catch {
      setStagesHistoriques([])
    }
  }

  const fetchAttestation = async () => {
    try {
      const res = await axios.get(`${API_URL}/attestation/etudiant/ma-attestation`, { headers: { Authorization: `Bearer ${token}` } })
      setAttestationUrl(res.data.attestationUrl || "")
    } catch {
      setMessage("Aucune attestation disponible.")
    }
  }

  return (
    <div className="grid gap-6 p-4">
      <h2 className="text-xl font-semibold">Tableau de Bord Étudiant</h2>
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center">
          Notifications <Badge>{notifications.length}</Badge>
        </CardHeader>
        <CardContent>
          {notifications.map((n) => (
            <div key={n.id} className="mb-1">
              <strong>{n.message}</strong> — {new Date(n.date_envoi).toLocaleDateString()}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Proposer un stage</CardHeader>
        <CardContent className="grid gap-2">
          <Input placeholder="Sujet" name="sujet" value={form.sujet} onChange={handleChange} />
          <Input placeholder="Objectifs" name="objectifs" value={form.objectifs} onChange={handleChange} />
          <div className="flex gap-2">
            <Input type="date" name="dateDebut" value={form.dateDebut} onChange={handleChange} />
            <Input type="date" name="dateFin" value={form.dateFin} onChange={handleChange} />
          </div>
          <Input placeholder="Email Encadrant Académique" name="encadrantAcademique" value={form.encadrantAcademique} onChange={handleChange} />
          <Input placeholder="Email Encadrant Professionnel" name="encadrantProfessionnel" value={form.encadrantProfessionnel} onChange={handleChange} />
          <Button onClick={proposeStage}>Soumettre</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Soumettre un rapport</CardHeader>
        <CardContent className="grid gap-2">
          {Object.keys(cibles).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} name={key} checked={cibles[key]} onCheckedChange={(v) => handleCheckboxChange({ target: { name: key, checked: v } })} />
              <Label htmlFor={key}>Envoyer à {key}</Label>
            </div>
          ))}
          <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setRapport(e.target.files[0])} />
          <Button onClick={submitRapport}>Envoyer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Rapports validés</CardHeader>
        <CardContent className="space-y-1">
          {rapportsHistoriques.map((r, i) => (
            <div key={i}>
              <strong>{r.identifiantRapport}</strong> — {r.titre} —
              <a href={`${BASE}/uploads/${r.fichier}`} className="text-blue-600 ml-2" target="_blank" rel="noreferrer">Voir PDF</a>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Attestation</CardHeader>
        <CardContent>
          <Button onClick={fetchAttestation}>Vérifier</Button>
          {attestationUrl && (
            <div className="mt-2">
              <a href={attestationUrl} target="_blank" rel="noreferrer" className="text-green-600">Voir en ligne</a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Stages Historiques</CardHeader>
        <CardContent className="space-y-1">
          {stagesHistoriques.map((s, i) => (
            <div key={i}>
              <strong>{s.identifiant_unique}</strong> — {s.titre} — {s.entreprise}<br />
              <span className="text-sm">{new Date(s.dateDebut).toLocaleDateString()} → {new Date(s.dateFin).toLocaleDateString()}</span><br />
              {s.identifiantRapport && (
                <a href={`${BASE}/uploads/${s.fichier}`} target="_blank" rel="noreferrer" className="text-blue-600">Voir rapport</a>
              )}
              {s.ipfsUrl && (
                <span> | <a href={s.ipfsUrl} target="_blank" rel="noreferrer" className="text-green-600">Voir attestation</a></span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
