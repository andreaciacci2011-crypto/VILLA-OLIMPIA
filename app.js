const SUPABASE_URL = 'https://dkuhhypqyhgzibbcnmvs.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_QkuMrLApn2INNKj_Ixth5w_Hvep3hCH';

let supabaseClient = null;
let utenteCorrente = null;

window.addEventListener('supabase-ready', () => {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  inizializzaApp();
});

if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  document.addEventListener('DOMContentLoaded', inizializzaApp);
}

function inizializzaApp() {
  popolaProvincie();
  const sessione = localStorage.getItem('villa_olimpia_sessione');
  if (sessione) {
    utenteCorrente = JSON.parse(sessione);
    mostraDashboard();
  }
}

const PROVINCE_ITALIANE = [
  "Agrigento (AG)", "Alessandria (AL)", "Ancona (AN)", "Aosta (AO)", "Arezzo (AR)", "Ascoli Piceno (AP)", "Asti (AT)", "Avellino (AV)", 
  "Bari (BA)", "Barletta-Andria-Trani (BT)", "Belluno (BL)", "Benevento (BN)", "Bergamo (BG)", "Biella (BI)", "Bologna (BO)", "Bolzano (BZ)", "Brescia (BS)", "Brindisi (BR)", 
  "Cagliari (CAG)", "Caltanissetta (CL)", "Campobasso (CB)", "Caserta (CE)", "Catania (CT)", "Catanzaro (CZ)", "Chieti (CH)", "Como (CO)", "Cosenza (CS)", "Cremona (CR)", "Crotone (KR)", "Cuneo (CN)", 
  "Enna (EN)", "Fermo (FM)", "Ferrara (FE)", "Firenze (FI)", "Foggia (FG)", "Forlì-Cesena (FC)", "Frosinone (FR)", 
  "Genova (GE)", "Gorizia (GO)", "Grosseto (GR)", "Imperia (IM)", "Isernia (IS)", 
  "L'Aquila (AQ)", "La Spezia (SP)", "Latina (LT)", "Lecce (LE)", "Lecco (LC)", "Livorno (LI)", "Lodi (LO)", "Lucca (LU)", 
  "Macerata (MC)", "Mantova (MN)", "Massa-Carrara (MS)", "Matera (MT)", "Messina (ME)", "Milano (MI)", "Modena (MO)", "Monza e della Brianza (MB)", 
  "Napoli (NA)", "Novara (NO)", "Nuoro (NU)", "Oristano (OR)", 
  "Padova (PD)", "Palermo (PA)", "Parma (PR)", "Pavia (PV)", "Perugia (PG)", "Pesaro e Urbino (PU)", "Pescara (PE)", "Piacenza (PC)", "Pisa (PI)", "Pistoia (PT)", "Pordenone (PN)", "Potenza (PZ)", "Prato (PO)", 
  "Ragusa (RG)", "Ravenna (RA)", "Reggio Calabria (RC)", "Reggio Emilia (RE)", "Rieti (RI)", "Rimini (RN)", "Roma (RM)", "Rovigo (RO)", 
  "Salerno (SA)", "Sassari (SS)", "Savona (SV)", "Siena (SI)", "Siracusa (SR)", "Sondrio (SO)", "Sud Sardegna (SU)", 
  "Taranto (TA)", "Teramo (TE)", "Terni (TR)", "Torino (TO)", "Trapani (TP)", "Trento (TN)", "Treviso (TV)", "Trieste (TS)", 
  "Udine (UD)", "Varese (VA)", "Venezia (VE)", "Verbano-Cusio-Ossola (VB)", "Vercelli (VC)", "Verona (VR)", "Vibo Valentia (VV)", "Vicenza (VI)", "Viterbo (VT)"
];

function popolaProvincie() {
  const select = document.getElementById('nuovoProvinciaNascita');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona Provincia...</option>' + 
    PROVINCE_ITALIANE.map(p => `<option value="${p}">${p}</option>`).join('');
}

document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabaseClient) return;

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pin = document.getElementById('loginPin').value.trim();
  const errBox = document.getElementById('erroreLogin');

  errBox.classList.add('hidden');

  const { data, error } = await supabaseClient
    .from('utenti')
    .select('*')
    .ilike('email', email)
    .eq('pin', pin);

  if (error || !data || data.length === 0) {
    errBox.innerText = "❌ Email o PIN errati. Verifica i dati inseriti.";
    errBox.classList.remove('hidden');
    return;
  }

  if (data[0].attivo === false) {
    errBox.innerText = "❌ Questo account è stato disabilitato dal Master.";
    errBox.classList.remove('hidden');
    return;
  }

  utenteCorrente = data[0];
  localStorage.setItem('villa_olimpia_sessione', JSON.stringify(utenteCorrente));
  mostraDashboard();
});

function mostraDashboard() {
  document.getElementById('sezioneLogin').classList.add('hidden');
  document.getElementById('appContenitore').classList.remove('hidden');

  document.getElementById('labelNomeUtente').innerText = `${utenteCorrente.nome} ${utenteCorrente.cognome}`;
  document.getElementById('badgeRuolo').innerText = utenteCorrente.ruolo.toUpperCase();

  applicavisibilitaPermessiUI();
  caricaTuttiGliUtenti();
  selezionaSezione('comunicazioni');
  inizializzaComunicazioni();
}

function applicavisibilitaPermessiUI() {
  const isMaster = utenteCorrente.ruolo === 'master';
  const p = utenteCorrente.permessi || {};

  const btnNuovoUtente = document.querySelector('button[onclick="apriModalNuovoUtente()"]');
  if (btnNuovoUtente) {
    if (isMaster || p.anagrafica) btnNuovoUtente.classList.remove('hidden');
    else btnNuovoUtente.classList.add('hidden');
  }

  const mostraAnagrafica = isMaster || p.anagrafica;
  toggleElementoUI('btn-oss', mostraAnagrafica);
  toggleElementoUI('btn-infermieri', mostraAnagrafica);
  toggleElementoUI('btn-altri', mostraAnagrafica);

  const mostraTurniOSS = isMaster || p.turni_oss || utenteCorrente.categoria === 'OSS';
  const mostraTurniInf = isMaster || p.turni_infermieri || utenteCorrente.categoria === 'Infermiere';

  toggleElementoUI('btn-turni-oss', mostraTurniOSS);
  toggleElementoUI('btn-turni-infermieri', mostraTurniInf);

  const btnNuovaCom = document.querySelector('button[onclick="apriModalNuovaComunicazione()"]');
  if (btnNuovaCom) {
    if (isMaster || p.mansioni) btnNuovaCom.classList.remove('hidden');
    else btnNuovaCom.classList.add('hidden');
  }
}

function toggleElementoUI(id, visibile) {
  const el = document.getElementById(id);
  if (!el) return;
  if (visibile) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

function selezionaSezione(idSezione) {
  document.querySelectorAll('.vista-contenuto').forEach(el => el.classList.add('hidden'));

  document.querySelectorAll('.btn-sidebar').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white', 'font-bold', 'shadow-md');
    btn.classList.add('text-gray-200', 'hover:bg-blue-800/60');
  });

  const vistaAttiva = document.getElementById(`vista-${idSezione}`);
  if (vistaAttiva) vistaAttiva.classList.remove('hidden');

  const btnAttivo = document.getElementById(`btn-${idSezione}`);
  if (btnAttivo) {
    btnAttivo.classList.add('bg-blue-600', 'text-white', 'font-bold', 'shadow-md');
    btnAttivo.classList.remove('hover:bg-blue-800/60');
  }

  if (idSezione === 'comunicazioni') {
    caricaBachecaComunicazioni();
    if (utenteCorrente?.ruolo === 'master') {
      caricaDiarioAttivitaMaster();
    }
  } else if (idSezione === 'turni-oss') {
    caricaTabellaTurniSpecifica('OSS');
  } else if (idSezione === 'turni-infermieri') {
    caricaTabellaTurniSpecifica('Infermiere');
  }
}

function apriModalNuovoUtente() { 
  document.getElementById('editUtenteId').value = '';
  document.getElementById('titoloModalUtente').innerText = '📝 Anagrafica e Permessi Utente';
  document.getElementById('btnSalvaUtente').innerText = 'Salva e Genera PIN';
  document.getElementById('formNuovoUtente').reset();
  toggleMasterMode({ checked: false });
  document.getElementById('modalNuovoUtente').classList.remove('hidden'); 
}

function chiudiModalNuovoUtente() { 
  document.getElementById('modalNuovoUtente').classList.add('hidden'); 
  document.getElementById('formNuovoUtente').reset(); 
}

function toggleMasterMode(chkMaster) {
  const permChecks = document.querySelectorAll('.perm-check');
  permChecks.forEach(chk => {
    chk.checked = chkMaster.checked;
    chk.disabled = chkMaster.checked;
  });
}

async function apriModalModificaUtente(id) {
  const { data: u } = await supabaseClient.from('utenti').select('*').eq('id', id).single();
  if (!u) return;

  document.getElementById('editUtenteId').value = u.id;
  document.getElementById('titoloModalUtente').innerText = `✏️ Modifica Anagrafica: ${u.cognome} ${u.nome}`;
  document.getElementById('btnSalvaUtente').innerText = 'Salva Modifiche';

  document.getElementById('nuovoNome').value = u.nome || '';
  document.getElementById('nuovoCognome').value = u.cognome || '';
  document.getElementById('nuovoDataNascita').value = u.data_nascita || '';
  document.getElementById('nuovoLuogoNascita').value = u.luogo_nascita || '';
  document.getElementById('nuovoProvinciaNascita').value = u.provincia_nascita || '';
  document.getElementById('nuovoCF').value = u.codice_fiscale || '';
  document.getElementById('nuovoTelefono').value = u.telefono || '';
  document.getElementById('nuovoEmail').value = u.email || '';
  document.getElementById('nuovoResidenza').value = u.residenza || '';
  document.getElementById('nuovoCategoria').value = u.categoria || 'OSS';
  document.getElementById('nuovoAntincendio').checked = !!u.antincendio;

  const isMaster = u.ruolo === 'master';
  document.getElementById('perm_is_master').checked = isMaster;
  toggleMasterMode({ checked: isMaster });

  if (!isMaster && u.permessi) {
    document.getElementById('perm_turni_oss').checked = !!u.permessi.turni_oss;
    document.getElementById('perm_turni_infermieri').checked = !!u.permessi.turni_infermieri;
    document.getElementById('perm_assenze').checked = !!u.permessi.assenze;
    document.getElementById('perm_cambi').checked = !!u.permessi.cambi;
    document.getElementById('perm_mansioni').checked = !!u.permessi.mansioni;
    document.getElementById('perm_anagrafica').checked = !!u.permessi.anagrafica;
  }

  document.getElementById('modalNuovoUtente').classList.remove('hidden');
}

