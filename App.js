import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { createClient } from '@supabase/supabase-js';

// --- REMPLACE AVEC TES CLIENTS SUPABASE ---
const SUPABASE_URL = "https://wlahgxhxfrhharfolavf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYWhneGh4ZnJoaGFyZm9sYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjYwNzMsImV4cCI6MjA5OTEwMjA3M30.wAc85VH6q-ruUfq2thpGFSgFlPn5vkXnPp5LYG7Ed7s";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [recherche, setRecherche] = useState('');
  const [tousLesMorceaux, setTousLesMorceaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [sonActuel, setSonActuel] = useState(null);
  const [estEnTrainDeJouer, setEstEnTrainDeJouer] = useState(false);

  useEffect(() => {
    // Force l'audio à passer outre le mode silencieux de l'iPhone
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true, // optionnel: permet de continuer la musique si tu changes d'application
    }).catch(err => console.log("Erreur config audio:", err));

    recupererMusiques();
  }, []);
  
  async function recupererMusiques() {
    let { data, error } = await supabase.from('morceaux').select('*');
    if (error) console.log('Erreur Supabase:', error);
    else setTousLesMorceaux(data || []);
    setChargement(false);
  }

  async function gererLecture(url) {
    try {
      if (sonActuel) {
        await sonActuel.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSonActuel(sound);
      setEstEnTrainDeJouer(true);
    } catch (e) {
      console.log("Erreur de lecture audio :", e);
    }
  }

  const musiquesFiltrees = tousLesMorceaux.filter(m =>
    (m.titre && m.titre.toLowerCase().includes(recherche.toLowerCase())) ||
    (m.artiste && m.artiste.toLowerCase().includes(recherche.toLowerCase()))
  );

  if (chargement) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titreApp}>Sonara</Text>

      <TextInput
        style={styles.barreRecherche}
        placeholder="Rechercher un titre, un artiste..."
        placeholderTextColor="#aaa"
        value={recherche}
        onChangeText={setRecherche}
      />

      <FlatList
        data={musiquesFiltrees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.carteMusique} onPress={() => gererLecture(item.url_audio)}>
            <View style={styles.iconPlay}><Text style={{color: '#fff'}}>▶</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.nomMusique}>{item.titre}</Text>
              <Text style={styles.nomArtiste}>{item.artiste}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {estEnTrainDeJouer && (
        <View style={styles.lecteurMini}>
          <Text style={styles.texteLecteur}>Lecture en cours...</Text>
          <TouchableOpacity onPress={async () => { await sonActuel.pauseAsync(); setEstEnTrainDeJouer(false); }}>
            <Text style={{color: '#1DB954', fontWeight: 'bold'}}>PAUSE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  titreApp: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  barreRecherche: { backgroundColor: '#242424', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  carteMusique: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#1e1e1e', borderRadius: 8 },
  iconPlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nomMusique: { color: '#fff', fontSize: 16, fontWeight: '600' },
  nomArtiste: { color: '#b3b3b3', fontSize: 14 },
  lecteurMini: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#282828', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1DB954' },
  texteLecteur: { color: '#fff' }
});