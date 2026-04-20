'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [menu, setMenu] = useState('accueil')
  const menus = [
    { id: 'accueil', label: '🏠 Accueil' },
    { id: 'inscription', label: '✍️ Inscription' },
    { id: 'presences', label: '📋 Présences' },
    { id: 'bilan', label: '📊 Bilan' },
    { id: 'abonnements', label: '🎫 Abonnements' },
    { id: 'emploi', label: '📅 Emploi du Temps' },
    { id: 'reinit', label: '🔄 Réinitialisation' },
  ]
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🖥️</span>
            <div>
              <h1 className="text-xl font-bold">Huawei Digital Class</h1>
              <p className="text-xs opacity-75">Gestion de la Salle Informatique</p>
            </div>
          </div>
          <div className="text-right text-xs opacity-75">
            <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
          {menus.map(m => (
            <button key={m.id} onClick={() => setMenu(m.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${menu === m.id ? 'bg-white text-red-700' : 'text-white hover:bg-red-600'}`}>
              {m.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {menu === 'accueil' && <PageAccueil />}
        {menu === 'inscription' && <PageInscription />}
        {menu === 'presences' && <PagePresences />}
        {menu === 'bilan' && <PageBilan />}
        {menu === 'abonnements' && <PageAbonnements />}
        {menu === 'emploi' && <PageEmploi />}
        {menu === 'reinit' && <PageReinit />}
      </main>
    </div>
  )
}

function PageAccueil() {
  const [stats, setStats] = useState({ inscrits: 0, recetteJour: 0, abonnes: 0, recetteMois: 0, totalEleves: 0, classes: 0 })
  useEffect(() => {
    const charger = async () => {
      const { supabase } = await import('../lib/supabase')
      const today = new Date().toISOString().split('T')[0]
      const moisActuel = new Date().toLocaleString('fr-FR', { month: 'long' })
      const annee = new Date().getFullYear()
      const { data: pJour } = await supabase.from('presences').select('montant').eq('date_presence', today)
      const { data: pMois } = await supabase.from('presences').select('montant').gte('date_presence', `${annee}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`)
      const { data: abonnes } = await supabase.from('abonnements').select('id').eq('mois', moisActuel).eq('annee', annee)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSCHOOL_API}/api/eleves`)
        const eleves = await res.json()
        const classes = [...new Set(eleves.map((e: any) => e.classe))].length
        setStats({
          inscrits: pJour?.length || 0,
          recetteJour: pJour?.reduce((s: number, p: any) => s + (p.montant || 0), 0) || 0,
          abonnes: abonnes?.length || 0,
          recetteMois: pMois?.reduce((s: number, p: any) => s + (p.montant || 0), 0) || 0,
          totalEleves: eleves.length, classes,
        })
      } catch {
        setStats(s => ({ ...s, inscrits: pJour?.length || 0, recetteJour: pJour?.reduce((s: number, p: any) => s + (p.montant || 0), 0) || 0 }))
      }
    }
    charger()
  }, [])
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Inscrits aujourd'hui", valeur: stats.inscrits.toString(), icone: '👥', couleur: 'bg-blue-500' },
        { label: 'Recette du jour', valeur: `${stats.recetteJour} FCFA`, icone: '💰', couleur: 'bg-green-500' },
        { label: 'Abonnés ce mois', valeur: stats.abonnes.toString(), icone: '🎫', couleur: 'bg-purple-500' },
        { label: 'Recette du mois', valeur: `${stats.recetteMois} FCFA`, icone: '📈', couleur: 'bg-orange-500' },
        { label: 'Total élèves', valeur: stats.totalEleves.toString(), icone: '🏫', couleur: 'bg-red-500' },
        { label: 'Classes', valeur: stats.classes.toString(), icone: '📚', couleur: 'bg-teal-500' },
      ].map((stat, i) => (
        <div key={i} className={`${stat.couleur} text-white rounded-xl p-4 shadow`}>
          <div className="text-3xl mb-2">{stat.icone}</div>
          <div className="text-2xl font-bold">{stat.valeur}</div>
          <div className="text-sm opacity-80">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

function PageInscription() {
  const [matricule, setMatricule] = useState('')
  const [eleve, setEleve] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [nbHeures, setNbHeures] = useState(1)
  const [poste, setPoste] = useState('')
  const [message, setMessage] = useState('')
  const chercherEleve = async () => {
    if (!matricule.trim()) return
    setLoading(true); setEleve(null); setMessage('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSCHOOL_API}/api/eleves/recherche?q=${matricule}`)
      const data = await res.json()
      if (data.length > 0) setEleve(data[0])
      else setMessage('❌ Élève non trouvé')
    } catch { setMessage('❌ Erreur de connexion WebSchool') }
    setLoading(false)
  }
  const enregistrer = async () => {
    if (!eleve || !poste) { setMessage('⚠️ Remplissez tous les champs'); return }
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.from('presences').insert({
      matricule: eleve.matricule, nom: eleve.nom, prenom: eleve.prenom,
      classe: eleve.classe, contact: eleve.telephone1 || '',
      date_presence: new Date().toISOString().split('T')[0],
      heure_arrivee: new Date().toTimeString().split(' ')[0],
      nb_heures: nbHeures, type_paiement: 'heure', montant: nbHeures * 100, poste,
    })
    if (error) setMessage('❌ Erreur: ' + error.message)
    else { setMessage('✅ Inscription enregistrée !'); setMatricule(''); setEleve(null); setPoste('') }
  }
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-red-700 mb-6">✍️ Inscription à la Salle</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Saisir le matricule..." value={matricule}
            onChange={e => setMatricule(e.target.value)} onKeyDown={e => e.key === 'Enter' && chercherEleve()}
            className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-red-400 outline-none" />
          <button onClick={chercherEleve} disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? '...' : '🔍 Chercher'}
          </button>
        </div>
        {eleve && (
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4">
              {eleve.photo_url && <img src={eleve.photo_url} alt="" className="w-16 h-20 object-cover rounded-lg" />}
              <div>
                <p className="font-bold text-lg">{eleve.nom} {eleve.prenom}</p>
                <p className="text-gray-600">Classe : <strong>{eleve.classe}</strong></p>
                <p className="text-gray-600">Matricule : <strong>{eleve.matricule}</strong></p>
                {eleve.telephone1 && <p className="text-gray-600">Contact : {eleve.telephone1}</p>}
              </div>
            </div>
          </div>
        )}
        {eleve && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">⏱️ Nombre d'heures</label>
              <div className="flex gap-2">
                {[1,2,3,4].map(h => (
                  <button key={h} onClick={() => setNbHeures(h)}
                    className={`flex-1 py-3 rounded-lg font-bold text-lg border-2 transition-colors ${nbHeures === h ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 hover:border-red-300'}`}>
                    {h}H
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium mb-2">🖥️ Numéro de poste</label>
              <select value={poste} onChange={e => setPoste(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-red-400 outline-none">
                <option value="">-- Choisir un poste --</option>
                {['208470','208471','208472','208473','208474','208475','208476','208477','208478','208479','208480','208481','208482','208483','208484','208485','208486','208487','208488','208489','208490','208491','208492','208493','208494','208495','208496','208497','208498','208499','2084100','2084101','2084102','2084103','2084104','2084105','2084106','2084107','2084108','2084109','2084110','2084111','2084112','2084113','2084114','2084115','2084116','2084117','2084118','2084119','2084120'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-gray-600 text-sm">Montant à payer</p>
                <p className="text-3xl font-bold text-green-600">{nbHeures * 100} FCFA</p>
                <p className="text-xs text-gray-500">{nbHeures}H × 100 FCFA</p>
              </div>
              <button onClick={enregistrer} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-green-700 whitespace-nowrap">
                ✅ Enregistrer
              </button>
            </div>
          </div>
        )}
        {message && <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center font-medium">{message}</div>}
      </div>
    </div>
  )
}

function PagePresences() {
  const [presences, setPresences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const charger = async () => {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase.from('presences').select('*').eq('date_presence', date).order('created_at', { ascending: false })
    setPresences(data || []); setLoading(false)
  }
  useEffect(() => { charger() }, [date])
  const totalMontant = presences.reduce((s, p) => s + (p.montant || 0), 0)
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-red-700">📋 Présences du jour</h2>
        <div className="flex gap-2 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-1" />
          <button onClick={charger} className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700">🔄 Actualiser</button>
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-500">Total inscrits</span>
          <p className="text-2xl font-bold text-blue-600">{presences.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-500">Recette du jour</span>
          <p className="text-2xl font-bold text-green-600">{totalMontant} FCFA</p>
        </div>
      </div>
      {loading ? <p className="text-center text-gray-400 py-8">Chargement...</p> : (
        presences.length === 0 ? <p className="text-center text-gray-400 py-8">Aucune présence pour cette date</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Élève</th>
                <th className="px-3 py-2 font-semibold">Classe</th>
                <th className="px-3 py-2 font-semibold">Poste</th>
                <th className="px-3 py-2 font-semibold">Heure</th>
                <th className="px-3 py-2 font-semibold">Durée</th>
                <th className="px-3 py-2 font-semibold">Montant</th>
              </tr></thead>
              <tbody>
                {presences.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium">{p.nom} {p.prenom}</td>
                    <td className="px-3 py-2 text-gray-600">{p.classe}</td>
                    <td className="px-3 py-2 text-gray-600">{p.poste}</td>
                    <td className="px-3 py-2 text-gray-600">{p.heure_arrivee?.slice(0,5)}</td>
                    <td className="px-3 py-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{p.nb_heures}H</span></td>
                    <td className="px-3 py-2 font-bold text-green-600">{p.montant} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function PageBilan() {
  const [presences, setPresences] = useState<any[]>([])
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0])
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const charger = async () => {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase.from('presences').select('*').gte('date_presence', dateDebut).lte('date_presence', dateFin).order('date_presence', { ascending: false })
    setPresences(data || []); setLoading(false)
  }
  useEffect(() => { charger() }, [])
  const totalMontant = presences.reduce((s, p) => s + (p.montant || 0), 0)
  const totalHeures = presences.reduce((s, p) => s + (p.nb_heures || 0), 0)
  const parDate = presences.reduce((acc, p) => {
    const d = p.date_presence
    if (!acc[d]) acc[d] = { eleves: 0, montant: 0 }
    acc[d].eleves++; acc[d].montant += p.montant || 0
    return acc
  }, {} as any)
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Date début</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date fin</label>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-1" />
        </div>
        <button onClick={charger} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium">📊 Afficher</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-500 text-white rounded-xl p-4 shadow text-center">
          <div className="text-3xl font-bold">{presences.length}</div>
          <div className="text-sm opacity-80">Total participants</div>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-4 shadow text-center">
          <div className="text-3xl font-bold">{totalHeures}H</div>
          <div className="text-sm opacity-80">Total heures</div>
        </div>
        <div className="bg-green-500 text-white rounded-xl p-4 shadow text-center">
          <div className="text-3xl font-bold">{totalMontant}</div>
          <div className="text-sm opacity-80">Total FCFA</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-3 text-red-700">📅 Récapitulatif par jour</h3>
        {loading ? <p className="text-center text-gray-400 py-4">Chargement...</p> : (
          Object.keys(parDate).length === 0 ? <p className="text-center text-gray-400 py-4">Aucune donnée</p> : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Élèves</th><th className="px-3 py-2 text-left">Recette</th></tr></thead>
              <tbody>
                {Object.entries(parDate).map(([d, val]: any, i) => (
                  <tr key={d} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">{new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</td>
                    <td className="px-3 py-2 text-blue-600 font-bold">{val.eleves} élèves</td>
                    <td className="px-3 py-2 text-green-600 font-bold">{val.montant} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}

function PageAbonnements() {
  const [matricule, setMatricule] = useState('')
  const [eleve, setEleve] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [abonnements, setAbonnements] = useState<any[]>([])
  const moisActuel = new Date().toLocaleString('fr-FR', { month: 'long' })
  const anneeActuelle = new Date().getFullYear()
  const chargerAbonnements = async () => {
    const { supabase } = await import('../lib/supabase')
    const { data } = await supabase.from('abonnements').select('*').eq('mois', moisActuel).eq('annee', anneeActuelle).order('created_at', { ascending: false })
    setAbonnements(data || [])
  }
  useEffect(() => { chargerAbonnements() }, [])
  const chercherEleve = async () => {
    if (!matricule.trim()) return
    setLoading(true); setEleve(null); setMessage('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSCHOOL_API}/api/eleves/recherche?q=${matricule}`)
      const data = await res.json()
      if (data.length > 0) setEleve(data[0])
      else setMessage('❌ Élève non trouvé')
    } catch { setMessage('❌ Erreur de connexion') }
    setLoading(false)
  }
  const enregistrerAbonnement = async () => {
    if (!eleve) return
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase.from('abonnements').insert({
      matricule: eleve.matricule, nom: eleve.nom, prenom: eleve.prenom,
      classe: eleve.classe, contact: eleve.telephone1 || '',
      mois: moisActuel, annee: anneeActuelle, montant: 5000,
      date_paiement: new Date().toISOString().split('T')[0],
    })
    if (error) setMessage('❌ Erreur: ' + error.message)
    else { setMessage('✅ Abonnement enregistré !'); setMatricule(''); setEleve(null); chargerAbonnements() }
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-red-700 mb-2">🎫 Abonnement Mensuel — 5 000 FCFA</h2>
        <p className="text-gray-500 mb-4">Mois : <strong>{moisActuel} {anneeActuelle}</strong></p>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Saisir le matricule..." value={matricule}
            onChange={e => setMatricule(e.target.value)} onKeyDown={e => e.key === 'Enter' && chercherEleve()}
            className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-red-400 outline-none" />
          <button onClick={chercherEleve} disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
            {loading ? '...' : '🔍 Chercher'}
          </button>
        </div>
        {eleve && (
          <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {eleve.photo_url && <img src={eleve.photo_url} alt="" className="w-12 h-16 object-cover rounded-lg" />}
              <div>
                <p className="font-bold">{eleve.nom} {eleve.prenom}</p>
                <p className="text-gray-600 text-sm">Classe : {eleve.classe}</p>
              </div>
            </div>
            <button onClick={enregistrerAbonnement} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold">
              ✅ Abonner — 5 000 FCFA
            </button>
          </div>
        )}
        {message && <div className="p-3 bg-gray-100 rounded-lg text-center font-medium">{message}</div>}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-lg mb-1 text-red-700">📋 Abonnés — {moisActuel} {anneeActuelle}</h3>
        <p className="text-green-600 font-bold mb-3">Total : {abonnements.length * 5000} FCFA ({abonnements.length} abonnés)</p>
        {abonnements.length === 0 ? <p className="text-center text-gray-400 py-4">Aucun abonnement ce mois</p> : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left">Élève</th><th className="px-3 py-2 text-left">Classe</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Montant</th></tr></thead>
            <tbody>
              {abonnements.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium">{a.nom} {a.prenom}</td>
                  <td className="px-3 py-2 text-gray-600">{a.classe}</td>
                  <td className="px-3 py-2 text-gray-600">{new Date(a.date_paiement).toLocaleDateString('fr-FR')}</td>
                  <td className="px-3 py-2 font-bold text-purple-600">{a.montant} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PageEmploi() {
  const [onglet, setOnglet] = useState<'consultation'|'saisie'>('consultation')
  const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const CRENEAUX = ['07H-08H','08H-09H','09H-10H','10H-11H','11H-12H','12H-13H','13H-14H','14H-15H','15H-16H','16H-17H','17H-18H']
  const [matricule, setMatricule] = useState('')
  const [eleve, setEleve] = useState<any>(null)
  const [loadingEleve, setLoadingEleve] = useState(false)
  const [emploiClasse, setEmploiClasse] = useState<any[]>([])
  const [messageConsult, setMessageConsult] = useState('')
  const chercherEleve = async () => {
    if (!matricule.trim()) return
    setLoadingEleve(true); setEleve(null); setEmploiClasse([]); setMessageConsult('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSCHOOL_API}/api/eleves/recherche?q=${matricule}`)
      const data = await res.json()
      if (data.length > 0) {
        const e = data[0]; setEleve(e)
        const { supabase } = await import('../lib/supabase')
        const { data: edt } = await supabase.from('emploi_temps').select('*').eq('classe', e.classe)
        setEmploiClasse(edt || [])
        if (!edt || edt.length === 0) setMessageConsult('⚠️ Aucun emploi du temps pour cette classe.')
      } else { setMessageConsult('❌ Élève non trouvé') }
    } catch { setMessageConsult('❌ Erreur de connexion') }
    setLoadingEleve(false)
  }
  const getMatiere = (jour: string, creneau: string) => {
    const [debut, fin] = creneau.split('-')
    const h = (t: string) => t.replace('H','')
    const row = emploiClasse.find(r => r.jour === jour && r.heure_debut === h(debut) && r.heure_fin === h(fin))
    return row?.matiere || ''
  }
  const [classesSaisie, setClassesSaisie] = useState<string[]>([])
  const [classeChoisie, setClasseChoisie] = useState('')
  const [jourChoisi, setJourChoisi] = useState('Lundi')
  const [creneauxSaisie, setCreneauxSaisie] = useState<{[k:string]:string}>({})
  const [messageSaisie, setMessageSaisie] = useState('')
  const [loadingSaisie, setLoadingSaisie] = useState(false)
  useEffect(() => {
    const chargerClasses = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_WEBSCHOOL_API}/api/eleves/classes`)
        const data = await res.json()
        const liste = Array.isArray(data) ? data.map((c: any) => typeof c === 'string' ? c : c.classe).filter(Boolean) : []
        setClassesSaisie(liste)
        if (liste.length > 0) setClasseChoisie(liste[0])
      } catch {}
    }
    chargerClasses()
  }, [])
  useEffect(() => {
    if (!classeChoisie) return
    const chargerEDT = async () => {
      const { supabase } = await import('../lib/supabase')
      const { data } = await supabase.from('emploi_temps').select('*').eq('classe', classeChoisie).eq('jour', jourChoisi)
      const map: {[k:string]:string} = {}
      ;(data || []).forEach((r: any) => { map[`${r.heure_debut}-${r.heure_fin}`] = r.matiere || '' })
      setCreneauxSaisie(map)
    }
    chargerEDT()
  }, [classeChoisie, jourChoisi])
  const enregistrerEDT = async () => {
    if (!classeChoisie) return
    setLoadingSaisie(true); setMessageSaisie('')
    const { supabase } = await import('../lib/supabase')
    await supabase.from('emploi_temps').delete().eq('classe', classeChoisie).eq('jour', jourChoisi)
    const lignes = CRENEAUX.map(c => {
      const [debut, fin] = c.split('-')
      const h = (t: string) => t.replace('H','')
      return { classe: classeChoisie, jour: jourChoisi, heure_debut: h(debut), heure_fin: h(fin), matiere: creneauxSaisie[`${h(debut)}-${h(fin)}`] || '' }
    }).filter(l => l.matiere.trim() !== '')
    if (lignes.length > 0) await supabase.from('emploi_temps').insert(lignes)
    setMessageSaisie('✅ Emploi du temps enregistré !'); setLoadingSaisie(false)
  }
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-2 flex gap-2">
        <button onClick={() => setOnglet('consultation')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${onglet === 'consultation' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          🔍 Consulter par matricule
        </button>
        <button onClick={() => setOnglet('saisie')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${onglet === 'saisie' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          ✏️ Saisie / Administration
        </button>
      </div>
      {onglet === 'consultation' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-bold text-red-700 mb-3">📅 Emploi du Temps — Consultation</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="Saisir le matricule de l'élève..."
                value={matricule} onChange={e => setMatricule(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && chercherEleve()}
                className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-red-400 outline-none" />
              <button onClick={chercherEleve} disabled={loadingEleve}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {loadingEleve ? '...' : '🔍 Chercher'}
              </button>
            </div>
            {messageConsult && <p className="text-center font-medium py-2 mt-2">{messageConsult}</p>}
          </div>
          {eleve && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                {eleve.photo_url && <img src={eleve.photo_url} alt="" className="w-12 h-16 object-cover rounded-lg" />}
                <div>
                  <p className="font-bold text-gray-800">{eleve.nom} {eleve.prenom}</p>
                  <p className="text-red-600 font-semibold text-sm">Classe : {eleve.classe}</p>
                  <p className="text-gray-500 text-xs">Matricule : {eleve.matricule}</p>
                </div>
              </div>
              {emploiClasse.length > 0 ? (
                <div className="overflow-x-auto">
                  <p className="font-bold text-gray-700 mb-2 text-sm">📋 Emploi du temps complet — {eleve.classe}</p>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 bg-red-700 text-white px-2 py-1 text-left w-20">Horaire</th>
                        {JOURS.map(j => (
                          <th key={j} className="border border-gray-300 bg-red-700 text-white px-2 py-1 text-center">{j}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CRENEAUX.map((creneau, i) => (
                        <tr key={creneau} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-200 px-2 py-1 font-semibold text-gray-600 bg-gray-100 whitespace-nowrap">{creneau}</td>
                          {JOURS.map(jour => {
                            const matiere = getMatiere(jour, creneau)
                            return (
                              <td key={jour} className={`border border-gray-200 px-2 py-1 text-center ${matiere ? 'text-blue-700 font-medium bg-blue-50' : 'text-gray-300'}`}>
                                {matiere || '—'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4 text-sm">Aucun emploi du temps pour la classe {eleve.classe}</p>
              )}
            </div>
          )}
        </div>
      )}
      {onglet === 'saisie' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-red-700 mb-4">✏️ Saisie de l'Emploi du Temps</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Classe</label>
              <select value={classeChoisie} onChange={e => setClasseChoisie(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-red-400 outline-none min-w-32">
                {classesSaisie.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jour</label>
              <select value={jourChoisi} onChange={e => setJourChoisi(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-red-400 outline-none">
                {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={enregistrerEDT} disabled={loadingSaisie}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                {loadingSaisie ? '...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Matières pour <strong>{classeChoisie}</strong> — <strong>{jourChoisi}</strong> :</p>
          <div className="grid grid-cols-2 gap-2">
            {CRENEAUX.map(creneau => {
              const [debut, fin] = creneau.split('-')
              const h = (t: string) => t.replace('H','')
              const key = `${h(debut)}-${h(fin)}`
              return (
                <div key={creneau} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 w-20 shrink-0">{creneau}</span>
                  <input type="text" placeholder="Matière..."
                    value={creneauxSaisie[key] || ''}
                    onChange={e => setCreneauxSaisie(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-red-400 outline-none" />
                </div>
              )
            })}
          </div>
          {messageSaisie && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center font-medium text-green-700">{messageSaisie}</div>}
        </div>
      )}
    </div>
  )
}

function PageReinit() {
  const [etape, setEtape] = useState<'accueil'|'confirmer'|'done'>('accueil')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ presences: 0, abonnements: 0, emplois: 0 })
  const [options, setOptions] = useState({ presences: true, abonnements: true, emplois: true })
  useEffect(() => {
    const charger = async () => {
      const { supabase } = await import('../lib/supabase')
      const { count: c1 } = await supabase.from('presences').select('*', { count: 'exact', head: true })
      const { count: c2 } = await supabase.from('abonnements').select('*', { count: 'exact', head: true })
      const { count: c3 } = await supabase.from('emploi_temps').select('*', { count: 'exact', head: true })
      setStats({ presences: c1 || 0, abonnements: c2 || 0, emplois: c3 || 0 })
    }
    charger()
  }, [])

  const executer = async () => {
    setLoading(true)
    const { supabase } = await import('../lib/supabase')
    if (options.presences) await supabase.from('presences').delete().neq('id', 0)
    if (options.abonnements) await supabase.from('abonnements').delete().neq('id', 0)
    if (options.emplois) await supabase.from('emploi_temps').delete().neq('id', 0)
    setLoading(false)
    setEtape('done')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {etape === 'accueil' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">🔄 Réinitialisation — Nouvelle Année</h2>
          <p className="text-gray-500 mb-6">Préparez la salle informatique pour la nouvelle année scolaire en supprimant les données de l'année passée.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <h3 className="font-semibold text-gray-700 mb-3">📊 Données actuelles :</h3>
            {[
              { key: 'presences', label: 'Présences / Inscriptions', count: stats.presences, icone: '📋', couleur: 'text-blue-600' },
              { key: 'abonnements', label: 'Abonnements', count: stats.abonnements, icone: '🎫', couleur: 'text-purple-600' },
              { key: 'emplois', label: 'Emplois du temps', count: stats.emplois, icone: '📅', couleur: 'text-orange-600' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={options[item.key as keyof typeof options]}
                    onChange={e => setOptions(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 accent-red-600" />
                  <span className="text-lg">{item.icone}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className={`font-bold text-lg ${item.couleur}`}>{item.count} entrées</span>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 font-medium">⚠️ Attention : Cette action est irréversible. Les données supprimées ne pourront pas être récupérées.</p>
          </div>
          <button onClick={() => setEtape('confirmer')}
            disabled={!options.presences && !options.abonnements && !options.emplois}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50">
            🗑️ Procéder à la réinitialisation
          </button>
        </div>
      )}

      {etape === 'confirmer' && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Confirmation requise</h2>
          <p className="text-gray-600 mb-2">Vous allez supprimer définitivement :</p>
          <ul className="text-left bg-red-50 rounded-xl p-4 mb-6 space-y-1">
            {options.presences && <li className="text-red-700 font-medium">✗ Toutes les présences ({stats.presences} entrées)</li>}
            {options.abonnements && <li className="text-red-700 font-medium">✗ Tous les abonnements ({stats.abonnements} entrées)</li>}
            {options.emplois && <li className="text-red-700 font-medium">✗ Tous les emplois du temps ({stats.emplois} entrées)</li>}
          </ul>
          <div className="flex gap-3">
            <button onClick={() => setEtape('accueil')} className="flex-1 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50">
              ← Annuler
            </button>
            <button onClick={executer} disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50">
              {loading ? '⏳ Suppression...' : '🗑️ CONFIRMER LA SUPPRESSION'}
            </button>
          </div>
        </div>
      )}

      {etape === 'done' && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <span className="text-6xl mb-4 block">✅</span>
          <h2 className="text-xl font-bold text-green-600 mb-2">Remise à zéro effectuée !</h2>
          <p className="text-gray-600 mb-6">La salle informatique est prête pour la nouvelle année scolaire.</p>
          <button onClick={() => setEtape('accueil')} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700">
            🏠 Retour
          </button>
        </div>
      )}
    </div>
  )
}