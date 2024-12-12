// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import { AppBar, Toolbar, Typography, Button, Container, Grid, Paper, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Drawer, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { saveAs } from 'file-saver'; // Import FileSaver
import './App.css';

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [musicList, setMusicList] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [code, setCode] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        const CLIENT_ID = '6ae37025d6e6488dbd0239a9efe39d18'; // Replace with your Spotify Client ID
        const CLIENT_SECRET = '813b6579007442d9940bc2b03753931a'; // Replace with your Spotify Client Secret

        // Get access token
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
            },
            params: {
                grant_type: 'client_credentials'
            }
        });

        const token = tokenResponse.data.access_token;

        // Search for tracks
        const url = `https://api.spotify.com/v1/search?q=${searchTerm}&type=track`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const tracks = response.data.tracks.items.map(item => ({
                title: item.name,
                artist: item.artists[0].name,
                album: item.album.name,
                image: item.album.images[1].url, // Get the medium image
                id: item.id, // Get the track ID
                duration: (item.duration_ms / 1000).toFixed(0) // Convert duration to seconds
            }));
            setSuggestions(tracks);
        } catch (error) {
            console.error('Error fetching data from Spotify API', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (music) => {
        setMusicList(prevList => [...prevList, music]);
        setSearchTerm('');
        setSuggestions([]);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCodeChange = (e) => {
        setCode(e.target.value);
        if (e.target.value === '141108') {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    const handleDelete = (index) => {
        setMusicList(prevList => prevList.filter((_, i) => i !== index));
    };

    const savePlaylistToFile = () => {
        const playlistData = {
            name: "Student Playlist",
            description: "A playlist created by students.",
            tracks: musicList.map(music => ({
                title: music.title,
                artist: music.artist,
                album: music.album,
                id: music.id // Include the track ID for later use
            }))
        };

        const blob = new Blob([JSON.stringify(playlistData, null, 2)], { type: 'application/json' });
        saveAs(blob, 'playlist.json'); // Save the file
    };

    return (
        <div className="App">
            <AppBar position="static" style={{ backgroundColor: '#6200ea', borderRadius: '0 0 10px 10px' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6">Music Listing App</Typography>
                    {isAdmin && (
                        <Button onClick={savePlaylistToFile} color="inherit">Save Playlist</Button>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={sidebarOpen} onClose={toggleSidebar}>
                <div style={{ width: 250, padding: '16px' }}>
                    <Typography variant="h6">Admin Control</Typography>
                    <TextField
                        label="Enter Code"
                        variant="outlined"
                        value={code}
                        onChange={handleCodeChange}
                        fullWidth
                        margin="normal"
                    />
                </div>
            </Drawer>
            <Container style={{ marginTop: '20px' }}>
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Search for music..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleSearch(); // Fetch suggestions on input change
                                }}
                                style={{ 
                                    width: '100%', 
                                    padding: '20px', 
                                    borderRadius: '5px', 
                                    border: '1px solid #ccc', 
                                    marginBottom: '10px' 
                                }}
                            />
                            <Button onClick={() => handleSelect(suggestions[0])} disabled={loading || suggestions.length === 0} variant="contained" color="primary">
                                Add
                            </Button>
                            {suggestions.length > 0 && (
                                <ul className="suggestions">
                                    {suggestions.map((music, index) => (
                                        <li key={index} onClick={() => handleSelect(music)} style={{ display: 'flex', alignItems: 'center', padding: '10px', cursor: 'pointer' }}>
                                            <Avatar src={music.image} alt={music.title} style={{ width: '50px', height: '50px', borderRadius: '10px', marginRight: '10px' }} />
                                            <div>
                                                <Typography variant="body1">{music.title}</Typography>
                                                <Typography variant="body2" color="textSecondary">{music.artist} | {music.album}</Typography>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="music-list">
                                <h2>Listed Music</h2>
                                {musicList.map((music, index) => (
                                    <Paper elevation={2} className="music-item" key={index}>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar src={music.image} alt={music.title} style={{ width: '80px', height: '80px', borderRadius: '10px' }} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={music.title}
                                                secondary={`Artist: ${music.artist} | Album: ${music.album}`}
                                            />
                                            <Typography variant="body2" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                                                {Math.floor(music.duration / 60)}:{(music.duration % 60).toString().padStart(2, '0')}
                                            </Typography>
                                            {isAdmin && (
                                                <Button onClick={() => handleDelete(index)} color="secondary" style={{ marginLeft: '10px' }}>
                                                    Delete
                                                </Button>
                                            )}
                                        </ListItem>
                                    </Paper>
                                ))}
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
}

export default App;