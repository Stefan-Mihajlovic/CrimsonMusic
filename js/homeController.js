import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-analytics.js";
import { } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js';
import { getDatabase, ref, set, child, get, update, remove } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js';
import { getAuth, signInWithRedirect, getRedirectResult , GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js';

// Firebase Config with all IDs
const firebaseConfig = {
    apiKey: "AIzaSyBtHlJGvOX-dNiyWWUUzheaSl21fD3-WBA",
    authDomain: "crimsonmusic-b97d9.firebaseapp.com",
    projectId: "crimsonmusic-b97d9",
    storageBucket: "crimsonmusic-b97d9.appspot.com",
    messagingSenderId: "181983859666",
    appId: "1:181983859666:web:9afcaab406d031dd092e0b",
    measurementId: "G-V7HPY7PHBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider(app);
const auth = getAuth(app);

const realdb = getDatabase();

/* ----- Register User ----- */

const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

let accountNames = document.getElementsByName('accountName');
let accountEmails = document.getElementsByName('accountEmail');
let accountUsername;
let accountEmail;
let accountPhoto;

let loggedIn = false;

let currentUser;

function isEmptyOrSpaces(str){
    return str == null || str.match(/^ *$/) !== null;
}

function Validation(){
    let emailregex = /^[a-zA-Z0-9]+@(gmail|yahoo|outlook)\.com$/;
    let userregex = /^[a-zA-Z0-9]{5,}$/;

    if(isEmptyOrSpaces(username.value) || isEmptyOrSpaces(email.value) ||
    isEmptyOrSpaces(password.value)){
        alert('Some fields are empty!');
        return false;
    }

    if(!emailregex.test(email.value)){
        alert('Email is not valid!');
        return false;
    }

    if(!userregex.test(username.value)){
        alert('Username is not valid and\nhas to have more than 5 characters!');
        return false;
    }

    return true;
}

// Register the user
function RegisterUser(){
    if(!Validation()){
        return;
    }
    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+username.value)).then((snapshot)=>{
        if(snapshot.exists()){
            alert('Account already exists!');
        }
        else{
            set(ref(realdb, "Users/"+username.value),
            {
                Username: username.value,
                Email: email.value,
                Password: encPass()
            })
            .then(()=>{
                alert('User registered successfuly!');

            })
            .catch((error)=>{
                alert("error "+error);
            })
        }
    })
}

// Encrypt the password using AES

function encPass(){
    let pass12 = CryptoJS.AES.encrypt(password.value, password.value);
    return pass12.toString();
}

// Call the register user on click
registerBtn.addEventListener('click', RegisterUser);
loginBtn.addEventListener('click', AuthenticateUser);

/* ----- Login User ----- */

function AuthenticateUser(){
    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+username.value)).then((snapshot)=>{
        if(snapshot.exists()){
            let dbpass = decPass(snapshot.val().Password);
            if(dbpass == password.value){
                loginUser(snapshot.val());
            }
        }else{
            alert("Account not found!");
        }
    })
}

// Dekriptuj sifru

function decPass(dbpass){
    var pass12 = CryptoJS.AES.decrypt(dbpass, password.value);
    return pass12.toString(CryptoJS.enc.Utf8);
}

// Login user

function loginUser(user){
    localStorage.setItem('keepLoggedIn', 'yes');
    localStorage.setItem('user', JSON.stringify(user));
    getUsername();
    accountUsername = currentUser.Username;
    accountEmail = currentUser.Email;
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
    setLoggedInScreen();
}

function getUsername(){
    let keepLoggedIn = localStorage.getItem('keepLoggedIn');

    if(keepLoggedIn === 'yes'){
        currentUser = JSON.parse(localStorage.getItem('user'));
    }
}

function SignOutUser(){
    localStorage.removeItem('user');
    localStorage.removeItem('keepLoggedIn');
    accountUsername ="Guest";
    accountEmail ="";
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
    setLoggedOutScreen();
}

let logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', ()=>{
    signOut(auth).then(() => {
        SignOutUser();
    }).catch((error) => {
        // An error happened.
    });
})

getUsername();

// See if user was signed in
if(currentUser == null){
    setLoggedOutScreen();
}
else{
    setLoggedInScreen();
    accountUsername = currentUser.Username;
    accountEmail = currentUser.Email;
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
}

// Generate a song based on the input number ( SongID )

let brojPesama = 18;
let brojArtista = 9;
let brojPlejlista = 2;

let songToBePlayed,songTitle,songCreator,imageURL;

let recSongs = document.getElementById("recSongs");

function GenerateOneSong(songName){
    var name = songName;

    var dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            songCreator = snapshot.val().Creator;
            imageURL = snapshot.val().ImgURL;
            let currentLI =  `<li class="songItem" onclick="clickEffect(this)">
                <div class="songInfo">
                    <img src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Home');"></div>
                <div class="songBtns">
                    <button onclick="clickEffect(this)"><i class="fa-regular fa-heart"></i></button>
                    <button onclick="clickEffect(this)"><i class="fa-solid fa-bars"></i></button>
                </div>
                </li>`;
            recSongs.innerHTML += currentLI;
        }
    })
}

let niz = [];

function generateSongs(){

    let randomList = [];

    for (let i = 0; i < 5; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojPesama) + 1;
            if(!randomList.includes(g)){
                GenerateOneSong(g);
                randomList.push(g);
                break;
            }
        }
    }
}