document.getElementById('formNuovoUtente')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('editUtenteId').value;
  const nome = document.getElementById('nuovoNome').value.trim();
  const cognome = document.getElementById('nuovoCognome').value.trim();
  const data_nascita = document.getElementById('nuovoDataNascita').value;
  const luogo_nascita = document.getElementById('nuovoLuogoNascita').value.trim();
  const provincia_nascita = document.getElementById('nuovoProvinciaNascita').value;
  const codice_fiscale = document.getElementById('nuovoCF').value.trim().toUpperCase();
  const telefono = document.getElementById('nuovoTelefono').value.trim();
  const email = document.getElementById('nuovoEmail').value.trim().toLowerCase();
  const residenza = document.getElementById('nuovoResidenza').value.trim();
  const categoria = document.getElementById('nuovoCategoria').value;
  const antincendio = document.getElementById('nuovoAntincendio').checked;
  const isMaster = document.getElementById('perm_is_master').checked;

  const ruolo = isMaster ? 'master' : 'delegato';

  const permessi = {
    turni_oss: isMaster || document.getElementById('perm_turni_oss').checked,
    turni_infermieri: isMaster || document.getElementById('perm_turni_infermieri').checked,
    assenze: isMaster || document.getElementById('perm_assenze').checked,
    cambi: isMaster || document.getElementById('perm_cambi').checked,
    mansioni: isMaster || document.getElementById('perm_mansioni').checked,
    anagrafica: isMaster || document.getElementById('perm_anagrafica').checked
  };

  if (editId) {
    const { error } = await supabaseClient.from('utenti').update({
      nome, cognome, data_nascita, luogo_nascita, provincia_nascita,
      codice_fiscale, telefono, email, residenza, categoria, ruolo, antincendio, permessi
    }).eq('id', editId);

    if (error) {
      alert("Errore aggiornamento: " + error.message);
    } else {
      alert("✅ Anagrafica utente aggiornata con successo!");
      await registraAttivitaDiario(utenteCorrente.id, "Modifica Anagrafica", `Aggiornati dati utente: ${cognome} ${nome}`);
      chiudiModalNuovoUtente();
      caricaTuttiGliUtenti();
    }
  } else {
    const pinGenerato = Math.floor(1000 + Math.random() * 9000).toString();

    const { error } = await supabaseClient.from('utenti').insert([{
      nome, cognome, data_nascita, luogo_nascita, provincia_nascita,
      codice_fiscale, telefono, email, residenza, categoria, ruolo, antincendio,
      permessi, pin: pinGenerato, attivo: true, attestati: []
    }]);

    if (error) {
      alert("Errore salvataggio: " + error.message);
    } else {
      alert(`✅ Utente creato con successo!\n\nEmail: ${email}\nPIN Generato: ${pinGenerato}`);
      await registraAttivitaDiario(utenteCorrente.id, "Nuovo Utente", `Creato utente ${cognome} ${nome} (${categoria})`);
      chiudiModalNuovoUtente();
      caricaTuttiGliUtenti();
    }
  }
});

async function caricaTuttiGliUtenti() {
  const { data: utenti } = await supabaseClient.from('utenti').select('*').order('cognome');
  if (!utenti) return;

  const tbOSS = document.getElementById('tabellaOSS');
  const tbInf = document.getElementById('tabellaInfermieri');
  const tbAltri = document.getElementById('tabellaAltri');

  let htmlOSS = '', htmlInf = '', htmlAltri = '';

  utenti.forEach(u => {
    let dataNascitaFormatted = '-';
    if (u.data_nascita) {
      const parti = u.data_nascita.split('-');
      if (parti.length === 3) dataNascitaFormatted = `${parti[2]}/${parti[1]}/${parti[0]}`;
    }

    const statoBadge = u.attivo !== false 
      ? `<span class="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">Attivo</span>` 
      : `<span class="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold">Disabilitato</span>`;

    const iconaAntincendioUtente = u.antincendio ? `<span class="ml-1 text-red-600 text-xs font-bold" title="Antincendio">🔥</span>` : '';

    const riga = `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-3 font-semibold text-blue-900">
          ${u.cognome} ${u.nome} ${iconaAntincendioUtente}
          <div class="text-[10px] text-gray-500">${u.email}</div>
        </td>
        <td class="p-3">${statoBadge}</td>
        <td class="p-3 text-gray-600">
          Nato il ${dataNascitaFormatted} a ${u.luogo_nascita || '-'} (${u.provincia_nascita || ''})<br>
          Tel: ${u.telefono || '-'} | CF: ${u.codice_fiscale || '-'}
        </td>
        <td class="p-3 text-center font-mono font-bold text-blue-600">${u.pin || '1234'}</td>
        <td class="p-3 text-center space-x-1 whitespace-nowrap">
          <button onclick="apriModalModificaUtente('${u.id}')" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold">✏️ Modifica</button>
          <button onclick="toggleStatoUtente('${u.id}', ${u.attivo !== false})" class="px-2 py-1 rounded text-[10px] font-bold ${u.attivo !== false ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}">
            ${u.attivo !== false ? 'Disabilita' : 'Abilita'}
          </button>
          <button onclick="resetPin('${u.id}')" class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold">Reset PIN</button>
          <button onclick="apriModalRiepilogoOre('${u.id}')" class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold">⏱️ Ore</button>
          <button onclick="apriModalCorsi('${u.id}')" class="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold">📎 Corsi</button>
          <button onclick="apriSchedaAnagrafica('${u.id}')" class="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded text-[10px] font-bold">📇 Scheda</button>
          <button onclick="eliminaUtente('${u.id}', '${u.nome} ${u.cognome}')" class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold">Elimina</button>
        </td>
      </tr>
    `;

    if (u.categoria === 'OSS') htmlOSS += riga;
    else if (u.categoria === 'Infermiere') htmlInf += riga;
    else htmlAltri += riga;
  });

  if (tbOSS) tbOSS.innerHTML = htmlOSS || `<tr><td colspan="5" class="p-4 text-center text-gray-400">Nessun OSS registrato.</td></tr>`;
  if (tbInf) tbInf.innerHTML = htmlInf || `<tr><td colspan="5" class="p-4 text-center text-gray-400">Nessun Infermiere registrato.</td></tr>`;
  if (tbAltri) tbAltri.innerHTML = htmlAltri || `<tr><td colspan="5" class="p-4 text-center text-gray-400">Nessun altro lavoratore registrato.</td></tr>`;
}

async function toggleStatoUtente(id, statoAttuale) {
  const nuovoStato = !statoAttuale;
  const { error } = await supabaseClient.from('utenti').update({ attivo: nuovoStato }).eq('id', id);
  if (!error) caricaTuttiGliUtenti();
}

async function resetPin(id) {
  const nuovoPin = Math.floor(1000 + Math.random() * 9000).toString();
  const { error } = await supabaseClient.from('utenti').update({ pin: nuovoPin }).eq('id', id);
  if (!error) {
    alert(`🔑 PIN resettato con successo!\n\nNuovo PIN: ${nuovoPin}`);
    caricaTuttiGliUtenti();
  }
}

async function eliminaUtente(id, nomeCompleto) {
  if (!confirm(`Sei sicuro di voler eliminare definitivamente ${nomeCompleto} dal sistema?`)) return;
  const { error } = await supabaseClient.from('utenti').delete().eq('id', id);
  if (!error) {
    await registraAttivitaDiario(utenteCorrente.id, "Eliminazione Utente", `Eliminato utente ID ${id}`);
    caricaTuttiGliUtenti();
  }
}

function apriModalCorsi(id) {
  document.getElementById('corsoUtenteId').value = id;
  document.getElementById('modalCorsi').classList.remove('hidden');
}

function chiudiModalCorsi() {
  document.getElementById('modalCorsi').classList.add('hidden');
  document.getElementById('formCorso').reset();
}

document.getElementById('formCorso')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('corsoUtenteId').value;
  const titolo = document.getElementById('corsoTitolo').value.trim();
  const fileInput = document.getElementById('corsoFile');

  if (fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  const fileExt = file.name.split('.').pop();
  const storagePath = `${id}/${Date.now()}.${fileExt}`;

  const { data: storageData, error: storageError } = await supabaseClient
    .storage.from('attestati-utenti').upload(storagePath, file);

  if (storageError) {
    alert("❌ Errore caricamento file: " + storageError.message);
    return;
  }

  const { data: urlData } = supabaseClient.storage.from('attestati-utenti').getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  const { data: utente } = await supabaseClient.from('utenti').select('attestati').eq('id', id).single();
  const attestati = utente?.attestati || [];

  attestati.push({
    id: Date.now(),
    titolo,
    nomeFile: file.name,
    fileUrl: fileUrl,
    storagePath: storagePath,
    dataCaricamento: new Date().toLocaleDateString('it-IT')
  });

  const { error: dbError } = await supabaseClient.from('utenti').update({ attestati }).eq('id', id);

  if (!dbError) {
    alert("✅ Attestato caricato con successo!");
    await registraAttivitaDiario(utenteCorrente.id, "Caricamento Attestato", `Caricato attestato "${titolo}" per utente ID ${id}`);
    chiudiModalCorsi();
    caricaTuttiGliUtenti();
  }
});

async function eliminaAttestato(utenteId, attestatoId, storagePath) {
  if (!confirm("Sei sicuro di voler eliminare questo allegato?")) return;

  if (storagePath) {
    await supabaseClient.storage.from('attestati-utenti').remove([storagePath]);
  }

  const { data: u } = await supabaseClient.from('utenti').select('attestati').eq('id', utenteId).single();
  if (!u) return;

  const attestatiAggiornati = (u.attestati || []).filter(a => a.id !== attestatoId);

  await supabaseClient.from('utenti').update({ attestati: attestatiAggiornati }).eq('id', utenteId);
  alert("🗑️ Documento eliminato!");
  apriSchedaAnagrafica(utenteId);
  caricaTuttiGliUtenti();
}

async function apriSchedaAnagrafica(id) {
  const { data: u } = await supabaseClient.from('utenti').select('*').eq('id', id).single();
  if (!u) return;

  let dataNascitaFormatted = '-';
  if (u.data_nascita) {
    const parti = u.data_nascita.split('-');
    if (parti.length === 3) dataNascitaFormatted = `${parti[2]}/${parti[1]}/${parti[0]}`;
  }

  const permessiLista = u.ruolo === 'master' 
    ? '<b>Accesso Totale (Master)</b>' 
    : Object.entries(u.permessi || {})
        .filter(([_, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ') || 'Nessun permesso speciale';

  const attestatiHtml = (u.attestati && u.attestati.length > 0) ? u.attestati.map(a => `
    <div class="flex justify-between items-center p-2.5 bg-gray-50 border rounded-lg text-xs mb-2">
      <div>
        <span class="font-bold text-blue-900">${a.titolo}</span>
        <div class="text-[10px] text-gray-500">File: ${a.nomeFile} (${a.dataCaricamento})</div>
      </div>
      <div class="flex items-center gap-2 no-print">
        <a href="${a.fileUrl || a.dati}" target="_blank" class="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Visualizza</a>
        <button onclick="eliminaAttestato('${u.id}', ${a.id}, '${a.storagePath || ''}')" class="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700">🗑️ Elimina</button>
      </div>
    </div>
  `).join('') : `<p class="text-xs text-gray-400 italic">Nessun corso o attestato allegato.</p>`;

  const html = `
    <div class="text-center pb-4 border-b">
      <h2 class="text-2xl font-bold text-blue-900">Villa Olimpia</h2>
      <p class="text-xs text-gray-500 uppercase tracking-widest">Scheda Personale dipendente</p>
    </div>
    <div class="grid grid-cols-2 gap-4 pt-2">
      <div><b>Nome e Cognome:</b> ${u.cognome} ${u.nome}</div>
      <div><b>Categoria:</b> ${u.categoria}</div>
      <div><b>Data di Nascita:</b> ${dataNascitaFormatted}</div>
      <div><b>Luogo di Nascita:</b> ${u.luogo_nascita || '-'} (${u.provincia_nascita || ''})</div>
      <div><b>Codice Fiscale:</b> ${u.codice_fiscale || '-'}</div>
      <div><b>Telefono:</b> ${u.telefono || '-'}</div>
      <div><b>Email (Login):</b> ${u.email}</div>
      <div><b>Residenza:</b> ${u.residenza || '-'}</div>
      <div class="col-span-2 bg-blue-50 p-2 rounded border"><b>Permessi di Sistema:</b> ${permessiLista}</div>
      <div><b>Antincendio:</b> ${u.antincendio ? 'Sì 🔥' : 'No'}</div>
    </div>
    <div class="pt-4 border-t">
      <h4 class="font-bold text-sm text-blue-900 mb-2">📎 Corsi e Attestati Allegati:</h4>
      <div class="space-y-2">${attestatiHtml}</div>
    </div>
  `;

  document.getElementById('contenutoSchedaAnagrafica').innerHTML = html;
  document.getElementById('modalAnagraficaCompleta').classList.remove('hidden');
}

function chiudiModalAnagraficaCompleta() {
  document.getElementById('modalAnagraficaCompleta').classList.add('hidden');
}

function logout() {
  localStorage.removeItem('villa_olimpia_sessione');
  utenteCorrente = null;
  location.reload();
}

// ==========================================
// MODULO COMUNICAZIONI & MANSIONI
// ==========================================

let filtroComAttivo = 'tutte';

async function inizializzaComunicazioni() {
  await aggiornaStatoCampanellaNotifiche();
  const vistaCorrente = document.getElementById('vista-comunicazioni');
  if (vistaCorrente && !vistaCorrente.classList.contains('hidden')) {
    caricaBachecaComunicazioni();
    if (utenteCorrente?.ruolo === 'master') {
      caricaDiarioAttivitaMaster();
    }
  }
}

async function aggiornaStatoCampanellaNotifiche() {
  if (!supabaseClient || !utenteCorrente) return;

  const { data: coms } = await supabaseClient.from('comunicazioni').select('id, destinatari, letture');
  if (!coms) return;

  let nonLetteCount = 0;

  coms.forEach(c => {
    const destinatariOk = c.destinatari === 'tutti' || c.destinatari === utenteCorrente.categoria || utenteCorrente.ruolo === 'master';
    if (destinatatariOk) {
      const letture = c.letture || [];
      const giaLetto = letture.includes(utenteCorrente.id);
      if (!giaLetto) nonLetteCount++;
    }
  });

  const pallinoRosso = document.getElementById('badgePallinoRosso');
  const campanellaBtn = document.getElementById('btnCampanellaNotifiche');
  const badgeSidebar = document.getElementById('badgeContatoreRossoSidebar');

  if (nonLetteCount > 0) {
    if (pallinoRosso) pallinoRosso.classList.remove('hidden');
    if (campanellaBtn) campanellaBtn.classList.add('text-red-300', 'animate-bounce');
    if (badgeSidebar) {
      badgeSidebar.innerText = nonLetteCount;
      badgeSidebar.classList.remove('hidden');
    }
  } else {
    if (pallinoRosso) pallinoRosso.classList.add('hidden');
    if (campanellaBtn) campanellaBtn.classList.remove('text-red-300', 'animate-bounce');
    if (badgeSidebar) badgeSidebar.classList.add('hidden');
  }
}

async function caricaBachecaComunicazioni() {
  if (!supabaseClient) return;

  const { data: coms } = await supabaseClient
    .from('comunicazioni')
    .select('*, utenti(nome, cognome), ospiti(nome, cognome)')
    .order('creato_il', { ascending: false });

  const container = document.getElementById('grigliaComunicazioni');
  if (!container) return;

  const comsFiltrate = (coms || []).filter(c => {
    const destinatariOk = c.destinatari === 'tutti' || c.destinatari === utenteCorrente.categoria || utenteCorrente.ruolo === 'master';
    if (!destinatariOk) return false;

    const letture = c.letture || [];
    const letto = letture.includes(utenteCorrente.id);

    if (filtroComAttivo === 'non_lette') return !letto;
    if (filtroComAttivo === 'mansioni') return c.tipo === 'mansione';
    return true;
  });

  if (comsFiltrate.length === 0) {
    container.innerHTML = `<div class="bg-white p-8 rounded-xl border text-center text-gray-400 text-xs">Nessuna comunicazione presente in bacheca.</div>`;
    return;
  }

  container.innerHTML = comsFiltrate.map(c => {
    const letture = c.letture || [];
    const letto = letture.includes(utenteCorrente.id);
    const dataFormatted = new Date(c.creato_il).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });

    const badgeTipo = c.tipo === 'mansione' 
      ? `<span class="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase">📋 Mansione</span>` 
      : `<span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase">📢 Comunicazione</span>`;

    const badgeDest = `<span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[10px] font-bold">Destinatari: ${c.destinatari.toUpperCase()}</span>`;
    const ospiteInfo = c.ospiti ? `<div class="mt-2 text-xs font-bold text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">🏠 Riferimento Ospite: ${c.ospiti.cognome} ${c.ospiti.nome}</div>` : '';

    const statoLettoBtn = letto 
      ? `<span class="text-green-600 font-bold text-xs flex items-center gap-1">✅ Letto</span>`
      : `<button onclick="segnaComeLetto('${c.id}')" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow">Segna come Letto</button>`;

    const eliminaBtn = utenteCorrente.ruolo === 'master' 
      ? `<button onclick="eliminaComunicazione('${c.id}')" class="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">🗑️ Elimina</button>`
      : '';

    const classeBordoNonLetto = !letto ? 'border-l-4 border-l-red-600 bg-blue-50/30' : 'bg-white';

    return `
      <div class="${classeBordoNonLetto} p-5 rounded-2xl shadow-md border space-y-3 transition">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              ${badgeTipo} ${badgeDest}
            </div>
            <h3 class="text-base font-bold text-blue-900">${c.titolo}</h3>
            <div class="text-[11px] text-gray-500">Inviato da: <b>${c.utenti?.cognome || 'Master'} ${c.utenti?.nome || ''}</b> il ${dataFormatted}</div>
          </div>
          <div class="flex items-center gap-2">
            ${statoLettoBtn}
            ${eliminaBtn}
          </div>
        </div>

        <p class="text-xs text-gray-700 whitespace-pre-line bg-white p-3 rounded-xl border">${c.testo}</p>
        ${ospiteInfo}
      </div>
    `;
  }).join('');
}

function filtraComunicazioni(tipo) {
  filtroComAttivo = tipo;
  ['tutte', 'non_lette', 'mansioni'].forEach(t => {
    const btn = document.getElementById(`filtroCom-${t}`);
    if (btn) {
      if (t === tipo) {
        btn.className = 'px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold transition';
      } else {
        btn.className = 'px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition';
      }
    }
  });
  caricaBachecaComunicazioni();
}

async function segnaComeLetto(idCom) {
  if (!supabaseClient || !utenteCorrente) return;

  const { data: c } = await supabaseClient.from('comunicazioni').select('letture').eq('id', idCom).single();
  if (!c) return;

  let letture = c.letture || [];
  if (!letture.includes(utenteCorrente.id)) {
    letture.push(utenteCorrente.id);
    await supabaseClient.from('comunicazioni').update({ letture }).eq('id', idCom);
    caricaBachecaComunicazioni();
    aggiornaStatoCampanellaNotifiche();
  }
}

async function apriModalNuovaComunicazione() {
  const { data: ospiti } = await supabaseClient.from('ospiti').select('*').order('cognome');
  const selOspiti = document.getElementById('comOspiteId');
  if (selOspiti && ospiti) {
    selOspiti.innerHTML = `<option value="">-- Nessun ospite specifico (Mansione/Com. Generale) --</option>` +
      ospiti.map(o => `<option value="${o.id}">${o.cognome} ${o.nome}</option>`).join('');
  }

  document.getElementById('formNuovaComunicazione').reset();
  document.getElementById('modalNuovaComunicazione').classList.remove('hidden');
}

function chiudiModalNuovaComunicazione() {
  document.getElementById('modalNuovaComunicazione').classList.add('hidden');
}

async function inviaComunicazione(e) {
  e.preventDefault();
  const titolo = document.getElementById('comTitolo').value.trim();
  const tipo = document.getElementById('comTipo').value;
  const destinatari = document.getElementById('comDestinatari').value;
  const ospite_id = document.getElementById('comOspiteId').value || null;
  const testo = document.getElementById('comTesto').value.trim();

  const payload = {
    mittente_id: utenteCorrente.id,
    titolo: titolo,
    testo: testo,
    tipo: tipo,
    destinatari: destinatari,
    ospite_id: ospite_id,
    letture: [utenteCorrente.id]
  };

  const { error } = await supabaseClient
    .from('comunicazioni')
    .insert([payload]);

  if (error) {
    alert("❌ Errore invio comunicazione: " + error.message);
  } else {
    alert("✅ Comunicazione / Mansione inviata con successo!");
    await registraAttivitaDiario(utenteCorrente.id, "Invio Comunicazione", `Inviata comunicazione/mansione: "${titolo}"`);
    chiudiModalNuovaComunicazione();
    caricaBachecaComunicazioni();
    aggiornaStatoCampanellaNotifiche();
  }
}

async function eliminaComunicazione(id) {
  if (!confirm("Sei sicuro di voler eliminare questa comunicazione?")) return;
  await supabaseClient.from('comunicazioni').delete().eq('id', id);
  await registraAttivitaDiario(utenteCorrente.id, "Eliminazione", `Eliminata comunicazione ID ${id}`);
  caricaBachecaComunicazioni();
  aggiornaStatoCampanellaNotifiche();
}

// ==========================================
// MODULO DIARIO GIORNALIERO DEL MASTER
// ==========================================

async function registraAttivitaDiario(utenteId, azione, dettagli, categoria = 'Generale') {
  if (!supabaseClient) return;
  await supabaseClient.from('diario_attivita').insert([{
    utente_id: utenteId,
    azione: azione,
    dettagli: dettagli,
    categoria: categoria
  }]);
}

async function caricaDiarioAttivitaMaster() {
  if (!supabaseClient || utenteCorrente?.ruolo !== 'master') return;

  const container = document.getElementById('contenutoDiarioMaster');
  if (!container) return;

  const { data: attivita, error } = await supabaseClient
    .from('diario_attivita')
    .select('*, utenti(nome, cognome, ruolo, categoria)')
    .order('creato_il', { ascending: false })
    .limit(50);

  if (error) {
    container.innerHTML = `<div class="p-4 text-center text-red-500 text-xs">Errore caricamento diario: ${error.message}</div>`;
    return;
  }

  if (!attivita || attivita.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-gray-400 text-xs">Nessuna attività registrata nel diario.</div>`;
    return;
  }

  container.innerHTML = attivita.map(a => {
    const dataFormatted = new Date(a.creato_il).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
    const utenteNome = a.utenti ? `${a.utenti.cognome} ${a.utenti.nome} (${a.utenti.ruolo.toUpperCase()})` : 'Sistema';
    
    let badgeColore = 'bg-blue-100 text-blue-800';
    if (a.azione && a.azione.includes('Turni')) badgeColore = 'bg-purple-100 text-purple-800';
    if (a.azione && a.azione.includes('Assenza')) badgeColore = 'bg-amber-100 text-amber-800';
    if (a.azione && a.azione.includes('Eliminazione')) badgeColore = 'bg-red-100 text-red-800';

    return `
      <div class="flex items-start justify-between p-3 bg-gray-50 border rounded-xl shadow-sm text-xs space-x-3 mb-2">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded font-bold text-[10px] ${badgeColore}">${a.azione}</span>
            <span class="text-gray-500 font-semibold">Operatore: ${utenteNome}</span>
          </div>
          <p class="text-gray-700">${a.dettagli}</p>
        </div>
        <div class="text-[10px] text-gray-400 whitespace-nowrap">${dataFormatted}</div>
      </div>
    `;
  }).join('');
}

// ==========================================
// MODULO TURNAZIONE AVANZATO VILLA OLIMPIA
// ==========================================

let sigleMappa = {};
let matriceTurni = {}; 
let matriceOre = {};   
let giorniFestivi = []; 
let eccezioniIA = [];

const FESTIVITA_NAZIONALI = [
  '01-01', '01-06', '04-25', '05-01', '06-02', '08-15', '11-01', '12-08', '12-25', '12-26'
];

async function caricaSigleTurni() {
  if (!supabaseClient) return;
  const { data: sigle } = await supabaseClient.from('sigle_turni').select('*').order('sigla');
  
  if (!sigle || sigle.length === 0) {
    const siglePredefinite = [
      { sigla: 'M', ora_inizio: '07:00', ora_fine: '14:00', ore_totali: 7, descrizione: 'Mattina' },
      { sigla: 'P', ora_inizio: '14:00', ora_fine: '21:00', ore_totali: 7, descrizione: 'Pomeriggio' },
      { sigla: 'N', ora_inizio: '21:00', ora_fine: '07:00', ore_totali: 10, descrizione: 'Notte' },
      { sigla: 'SM', ora_inizio: '00:00', ora_fine: '07:00', ore_totali: 7, descrizione: 'Smonto Notte' },
      { sigla: 'R', ora_inizio: '00:00', ora_fine: '00:00', ore_totali: 0, descrizione: 'Riposo' },
      { sigla: 'F', ora_inizio: '00:00', ora_fine: '00:00', ore_totali: 0, descrizione: 'Ferie' },
      { sigla: 'MAL', ora_inizio: '00:00', ora_fine: '00:00', ore_totali: 0, descrizione: 'Malattia' },
      { sigla: 'X', ora_inizio: '00:00', ora_fine: '00:00', ore_totali: 0, descrizione: 'Assenza' }
    ];
    await supabaseClient.from('sigle_turni').insert(siglePredefinite);
    const { data: sigleNuove } = await supabaseClient.from('sigle_turni').select('*').order('sigla');
    sigleMappa = {};
    (sigleNuove || []).forEach(s => { sigleMappa[s.sigla] = s; });
    return;
  }

  sigleMappa = {};
  (sigle || []).forEach(s => {
    sigleMappa[s.sigla] = s;
  });
}

async function caricaTabellaTurniSpecifica(categoria) {
  const inputMese = document.getElementById(`turniMeseAnno-${categoria}`);
  if (!inputMese) return;
  
  if (!inputMese.value) {
    const oggi = new Date();
    const mese = String(oggi.getMonth() + 1).padStart(2, '0');
    inputMese.value = `${oggi.getFullYear()}-${mese}`;
  }

  const meseAnno = inputMese.value;
  if (!supabaseClient) return;

  await caricaSigleTurni();

  const permessoTurni = categoria === 'OSS' ? 'turni_oss' : 'turni_infermieri';
  const puoGestireAssenze = utenteCorrente?.ruolo === 'master' || 
                           (utenteCorrente?.permessi && (utenteCorrente.permessi.assenze || utenteCorrente.permessi[permessoTurni]));

  const formAssenzaContainer = document.getElementById(`formAssenza-${categoria}`)?.closest('.bg-white') || document.getElementById(`formAssenza-${categoria}`);
  const registroAssenzeContainer = document.getElementById(`listaAssenze-${categoria}`)?.closest('.bg-white') || document.getElementById(`listaAssenze-${categoria}`);

  if (formAssenzaContainer) {
    if (puoGestireAssenze) formAssenzaContainer.classList.remove('hidden');
    else formAssenzaContainer.classList.add('hidden');
  }

  if (registroAssenzeContainer) {
    if (puoGestireAssenze) registroAssenzeContainer.classList.remove('hidden');
    else registroAssenzeContainer.classList.add('hidden');
  }

  const btnManuale = document.getElementById(`btnSalvaTurni-${categoria}`);
  const btnIA = document.getElementById(`btnSalvaIA-${categoria}`);
  if (btnManuale) { btnManuale.classList.remove('hidden'); btnManuale.style.opacity = '1'; }
  if (btnIA) btnIA.classList.add('hidden');

  const { data: utenti } = await supabaseClient
    .from('utenti')
    .select('*')
    .eq('categoria', categoria)
    .eq('attivo', true)
    .order('cognome');

  if (!utenti) return;

  const selectAssenza = document.getElementById(`assenzaUtente-${categoria}`);
  if (selectAssenza) {
    selectAssenza.innerHTML = utenti.map(u => `<option value="${u.id}">${u.cognome} ${u.nome}</option>`).join('');
  }

  const { data: turniSalvati } = await supabaseClient
    .from('turni_mensili')
    .select('*')
    .eq('mese_anno', meseAnno)
    .eq('categoria', categoria);

  matriceTurni = {};
  matriceOre = {};

  (turniSalvati || []).forEach(t => {
    matriceTurni[`${t.utente_id}_${t.giorno}`] = t.sigla;
    matriceOre[`${t.utente_id}_${t.giorno}`] = parseFloat(t.ore_effettive || 0);
  });

  await caricaEApplicaAssenzeSpecifica(meseAnno, categoria);
  costruisciCalendarioHTMLSpecifica(meseAnno, utenti, categoria, turniSalvati || []);
  if (puoGestireAssenze) {
    caricaRegistroAssenzeSpecifica(categoria);
  }
}

function costruisciCalendarioHTMLSpecifica(meseAnno, utenti, categoria, turniSalvati = []) {
  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorni = new Date(anno, mese, 0).getDate();

  const head = document.getElementById(`headTabellaTurni-${categoria}`);
  const body = document.getElementById(`bodyTabellaTurni-${categoria}`);
  const foot = document.getElementById(`footTabellaTurni-${categoria}`);

  if (!head || !body || !foot) return;

  const permessoCategoria = categoria === 'OSS' ? 'turni_oss' : 'turni_infermieri';
  const puoModificare = utenteCorrente?.ruolo === 'master' || (utenteCorrente?.permessi && utenteCorrente.permessi[permessoCategoria]);
  
  const isPubblicato = turniSalvati.some(t => t.pubblicato === true);

  const controlliTurno = document.querySelectorAll(`#vista-turni-${categoria.toLowerCase()} button`);
  controlliTurno.forEach(b => {
    if (b.innerText.includes('Invia') || b.innerText.includes('Salva') || b.innerText.includes('Genera') || b.innerText.includes('Configura')) {
      if (puoModificare) b.classList.remove('hidden');
      else b.classList.add('hidden');
    }
  });

  if (!puoModificare && !isPubblicato) {
    head.innerHTML = '';
    body.innerHTML = `
      <tr>
        <td colspan="35" class="p-12 text-center bg-amber-50/50 rounded-2xl border border-amber-200">
          <div class="text-3xl mb-2">🔒</div>
          <h3 class="text-base font-bold text-amber-900">Turni in fase di pianificazione</h3>
          <p class="text-xs text-amber-700 mt-1">I turni per il mese di <b>${meseAnno}</b> non sono ancora stati pubblicati dalla direzione.</p>
        </td>
      </tr>
    `;
    foot.innerHTML = '';
    return;
  }

  giorniFestivi = [];
  let trGiornoSett = `<tr class="bg-blue-950 text-[11px] text-blue-200"><th class="p-2.5 border-r text-left w-64 min-w-[240px]">Lavoratore (${categoria})</th>`;
  let trGiornoNum = `<tr><th class="p-2.5 border-r text-left text-xs font-bold w-64 min-w-[240px]">Mese: ${meseAnno}</th>`;

  const nomiGiorni = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

  for (let g = 1; g <= numGiorni; g++) {
    const dataGiorno = new Date(anno, mese - 1, g);
    const giornoSett = dataGiorno.getDay();
    const mmGiorno = String(mese).padStart(2, '0') + '-' + String(g).padStart(2, '0');

    const isDomenica = giornoSett === 0;
    const isSabato = giornoSett === 6;
    const isSuperFestivo = FESTIVITA_NAZIONALI.includes(mmGiorno);

    let bgHeader = 'bg-blue-900';
    if (isSuperFestivo) { bgHeader = 'bg-red-700 text-white font-extrabold'; giorniFestivi.push(g); }
    else if (isDomenica) { bgHeader = 'bg-red-600 text-white font-bold'; giorniFestivi.push(g); }
    else if (isSabato) { bgHeader = 'bg-amber-600 text-white'; giorniFestivi.push(g); }

    trGiornoSett += `<th class="p-2 border-r text-[10px] ${bgHeader} min-w-[55px]">${nomiGiorni[giornoSett]}</th>`;
    trGiornoNum += `<th class="p-2 border-r text-xs ${bgHeader} min-w-[55px]">${g}</th>`;
  }

  trGiornoSett += '<th class="p-2.5 w-20 min-w-[80px] bg-blue-950 text-white">TOT</th></tr>';
  trGiornoNum += '<th class="p-2.5 w-20 min-w-[80px] bg-blue-950 text-white">ORE</th></tr>';

  head.innerHTML = trGiornoSett + trGiornoNum;

  let bodyHtml = '';
  let totaleComplessivoMese = 0;
  const totaleOreGiornaliere = Array(numGiorni + 1).fill(0);
  const presenzaAntincendioGiornaliera = Array(numGiorni + 1).fill(false);

  utenti.forEach(u => {
    const iconaAntincendio = u.antincendio ? `<span class="ml-1 text-red-600 text-sm" title="Abilitato Antincendio">🔥</span>` : '';

    let rigaHtml = `<tr class="hover:bg-gray-50 border-b">
      <td class="p-2.5 font-bold text-left border-r text-blue-950 whitespace-nowrap bg-gray-50 w-64 min-w-[240px]">
        ${u.cognome} ${u.nome} ${iconaAntincendio}
      </td>`;

    let totOreUtente = 0;

    for (let g = 1; g <= numGiorni; g++) {
      const chiave = `${u.id}_${g}`;
      const siglaAttuale = matriceTurni[chiave] || '';
      const oreGiorno = matriceOre[chiave] || 0;

      totOreUtente += oreGiorno;
      totaleOreGiornaliere[g] += oreGiorno;

      if (u.antincendio && siglaAttuale && !['F', 'MAL', 'X'].includes(siglaAttuale)) {
        presenzaAntincendioGiornaliera[g] = true;
      }

      const isFestivo = giorniFestivi.includes(g);
      const bgCella = isFestivo ? 'bg-amber-50/50' : 'bg-white';
      const isAssenza = ['F', 'MAL', 'X'].includes(siglaAttuale);

      if (isAssenza) {
        rigaHtml += `<td class="p-2 border-r ${bgCella} font-extrabold text-red-600 bg-red-50 text-center text-sm min-w-[55px]">${siglaAttuale}</td>`;
      } else if (!puoModificare) {
        rigaHtml += `<td class="p-2 border-r ${bgCella} font-extrabold text-center text-sm min-w-[55px]">${siglaAttuale || '-'}</td>`;
      } else {
        let opzioniSigle = `<option value="">-</option>`;
        Object.keys(sigleMappa).forEach(s => {
          const selected = siglaAttuale === s ? 'selected' : '';
          opzioniSigle += `<option value="${s}" ${selected}>${s}</option>`;
        });

        rigaHtml += `<td class="p-1 border-r ${bgCella} min-w-[55px]">
          <select onchange="cambiaTurnoCellaSpecifica('${u.id}', ${g}, this.value, '${categoria}')" class="w-full text-center font-extrabold text-sm bg-transparent outline-none cursor-pointer py-1.5">
            ${opzioniSigle}
          </select>
        </td>`;
      }
    }

    totaleComplessivoMese += totOreUtente;
    rigaHtml += `<td class="p-2.5 border-l bg-blue-50 font-extrabold text-blue-900 text-center text-xs min-w-[80px]">${totOreUtente.toFixed(1)}h</td></tr>`;
    bodyHtml += rigaHtml;
  });

  body.innerHTML = bodyHtml;

  let footHtml = `<tr><td class="p-2.5 border-r text-left text-xs uppercase font-extrabold w-64 min-w-[240px]">Totale Ore ${categoria}</td>`;
  for (let g = 1; g <= numGiorni; g++) {
    const fiammellaGiorno = presenzaAntincendioGiornaliera[g] ? `<div class="text-red-500 text-xs leading-none mt-1 font-bold" title="Copertura Antincendio presente">🔥</div>` : '';
    footHtml += `<td class="p-2 border-r text-[10px] text-center font-bold min-w-[55px]">
      <div>${totaleOreGiornaliere[g].toFixed(1)}</div>
      ${fiammellaGiorno}
    </td>`;
  }
  footHtml += `<td class="p-2.5 bg-red-600 text-white font-extrabold text-center text-sm min-w-[80px]">${totaleComplessivoMese.toFixed(1)}h</td></tr>`;

  foot.innerHTML = footHtml;
}

function cambiaTurnoCellaSpecifica(utenteId, giorno, nuovaSigla, categoria) {
  const meseAnno = document.getElementById(`turniMeseAnno-${categoria}`).value;
  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorniMese = new Date(anno, mese, 0).getDate();

  const chiave = `${utenteId}_${giorno}`;
  matriceTurni[chiave] = nuovaSigla;

  if (!nuovaSigla || !sigleMappa[nuovaSigla]) {
    matriceOre[chiave] = 0;
  } else {
    const siglaInfo = sigleMappa[nuovaSigla];
    let [oraInizio, minInizio] = siglaInfo.ora_inizio.split(':').map(Number);
    let [oraFine, minFine] = siglaInfo.ora_fine.split(':').map(Number);

    if (oraFine < oraInizio || (oraFine === oraInizio && minFine < minInizio)) {
      const oreOggi = 24 - (oraInizio + minInizio / 60);
      const oreDomani = oraFine + minFine / 60;
      matriceOre[chiave] = oreOggi;

      if (giorno < numGiorniMese) {
        const chiaveDomani = `${utenteId}_${giorno + 1}`;
        if (!matriceTurni[chiaveDomani]) {
          matriceTurni[chiaveDomani] = 'SM';
          matriceOre[chiaveDomani] = oreDomani;
        }
      } else {
        salvaNotteMeseSuccessivo(utenteId, anno, mese, oreDomani, categoria);
      }
    } else {
      matriceOre[chiave] = parseFloat(siglaInfo.ore_totali || 0);
    }
  }

  supabaseClient.from('utenti').select('*').eq('categoria', categoria).eq('attivo', true).order('cognome').then(({ data: utenti }) => {
    costruisciCalendarioHTMLSpecifica(meseAnno, utenti, categoria);
  });
}

async function salvaNotteMeseSuccessivo(utenteId, anno, mese, oreDomani, categoria) {
  let prossimoAnno = anno;
  let prossimoMese = mese + 1;
  if (prossimoMese > 12) {
    prossimoMese = 1;
    prossimoAnno++;
  }

  const meseAnnoSuccessivo = `${prossimoAnno}-${String(prossimoMese).padStart(2, '0')}`;

  await supabaseClient.from('turni_mensili').upsert([{
    mese_anno: meseAnnoSuccessivo,
    categoria: categoria,
    utente_id: utenteId,
    giorno: 1,
    sigla: 'SM',
    ore_effettive: oreDomani
  }]);
}

async function salvaTurniSpecifica(categoria) {
  const meseAnno = document.getElementById(`turniMeseAnno-${categoria}`).value;
  const arrayRecord = [];

  Object.keys(matriceTurni).forEach(k => {
    const [utente_id, giorno] = k.split('_');
    const sigla = matriceTurni[k];
    const ore_effettive = matriceOre[k] || 0;

    if (sigla) {
      arrayRecord.push({
        mese_anno: meseAnno,
        categoria: categoria,
        utente_id: utente_id,
        giorno: parseInt(giorno),
        sigla: sigla,
        ore_effettive: ore_effettive
      });
    }
  });

  const { error } = await supabaseClient.from('turni_mensili').upsert(arrayRecord, { onConflict: 'mese_anno,categoria,utente_id,giorno' });

  if (error) {
    alert("❌ Errore salvataggio turni: " + error.message);
  } else {
    alert(`✅ Turnazione ${categoria} salvata con successo!`);
    await registraAttivitaDiario(utenteCorrente.id, "Salvataggio Turni", `Salvata turnazione ${categoria} per il mese ${meseAnno}`);
    caricaTabellaTurniSpecifica(categoria);
  }
}

async function pubblicaEInviaTurni(categoria) {
  const meseAnno = document.getElementById(`turniMeseAnno-${categoria}`).value;
  if (!meseAnno || !supabaseClient) return;

  if (!confirm(`Sei sicuro di voler pubblicare e inviare i turni di ${categoria} per il mese ${meseAnno}?\nVerrà inviata una comunicazione automatica a tutto il personale della categoria.`)) return;

  const arrayRecord = [];
  Object.keys(matriceTurni).forEach(k => {
    const [utente_id, giorno] = k.split('_');
    const sigla = matriceTurni[k];
    const ore_effettive = matriceOre[k] || 0;

    if (sigla) {
      arrayRecord.push({
        mese_anno: meseAnno,
        categoria: categoria,
        utente_id: utente_id,
        giorno: parseInt(giorno),
        sigla: sigla,
        ore_effettive: ore_effettive,
        pubblicato: true
      });
    }
  });

  if (arrayRecord.length === 0) {
    alert("❌ Impossibile pubblicare: la tabella turni è vuota.");
    return;
  }

  const { error: errTurni } = await supabaseClient
    .from('turni_mensili')
    .upsert(arrayRecord, { onConflict: 'mese_anno,categoria,utente_id,giorno' });

  if (errTurni) {
    alert("❌ Errore durante la pubblicazione dei turni: " + errTurni.message);
    return;
  }

  const [anno, mese] = meseAnno.split('-');
  const nomeMese = new Date(anno, mese - 1, 1).toLocaleString('it-IT', { month: 'long' });
  const titoloCom = `📅 Pubblicazione Turni ${categoria.toUpperCase()} - ${nomeMese.toUpperCase()} ${anno}`;
  const testoCom = `Si informa tutto il personale appartenente alla categoria ${categoria} che i turni relativi al mese di ${nomeMese} ${anno} sono stati pubblicati e sono ora consultabili nella propria area gestionale.`;

  const payloadCom = {
    mittente_id: utenteCorrente.id,
    titolo: titoloCom,
    testo: testoCom,
    tipo: 'comunicazione',
    destinatari: categoria,
    letture: [utenteCorrente.id]
  };

  const { error: errCom } = await supabaseClient.from('comunicazioni').insert([payloadCom]);

  if (errCom) {
    alert("⚠️ Turni pubblicati, ma si è verificato un errore nell'invio della notifica: " + errCom.message);
  } else {
    alert(`✅ Turni di ${categoria} pubblicati con successo!\nÈ stata inviata una comunicazione automatica a tutti gli operatori.`);
    await registraAttivitaDiario(utenteCorrente.id, "Pubblicazione Turni", `Pubblicati i turni di ${categoria} per il mese ${meseAnno}`);
    caricaBachecaComunicazioni();
    aggiornaStatoCampanellaNotifiche();
  }
}

async function registraAssenzaSpecifica(e, categoria) {
  if (e) e.preventDefault();
  
  const selectUtente = document.getElementById(`assenzaUtente-${categoria}`);
  const inputDal = document.getElementById(`assenzaDal-${categoria}`);
  const inputAl = document.getElementById(`assenzaAl-${categoria}`);
  const selectTipo = document.getElementById(`assenzaTipo-${categoria}`);

  if (!selectUtente || !inputDal || !inputAl || !selectTipo) {
    alert("❌ Errore: elementi del form assenze non trovati.");
    return;
  }

  const utente_id = selectUtente.value;
  const dal = inputDal.value;
  const al = inputAl.value;
  const tipo = selectTipo.value;

  if (!utente_id || !dal || !al) {
    alert("⚠️ Compila tutti i campi obbligatori per registrare l'assenza.");
    return;
  }

  if (!supabaseClient) {
    alert("❌ Connessione a Supabase non disponibile.");
    return;
  }

  const { error } = await supabaseClient
    .from('assenze_registro')
    .insert([{ utente_id, tipo, data_inizio: dal, data_fine: al }]);

  if (error) {
    alert("❌ Errore durante la registrazione dell'assenza: " + error.message);
  } else {
    alert("✅ Assenza registrata correttamente!");
    await registraAttivitaDiario(utenteCorrente.id, "Registrazione Assenza", `Registrata assenza (${tipo}) dal ${dal} al ${al}`);
    
    const formEl = document.getElementById(`formAssenza-${categoria}`);
    if (formEl) formEl.reset();
    
    caricaTabellaTurniSpecifica(categoria);
  }
}

async function caricaEApplicaAssenzeSpecifica(meseAnno, categoria) {
  const { data: assenze } = await supabaseClient.from('assenze_registro').select('*');
  if (!assenze) return;

  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorniMese = new Date(anno, mese, 0).getDate();

  assenze.forEach(a => {
    const dtInizio = new Date(a.data_inizio);
    const dtFine = new Date(a.data_fine);

    for (let g = 1; g <= numGiorniMese; g++) {
      const dtCorrente = new Date(anno, mese - 1, g);
      if (dtCorrente >= dtInizio && dtCorrente <= dtFine) {
        const chiave = `${a.utente_id}_${g}`;
        matriceTurni[chiave] = a.tipo;
        matriceOre[chiave] = 0;
      }
    }
  });
}

async function caricaRegistroAssenzeSpecifica(categoria) {
  const { data: assenze } = await supabaseClient
    .from('assenze_registro')
    .select('*, utenti(nome, cognome, categoria)')
    .order('data_inizio', { ascending: false });

  const tbody = document.getElementById(`listaAssenze-${categoria}`);
  if (!tbody) return;

  const assenzeFiltrate = (assenze || []).filter(a => a.utenti?.categoria === categoria);

  if (assenzeFiltrate.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">Nessuna assenza per ${categoria}.</td></tr>`;
    return;
  }

  tbody.innerHTML = assenzeFiltrate.map(a => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2 font-bold text-blue-900">${a.utenti?.cognome || ''} ${a.utenti?.nome || ''}</td>
      <td class="p-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.tipo === 'F' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">${a.tipo}</span></td>
      <td class="p-2 text-gray-600">${a.data_inizio} ➔ ${a.data_fine}</td>
      <td class="p-2 text-center">
        <button onclick="eliminaAssenzaSpecifica('${a.id}', '${categoria}')" class="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700">Elimina</button>
      </td>
    </tr>
  `).join('');
}

async function eliminaAssenzaSpecifica(id, categoria) {
  if (!confirm("Rimuovere questa assenza?")) return;
  const { error } = await supabaseClient.from('assenze_registro').delete().eq('id', id);
  if (!error) {
    await registraAttivitaDiario(utenteCorrente.id, "Eliminazione Assenza", `Rimossa assenza ID ${id}`);
    caricaTabellaTurniSpecifica(categoria);
  }
}

function apriModalGestioneSigle() {
  document.getElementById('editSiglaId').value = '';
  document.getElementById('formNuovaSigla').reset();
  document.getElementById('btnSalvaSigla').innerText = '+ Aggiungi';
  caricaModalSigle();
  document.getElementById('modalSigleTurni').classList.remove('hidden');
}

function chiudiModalGestioneSigle() {
  document.getElementById('modalSigleTurni').classList.add('hidden');
}

async function caricaModalSigle() {
  if (!supabaseClient) return;
  await caricaSigleTurni();
  const tbody = document.getElementById('listaSigleEsistenti');
  if (!tbody) return;

  const sigleArray = Object.values(sigleMappa);

  if (sigleArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-gray-400">Nessuna sigla configurata.</td></tr>`;
    return;
  }

  tbody.innerHTML = sigleArray.map(s => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2 font-bold text-blue-900">${s.sigla} <span class="text-[10px] text-gray-400 font-normal">(${s.descrizione || ''})</span></td>
      <td class="p-2 text-gray-600">${s.ora_inizio} - ${s.ora_fine}</td>
      <td class="p-2 font-mono font-bold">${s.ore_totali}h</td>
      <td class="p-2 text-center space-x-1">
        <button onclick="preparaModificaSigla('${s.id}')" class="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700">✏️</button>
        <button onclick="eliminaSigla('${s.id}', '${s.sigla}')" class="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function preparaModificaSigla(id) {
  const s = Object.values(sigleMappa).find(item => item.id === id);
  if (!s) return;

  document.getElementById('editSiglaId').value = s.id;
  document.getElementById('siglaCodice').value = s.sigla;
  document.getElementById('siglaInizio').value = s.ora_inizio;
  document.getElementById('siglaFine').value = s.ora_fine;
  document.getElementById('siglaDesc').value = s.descrizione || '';
  document.getElementById('btnSalvaSigla').innerText = '💾 Salva';
}

async function salvaNuovaSigla(e) {
  e.preventDefault();
  const editId = document.getElementById('editSiglaId').value;
  const sigla = document.getElementById('siglaCodice').value.trim().toUpperCase();
  const ora_inizio = document.getElementById('siglaInizio').value;
  const ora_fine = document.getElementById('siglaFine').value;
  const descrizione = document.getElementById('siglaDesc').value.trim();

  let [h1, m1] = ora_inizio.split(':').map(Number);
  let [h2, m2] = ora_fine.split(':').map(Number);

  let ore = (h2 + m2 / 60) - (h1 + m1 / 60);
  if (ore < 0) ore += 24;

  let result;
  if (editId) {
    result = await supabaseClient.from('sigle_turni').update({
      sigla, ora_inizio, ora_fine, ore_totali: ore.toFixed(2), descrizione
    }).eq('id', editId);
  } else {
    result = await supabaseClient.from('sigle_turni').insert([{
      sigla, ora_inizio, ora_fine, ore_totali: ore.toFixed(2), descrizione
    }]);
  }

  if (result.error) {
    alert("Errore salvataggio sigla: " + result.error.message);
  } else {
    document.getElementById('formNuovaSigla').reset();
    document.getElementById('editSiglaId').value = '';
    document.getElementById('btnSalvaSigla').innerText = '+ Aggiungi';
    await caricaModalSigle();

    const vistaOSS = document.getElementById('vista-turni-oss');
    if (vistaOSS && !vistaOSS.classList.contains('hidden')) caricaTabellaTurniSpecifica('OSS');
    else caricaTabellaTurniSpecifica('Infermiere');
  }
}

async function eliminaSigla(id, nomeSigla) {
  if (!confirm(`Sei sicuro di voler eliminare la sigla "${nomeSigla}"?`)) return;
  const { error } = await supabaseClient.from('sigle_turni').delete().eq('id', id);
  if (!error) {
    await caricaModalSigle();
    const vistaOSS = document.getElementById('vista-turni-oss');
    if (vistaOSS && !vistaOSS.classList.contains('hidden')) caricaTabellaTurniSpecifica('OSS');
    else caricaTabellaTurniSpecifica('Infermiere');
  }
}

// ==========================================
// MODULO INTELLIGENZA ARTIFICIALE (IA) & ECCEZIONI
// ==========================================

function apriModalEccezioniIA(categoria) {
  window.categoriaCorrenteIA = categoria;
  eccezioniIA = [];
  aggiornaListaEccezioniHTML();
  
  supabaseClient.from('utenti').select('*').eq('categoria', categoria).eq('attivo', true).order('cognome').then(({ data: utenti }) => {
    const sel = document.getElementById('iaEccezioneUtente');
    if (sel && utenti) {
      sel.innerHTML = utenti.map(u => `<option value="${u.id}">${u.cognome} ${u.nome}</option>`).join('');
    }
  });

  document.getElementById('modalEccezioniIA').classList.remove('hidden');
}

function chiudiModalEccezioniIA() {
  document.getElementById('modalEccezioniIA').classList.add('hidden');
}

function cambiaTipoVincoloIA(tipo) {
  const boxGiorno = document.getElementById('boxGiornoVincolo');
  if (tipo === 'solo_turno' || tipo === 'no_turno' || tipo === 'solo_weekend' || tipo === 'no_weekend') {
    boxGiorno.style.display = 'none';
  } else {
    boxGiorno.style.display = 'block';
  }
}

function vincolaListaIA() {
  const utenteId = document.getElementById('iaEccezioneUtente').value;
  const utenteText = document.getElementById('iaEccezioneUtente').selectedOptions[0].text;
  const tipoVincolo = document.getElementById('iaTipoVincolo').value;
  const giorno = document.getElementById('iaEccezioneGiorno').value;
  const sigla = document.getElementById('iaEccezioneSigla').value;

  if (tipoVincolo === 'puntuale' && !giorno) {
    alert("Inserisci il giorno del mese per l'eccezione puntuale.");
    return;
  }

  let descrizioneText = '';
  if (tipoVincolo === 'puntuale') descrizioneText = `Giorno ${giorno}: ${sigla}`;
  else if (tipoVincolo === 'solo_turno') descrizioneText = `SOLO turno ${sigla}`;
  else if (tipoVincolo === 'no_turno') descrizioneText = `NON può fare ${sigla}`;
  else if (tipoVincolo === 'solo_weekend') descrizioneText = `Lavora SOLO nei weekend`;
  else if (tipoVincolo === 'no_weekend') descrizioneText = `Escluso dai weekend`;

  eccezioniIA.push({
    utenteId,
    utenteText,
    tipoVincolo,
    giorno: giorno ? parseInt(giorno) : null,
    sigla,
    descrizioneText
  });

  aggiornaListaEccezioniHTML();
}

function aggiornaListaEccezioniHTML() {
  const container = document.getElementById('listaEccezioniContainer');
  if (!container) return;

  if (eccezioniIA.length === 0) {
    container.innerHTML = `<span class="text-gray-400 italic text-[11px]">Nessuna regola aggiunta.</span>`;
    return;
  }

  container.innerHTML = eccezioniIA.map((exc, idx) => `
    <div class="flex justify-between items-center bg-gray-50 p-1.5 border rounded">
      <span><b>${exc.utenteText}</b>: <span class="text-purple-700 font-bold">${exc.descrizioneText}</span></span>
      <button onclick="rimuoviVincolo(${idx})" class="text-red-600 font-bold text-xs hover:underline">Rimuovi</button>
    </div>
  `).join('');
}

function rimuoviVincolo(idx) {
  eccezioniIA.splice(idx, 1);
  aggiornaListaEccezioniHTML();
}

async function avviaGenerazioneIAEsecuzione() {
  const categoria = window.categoriaCorrenteIA;
  
  const targetMattina = parseInt(document.getElementById('iaNumMattina').value) || 2;
  const targetPomeriggio = parseInt(document.getElementById('iaNumPomeriggio').value) || 2;
  const targetNotte = parseInt(document.getElementById('iaNumNotte').value) || 1;

  chiudiModalEccezioniIA();

  const meseAnno = document.getElementById(`turniMeseAnno-${categoria}`).value;
  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorni = new Date(anno, mese, 0).getDate();

  await caricaSigleTurni();

  const { data: utenti } = await supabaseClient.from('utenti').select('*').eq('categoria', categoria).eq('attivo', true).order('cognome');
  if (!utenti || utenti.length === 0) {
    alert("Nessun utente attivo trovato per questa categoria.");
    return;
  }

  matriceTurni = {};
  matriceOre = {};
  await caricaEApplicaAssenzeSpecifica(meseAnno, categoria);

  for (let g = 1; g <= numGiorni; g++) {
    const dataGiorno = new Date(anno, mese - 1, g);
    const giornoSett = dataGiorno.getDay();
    const isWeekend = (giornoSett === 0 || giornoSett === 6);

    let assegnatiOggi = new Set();

    utenti.forEach(u => {
      const chiave = `${u.id}_${g}`;
      if (matriceTurni[chiave]) {
        assegnatiOggi.add(u.id);
      }
    });

    eccezioniIA.filter(e => e.tipoVincolo === 'puntuale' && e.giorno === g).forEach(exc => {
      const chiave = `${exc.utenteId}_${g}`;
      const sigla = exc.sigla === 'RIP' ? '' : exc.sigla;
      matriceTurni[chiave] = sigla;
      matriceOre[chiave] = (sigla && sigleMappa[sigla]) ? parseFloat(sigleMappa[sigla].ore_totali || 6) : 0;
      assegnatiOggi.add(exc.utenteId);
    });

    let disponibiliOggi = utenti.filter(u => !assegnatiOggi.has(u.id));

    let disponibiliNotte = disponibiliOggi.filter(u => {
      const vNo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'no_turno' && e.sigla === 'N');
      const vSolo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'solo_turno');
      if (vNo) return false;
      if (vSolo && vSolo.sigla !== 'N') return false;
      return true;
    });

    let disponibiliPomeriggio = disponibiliOggi.filter(u => {
      const vNo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'no_turno' && e.sigla === 'P');
      const vSolo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'solo_turno');
      if (vNo) return false;
      if (vSolo && vSolo.sigla !== 'P') return false;
      return true;
    });

    let disponibiliMattina = disponibiliOggi.filter(u => {
      const vNo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'no_turno' && e.sigla === 'M');
      const vSolo = eccezioniIA.find(e => e.utenteId === u.id && e.tipoVincolo === 'solo_turno');
      if (vNo) return false;
      if (vSolo && vSolo.sigla !== 'M') return false;
      return true;
    });

    if (isWeekend) {
      disponibiliMattina = disponibiliMattina.filter(u => !eccezioniIA.some(e => e.utenteId === u.id && e.tipoVincolo === 'no_weekend'));
      disponibiliPomeriggio = disponibiliPomeriggio.filter(u => !eccezioniIA.some(e => e.utenteId === u.id && e.tipoVincolo === 'no_weekend'));
      disponibiliNotte = disponibiliNotte.filter(u => !eccezioniIA.some(e => e.utenteId === u.id && e.tipoVincolo === 'no_weekend'));
    } else {
      const esclusiFeriali = eccezioniIA.filter(e => e.tipoVincolo === 'solo_weekend').map(e => e.utenteId);
      disponibiliMattina = disponibiliMattina.filter(u => !esclusiFeriali.includes(u.id));
      disponibiliPomeriggio = disponibiliPomeriggio.filter(u => !esclusiFeriali.includes(u.id));
      disponibiliNotte = disponibiliNotte.filter(u => !esclusiFeriali.includes(u.id));
    }

    const assegnaTurnoDaLista = (siglaTurno, quantita, listaDisponibili) => {
      for (let i = 0; i < quantita && listaDisponibili.length > 0; i++) {
        const indiceRandom = Math.floor(Math.random() * listaDisponibili.length);
        const operatore = listaDisponibili.splice(indiceRandom, 1)[0];

        const chiave = `${operatore.id}_${g}`;
        matriceTurni[chiave] = siglaTurno;
        matriceOre[chiave] = sigleMappa[siglaTurno] ? parseFloat(sigleMappa[siglaTurno].ore_totali || 6) : 6;
        
        disponibiliOggi = disponibiliOggi.filter(x => x.id !== operatore.id);
      }
    };

    assegnaTurnoDaLista('N', targetNotte, disponibiliNotte);
    assegnaTurnoDaLista('P', targetPomeriggio, disponibiliPomeriggio);
    assegnaTurnoDaLista('M', targetMattina, disponibiliMattina);

    disponibiliOggi.forEach(u => {
      const chiave = `${u.id}_${g}`;
      if (!matriceTurni[chiave]) {
        matriceTurni[chiave] = '';
        matriceOre[chiave] = 0;
      }
    });
  }

  costruisciCalendarioHTMLSpecifica(meseAnno, utenti, categoria);

  const btnManuale = document.getElementById(`btnSalvaTurni-${categoria}`);
  const btnIA = document.getElementById(`btnSalvaIA-${categoria}`);
  if (btnManuale) btnManuale.classList.add('hidden');
  if (btnIA) btnIA.classList.remove('hidden');

  alert(`🤖 Intelligenza Artificiale: Tabellone ${categoria} generato con successo tenendo conto di assenze e vincoli operatore!\nVerifica e clicca su "Salva Turni IA" per confermare.`);
}