/* ----- GENERATE ARTISTS ----- */
let artistImage;
let recArtists = document.getElementsByClassName("recArtists")[0];

function GetArtists(artistName){
    var name = artistName;

    var dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            artistImage = snapshot.val().ImageURL;
            let currentImg =  `<li class="artistItem" onclick="openArtistPage(`+ name +`); clickEffect(this);">
            <img src="`+ artistImage +`" alt="artistImage">
            <h3>`+ artistName +`</h3>
            </li>`;
            recArtists.innerHTML += currentImg;
        }
    })
}

function generateArtists(){

    let randomList = [];

    for (let i = 0; i < 7; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojArtista) + 1;
            if(!randomList.includes(g)){
                GetArtists(g);
                randomList.push(g);
                break;
            }
        }
    }
}

/* ----- GENERATE PLAYLISTS ----- */
let playlistBanner,playlistLikes,playlistSongs,playlistArtists;
let recPlaylists = document.getElementsByClassName("recPlaylists")[0];

function GetPlaylists(playlistName){
    var name = playlistName;

    var dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            playlistBanner = snapshot.val().Banner;
            playlistLikes = snapshot.val().Likes;
            playlistSongs = snapshot.val().Songs;
            playlistArtists = snapshot.val().Artists;
            let currentLi =  `<li class="playlistItem" onclick="clickEffect(this)">
            <img src="`+ playlistBanner +`" alt="playlistBanner">
            <h3>`+ playlistName +`</h3>
            <h5>`+ playlistArtists +`</h5>
            </li>`;
            recPlaylists.innerHTML += currentLi;
        }
    })
}

function generatePlaylists(){

    let randomList = [];

    for (let i = 0; i < 2; i++) {
        while(true){
            let g = Math.floor(Math.random() * brojPlejlista) + 1;
            if(!randomList.includes(g)){
                GetPlaylists(g);
                randomList.push(g);
                break;
            }
        }
    }
}

generateSongs();
generateArtists();
generatePlaylists();

// ----- SEARCH

let searchList = document.getElementsByClassName("searchList")[0];

let searchBtn = document.getElementById("submitSearch");
searchBtn.addEventListener('click', () => {
    
    let searchInput = document.getElementById("searchInput");
    let searchedText = searchInput.value;
    let searchedTextLower = searchedText.toLowerCase();

    let isAllCh = document.getElementById("allInput").checked;
    let isSongsCh = document.getElementById("songsInput").checked;
    let isArtistsCh = document.getElementById("artistsInput").checked;
    let isPlaylistsCh = document.getElementById("playlistsInput").checked;
    let isProfilesCh = document.getElementById("profilesInput").checked;

    searchList.innerHTML = "";
    searchList.classList.add("searchListOpen");

    if(searchedTextLower !== ""){
        if(isAllCh){
            for (let i = 1; i <= brojPesama; i++) {
                findSearchedSong(i,searchedTextLower);
            }
        
            for (let i = 1; i <= brojArtista; i++) {
                findSearchedArtist(i,searchedTextLower);
            }
    
            for (let i = 1; i <= brojPlejlista; i++) {
                findSearchedPlaylist(i,searchedTextLower);
            }
        }else{
            if(isSongsCh){
                for (let i = 1; i <= brojPesama; i++) {
                    findSearchedSong(i,searchedTextLower);
                }
            }
            if(isArtistsCh){
                for (let i = 1; i <= brojArtista; i++) {
                    findSearchedArtist(i,searchedTextLower);
                }
            }
            if(isPlaylistsCh){
                for (let i = 1; i <= brojPlejlista; i++) {
                    findSearchedPlaylist(i,searchedTextLower);
                }
            }
        }
    }else{
        searchList.classList.remove("searchListOpen");
    }
});

function findSearchedSong(songName, inputText){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songTitle  = snapshot.val().SongName;
            if(songTitle.toLowerCase().includes(inputText)){
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem songItemSearch" onclick="clickEffect(this)">
                    <div class="songInfo">
                        <img src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Search');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this)"><i class="fa-regular fa-heart"></i></button>
                        <button onclick="clickEffect(this)"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                searchList.innerHTML += currentLI;
            }
        }
    })
}

function findSearchedArtist(artistName, inputText){
    var name = artistName;

    var dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            if(artistName.toLowerCase().includes(inputText)){
                artistImage = snapshot.val().ImageURL;
                let currentLi = `<li class="artistItemSearch" onclick="openArtistPage(`+ name +`); clickEffect(this);">
                                    <div>
                                        <img src="`+ artistImage +`" alt="artistImage">
                                        <h3>`+ artistName +`</h3>
                                    </div>
                                    <i class="fa-solid fa-circle-right"></i>
                                </li>`;
                searchList.innerHTML += currentLi;
            }
        }
    })
}

function findSearchedPlaylist(playlistName, inputText){
    var name = playlistName;

    var dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            if(playlistName.toLowerCase().includes(inputText)){
                playlistBanner = snapshot.val().Banner;
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItemSearch" onclick="clickEffect(this)">
                    <div class="playlistItemHolder">
                        <img src="`+ playlistBanner +`" alt="playlistBanner">
                        <div>
                            <h3>`+ playlistName +`</h3>
                            <h5>`+ playlistArtists +`</h5>
                        </div>
                    </div>
                    <i class="fa-solid fa-circle-right"></i>
                </li>`;
                searchList.innerHTML += currentLi;
            }
        }
    })
}