// ==========================================
// MODULO RIEPILOGO ORE MENSILI INDIVIDUALE
// ==========================================

let utenteSelezionatoOreId = null;

async function apriModalRiepilogoOre(idUtente) {
  utenteSelezionatoOreId = idUtente;
  
  const inputMese = document.getElementById('inputMeseResocontoOre');
  if (inputMese && !inputMese.value) {
    const oggi = new Date();
    const mese = String(oggi.getMonth() + 1).padStart(2, '0');
    inputMese.value = `${oggi.getFullYear()}-${mese}`;
  }

  document.getElementById('modalRiepilogoOre').classList.remove('hidden');
  await generaResocontoOreIndividuo();
}

function chiudiModalRiepilogoOre() {
  document.getElementById('modalRiepilogoOre').classList.add('hidden');
  utenteSelezionatoOreId = null;
}

async function generaResocontoOreIndividuo() {
  if (!utenteSelezionatoOreId) return;

  const meseAnno = document.getElementById('inputMeseResocontoOre').value;
  if (!meseAnno) return;

  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorni = new Date(anno, mese, 0).getDate();

  const { data: u } = await supabaseClient.from('utenti').select('*').eq('id', utenteSelezionatoOreId).single();
  if (!u) return;

  document.getElementById('titoloPeriodoResoconto').innerText = `Periodo: ${meseAnno} (Categoria: ${u.categoria})`;
  document.getElementById('infoAnagraficaResoconto').innerHTML = `
    <div><b>Dipendente:</b> ${u.cognome} ${u.nome}</div>
    <div><b>Codice Fiscale:</b> ${u.codice_fiscale || '-'}</div>
    <div><b>Categoria:</b> ${u.categoria}</div>
    <div><b>Profilo Sicurezza:</b> ${u.antincendio ? 'Abilitato Antincendio 🔥' : 'Standard'}</div>
  `;

  await caricaSigleTurni();

  const { data: turniUtente } = await supabaseClient
    .from('turni_mensili')
    .select('*')
    .eq('mese_anno', meseAnno)
    .eq('utente_id', utenteSelezionatoOreId);

  const mappaTurniIndividuo = {};
  const mappaOreIndividuo = {};
  (turniUtente || []).forEach(t => {
    mappaTurniIndividuo[t.giorno] = t.sigla;
    mappaOreIndividuo[t.giorno] = parseFloat(t.ore_effettive || 0);
  });

  const nomiGiorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  let tbodyHtml = '';
  let totaleOreMese = 0;

  for (let g = 1; g <= numGiorni; g++) {
    const dataGiorno = new Date(anno, mese - 1, g);
    const nomeGiornoSett = nomiGiorni[dataGiorno.getDay()];
    const sigla = mappaTurniIndividuo[g] || '-';
    const ore = mappaOreIndividuo[g] || 0;

    totaleOreMese += ore;

    const isAssenza = ['F', 'MAL', 'X'].includes(sigla);
    const stileSigla = isAssenza ? 'text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded' : 'font-bold text-blue-900';

    tbodyHtml += `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-2 text-gray-600 font-semibold">${nomeGiornoSett}</td>
        <td class="p-2">${g}/${mese}/${anno}</td>
        <td class="p-2"><span class="${stileSigla}">${sigla}</span></td>
        <td class="p-2 text-right font-mono font-bold">${ore > 0 ? ore.toFixed(1) + 'h' : '-'}</td>
      </tr>
    `;
  }

  document.getElementById('tabellaDettaglioOreIndividuo').innerHTML = tbodyHtml;
  document.getElementById('totaleOreResocontoIndividuo').innerText = `${totaleOreMese.toFixed(1)}h`;
}

function stampaResocontoOreA4() {
  const contenutoHtml = document.getElementById('areaStampaResocontoOre').innerHTML;

  const finestraStampa = window.open('', '', 'width=900,height=1100');
  finestraStampa.document.write(`
    <html>
      <head>
        <title>Resoconto Ore - Villa Olimpia</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: sans-serif;
            -webkit-print-color-adjust: exact;
            background-color: white;
          }
        </style>
      </head>
      <body class="p-4 bg-white">
        ${contenutoHtml}
      </body>
    </html>
  `);
  finestraStampa.document.close();
  setTimeout(() => {
    finestraStampa.focus();
    finestraStampa.print();
  }, 500);
}

// ==========================================
// STAMPA A3 (A DUE BLOCCHI: 1-15 e 16-FINE)
// ==========================================

function stampaTurniA3(categoria) {
  const meseAnno = document.getElementById(`turniMeseAnno-${categoria}`).value;
  const [anno, mese] = meseAnno.split('-').map(Number);
  const numGiorni = new Date(anno, mese, 0).getDate();

  supabaseClient.from('utenti').select('*').eq('categoria', categoria).eq('attivo', true).order('cognome').then(({ data: utenti }) => {
    if (!utenti) return;

    const generaTabellaBlocco = (giornoInizio, giornoFine) => {
      let trGiornoSett = `<tr class="bg-blue-950 text-[11px] text-blue-200"><th class="p-2 border-r text-left w-64">Lavoratore (${categoria})</th>`;
      let trGiornoNum = `<tr><th class="p-2 border-r text-left text-xs font-bold w-64">Periodo: ${giornoInizio} - ${giornoFine} (${meseAnno})</th>`;

      const nomiGiorni = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];

      for (let g = giornoInizio; g <= giornoFine; g++) {
        const dataGiorno = new Date(anno, mese - 1, g);
        const giornoSett = dataGiorno.getDay();
        const mmGiorno = String(mese).padStart(2, '0') + '-' + String(g).padStart(2, '0');

        const isDomenica = giornoSett === 0;
        const isSabato = giornoSett === 6;
        const isSuperFestivo = FESTIVITA_NAZIONALI.includes(mmGiorno);

        let bgHeader = 'bg-blue-900';
        if (isSuperFestivo) bgHeader = 'bg-red-700 text-white font-extrabold';
        else if (isDomenica) bgHeader = 'bg-red-600 text-white font-bold';
        else if (isSabato) bgHeader = 'bg-amber-600 text-white';

        trGiornoSett += `<th class="p-1 border-r text-[10px] ${bgHeader} w-8">${nomiGiorni[giornoSett]}</th>`;
        trGiornoNum += `<th class="p-1 border-r text-xs ${bgHeader} w-8">${g}</th>`;
      }

      trGiornoSett += '<th class="p-2 w-16 bg-blue-950 text-white">TOT</th></tr>';
      trGiornoNum += '<th class="p-2 w-16 bg-blue-950 text-white">ORE</th></tr>';

      let bodyHtml = '';
      const totaleOreGiornaliere = Array(giornoFine + 1).fill(0);
      const presenzaAntincendioGiornaliera = Array(giornoFine + 1).fill(false);

      utenti.forEach(u => {
        const iconaAntincendio = u.antincendio ? `<span class="ml-1 text-red-600 font-bold">🔥</span>` : '';
        let rigaHtml = `<tr class="border-b"><td class="p-2 font-bold text-left border-r text-blue-950 bg-gray-50">${u.cognome} ${u.nome} ${iconaAntincendio}</td>`;
        let totOreParziale = 0;

        for (let g = giornoInizio; g <= giornoFine; g++) {
          const chiave = `${u.id}_${g}`;
          const sigla = matriceTurni[chiave] || '';
          const ore = matriceOre[chiave] || 0;

          totOreParziale += ore;
          totaleOreGiornaliere[g] += ore;

          if (u.antincendio && sigla && !['F', 'MAL', 'X'].includes(sigla)) {
            presenzaAntincendioGiornaliera[g] = true;
          }

          const isAssenza = ['F', 'MAL', 'X'].includes(sigla);
          const stileCella = isAssenza ? 'font-extrabold text-red-600 bg-red-50' : 'font-bold';
          rigaHtml += `<td class="p-1 border-r text-center text-xs ${stileCella}">${sigla}</td>`;
        }

        rigaHtml += `<td class="p-2 border-l bg-blue-50 font-extrabold text-blue-900 text-center text-xs">${totOreParziale.toFixed(1)}h</td></tr>`;
        bodyHtml += rigaHtml;
      });

      let footHtml = `<tr><td class="p-2 border-r text-left text-xs uppercase font-extrabold">Totale Giorno</td>`;
      for (let g = giornoInizio; g <= giornoFine; g++) {
        const fiammella = presenzaAntincendioGiornaliera[g] ? `<div class="text-red-500 text-[10px] font-bold">🔥</div>` : '';
        footHtml += `<td class="p-1 border-r text-[9px] text-center font-bold"><div>${totaleOreGiornaliere[g].toFixed(1)}</div>${fiammella}</td>`;
      }
      footHtml += `<td class="p-2 bg-red-600 text-white font-extrabold text-center text-xs">---</td></tr>`;

      return `
        <table class="w-full text-center border-collapse text-xs mb-6">
          <thead class="bg-blue-900 text-white">${trGiornoSett + trGiornoNum}</thead>
          <tbody class="divide-y">${bodyHtml}</tbody>
          <tfoot class="bg-blue-950 text-white font-bold">${footHtml}</tfoot>
        </table>
      `;
    };

    const tabellaParte1 = generaTabellaBlocco(1, 15);
    const tabellaParte2 = generaTabellaBlocco(16, numGiorni);

    const finestraStampa = window.open('', '', 'width=1400,height=900');
    finestraStampa.document.write(`
      <html>
        <head>
          <title>Turnazione ${categoria} - Villa Olimpia (${meseAnno})</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A3 landscape;
              margin: 10mm;
            }
            body {
              font-family: sans-serif;
              -webkit-print-color-adjust: exact;
              background-color: white;
            }
          </style>
        </head>
        <body class="p-4 bg-white">
          <div class="text-center mb-4">
            <h1 class="text-2xl font-extrabold text-blue-900">Villa Olimpia</h1>
            <p class="text-xs font-bold uppercase text-gray-600">Tabella Turni ${categoria} - Mese: ${meseAnno}</p>
          </div>
          ${tabellaParte1}
          ${tabellaParte2}
        </body>
      </html>
    `);
    finestraStampa.document.close();
    setTimeout(() => {
      finestraStampa.focus();
      finestraStampa.print();
    }, 600);
  });
}