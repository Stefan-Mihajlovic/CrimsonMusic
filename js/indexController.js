import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-analytics.js";
import { } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-storage.js';
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
export let accountTheme = "Dark";

let loggedIn = false;

let currentUser;

function isEmptyOrSpaces(str){
    return str == null || str.match(/^ *$/) !== null;
}

function Validation(){
    let emailregex = /^[a-zA-Z0-9]+@(gmail|yahoo|outlook)\.com$/;
    let userregex = /^[a-zA-Z0-9]{4,}$/;

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
                Password: encPass(),
                Playlists: "",
                LikedSongs: "",
                AppTheme: "Dark"
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
                LoadUserPlaylists();
            }
        }else{
            alert("Account not found!");
        }
    })
}

// Dekriptuj sifru

function decPass(dbpass){
    let pass12 = CryptoJS.AES.decrypt(dbpass, password.value);
    return pass12.toString(CryptoJS.enc.Utf8);
}

// Login user

function loginUser(user){
    localStorage.setItem('keepLoggedIn', 'yes');
    localStorage.setItem('user', JSON.stringify(user));
    getUsername();
    accountUsername = user.Username;
    accountEmail = user.Email;
    accountNames.forEach((name) => {
        name.innerHTML = accountUsername;
    });
    accountEmails.forEach((email) => {
        email.innerHTML = accountEmail;
    });
    accountTheme = user.AppTheme;
    setLoggedInScreen();
    setAppTheme(accountTheme);
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
        DeLoadUserPlaylists();
    }).catch((error) => {
        // An error happened.
    });
})

// See if user was signed in
function seeIfUserIsSignedIn(){
    if(currentUser == null){
        setLoggedOutScreen();
    }
    else{
        loginUser(currentUser);
        LoadUserPlaylists();
    }
}

// Generate a song based on the input number ( SongID )

let songToBePlayed,songTitle,songCreator,imageURL;

let recSongs = document.getElementById("recSongs");

function GenerateOneSong(songName){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            songCreator = snapshot.val().Creator;
            imageURL = snapshot.val().ImgURL;
            let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Home',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
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
let artistImage,artistFollowers,artistListens,artistAboutImage;
let recArtists = document.getElementsByClassName("recArtists")[0];

function GetArtists(artistName){
    let name = artistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            artistImage = snapshot.val().ImageURL;
            artistFollowers = snapshot.val().Followers;
            artistListens = snapshot.val().Listens;
            artistAboutImage = snapshot.val().AboutBanner;
            let currentImg =  `<li id="song`+ name +`" class="artistItem" onclick="clickEffect(this); openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img loading="lazy" src="`+ artistImage +`" alt="artistImage">
            <h3>`+ artistName +`</h3>
            </li>`;
            recArtists.innerHTML += currentImg;
        }
    })
}

function generateArtists(){

console.log();

    let randomList = [];

    for (let i = 0; i < 10; i++) {
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
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            playlistBanner = snapshot.val().Banner;
            playlistLikes = snapshot.val().Likes;
            playlistSongs = snapshot.val().Songs;
            playlistArtists = snapshot.val().Artists;
            let currentLi =  `<li class="playlistItem" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
            <img loading="lazy" src="`+ playlistBanner +`" alt="playlistBanner">
            <h3>`+ playlistName +`</h3>
            <h5>`+ playlistArtists +`</h5>
            </li>`;
            recPlaylists.innerHTML += currentLi;
        }
    })
}

function generatePlaylists(){

    let randomList = [];

    for (let i = 0; i < 4; i++) {
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
            if(songTitle.toLowerCase().includes(inputText.toLowerCase())){
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem songItemSearch" onclick="clickEffect(this)">
                    <div class="songInfo">
                        <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                searchList.innerHTML += currentLI;
            }
        }
    })
}

function findSearchedArtist(artistName, inputText){
    let name = artistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            let artistTerms = snapshot.val().ArtistSearchTerms || "";
            if(artistName.toLowerCase().includes(inputText) || artistTerms.toLowerCase().includes(inputText)){
                artistImage = snapshot.val().ImageURL;
                let currentLi = `<li class="artistItemSearch" onclick="clickEffect(this); openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`'); clickEffect(this);">
                                    <div>
                                        <img loading="lazy" src="`+ artistImage +`" alt="artistImage">
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
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            if(playlistName.toLowerCase().includes(inputText.toLowerCase())){
                playlistBanner = snapshot.val().Banner;
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItemSearch" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div class="playlistItemHolder">
                        <img loading="lazy" src="`+ playlistBanner +`" alt="playlistBanner">
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

// ----- GENERATE CATEGORIES

let categoriesList = document.getElementsByClassName("categories")[0];

function generateCategories(){
    for (let i = 1; i < brojKategorija; i+=2) {
        GetCategories(i);
    }
}

function GetCategories(name){
    let catName,catName2,catColor,catColor2;
    let catBanner,catBanner2;
    let currentLi = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Categories/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            catName = snapshot.val().Name;
            catColor = snapshot.val().Color;
            catBanner = snapshot.val().Banner;

            currentLi += `<li class="catItems"><div class="catItem" onclick="clickEffect(this); openCategoryPage('`+ catName +`', '`+ catColor +`', '`+ catBanner +`')" style="background-color: `+ catColor +`">
            <h3>`+ catName +`</h3>
            </div>`;
        }
    })

    get(child(dbRef, "Categories/"+(name+1))).then((snapshot)=>{
        if(snapshot.exists()){
            catName2 = snapshot.val().Name;
            catColor2 = snapshot.val().Color;
            catBanner2 = snapshot.val().Banner;

            currentLi += `<div class="catItem" onclick="clickEffect(this); openCategoryPage('`+ catName2 +`', '`+ catColor2 +`', '`+ catBanner2 +`')" style="background-color: `+ catColor2 +`">
            <h3>`+ catName2 +`</h3>
            </div></li>`;

            categoriesList.innerHTML += currentLi;
        }
    })
}

// CATEGORY PAGE

let categoryPage = document.getElementsByClassName("categoryScreen")[0];
let categoryRecommendedPlaylistsList = document.getElementsByClassName("categoryRecommendedPlaylists")[0];
let categoryRecommendedSongsList = document.getElementsByClassName("categoryRecommendedSongs")[0];
let categoryAccentBubble = document.getElementsByClassName("categoryAccentBubble")[0];

let isCategoryPageOpen = false;

export function openCategoryPage(category, color, banner){

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    let catBanners = document.getElementsByName("catBanner");
    catBanners.forEach((cat) => {
        cat.src = banner;
    })

    if(!isCategoryPageOpen){
        categoryPage.classList.add("categoryPageOpen");
        categoryAccentBubble.style.backgroundImage = `radial-gradient(closest-side, `+ color +`, transparent)`;
        let categoryNames = document.getElementsByName("categoryName");
        categoryNames.forEach((name) => {
            name.innerHTML = category.toUpperCase();
        });

        categoryRecommendedPlaylistsList.innerHTML = "";
        for (let i = 1; i <= brojPlejlista; i++) {
            findPlaylistOfCategory(i, category);
        }

        categoryRecommendedSongsList.innerHTML = "";
        for (let i = 1; i <= brojPesama; i++) {
            findSongOfCategory(i, category);
        }

        isCategoryPageOpen = true;
    }else{
        isCategoryPageOpen = false;
    }
}

export function closeCategoryPage(){
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    categoryPage.classList.remove("categoryPageOpen");
    isCategoryPageOpen = false;
}

let closeCategoryPageBtn = document.getElementById("closeCategoryPage");
closeCategoryPageBtn.addEventListener('click', () => {
    closeCategoryPage();
});

function findPlaylistOfCategory(playlistName, inputText){
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistName = snapshot.val().Title;
            let playlistCategory = snapshot.val().Category;
            if(playlistCategory.toLowerCase().includes(inputText.toLowerCase())){
                playlistBanner = snapshot.val().Banner;
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItem" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img loading="lazy" src="`+ playlistBanner +`" alt="playlistBanner">
                <h3>`+ playlistName +`</h3>
                <h5>`+ playlistArtists +`</h5>
                </li>`;
                categoryRecommendedPlaylistsList.innerHTML += currentLi;
            }
        }
    })
}

let songCat = "";

function findSongOfCategory(songName, inputText){
    let name = songName;
    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCat  = snapshot.val().Categories;
            if(songCat === inputText){
                songTitle  = snapshot.val().SongName;
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                categoryRecommendedSongsList.innerHTML += currentLI;
            }
        }
    })
}

// ----- ARTIST PAGE SHANANIGANS

let latestReleaseLi = "";
let isArtistPageOpen = false;
let screenScrollables = document.getElementsByClassName("screenScrollable");

let closeArtistPageBtn = document.getElementById("closeArtistPage");
closeArtistPageBtn.addEventListener('click', ()=>{
    closeArtistPage();
})

export function closeArtistPage(){
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    let artistScreen = document.getElementsByClassName("artistScreen")[0];
    artistScreen.classList.remove("artistScreenOpen");
    isArtistPageOpen = false;
}

export function openArtistPage(artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage){

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    for (let i = 0; i < screenScrollables.length; i++) {
        screenScrollables[i].scrollTop = 0;
    }
    
    if(!isArtistPageOpen){
        let artistScreen = document.getElementsByClassName("artistScreen")[0];
        artistScreen.classList.add("artistScreenOpen");
        isArtistPageOpen = true;
    }

    let artistBanners = document.getElementsByName("artistBanner");
    let artistNames = document.getElementsByName("artistName");
    let artistFollowersSpans = document.getElementsByName("artistFollowers");

    artistBanners.forEach((banner) => {
        banner.src = artistImage;
    });

    artistNames.forEach((name) => {
        name.innerHTML = artistName;
    });

    artistFollowersSpans.forEach((followers) => {
        followers.innerHTML = artistFollowers;
    });

    SetTheLatestRelease(artistName);
    for (let i = 1; i <= brojPlejlista; i++) {
        GetPlaylistsArtistAppearsOn(i, artistName);
    }

    let randomList = [];
    for (let i = 0; i <= brojPesama; i++) {
        GenerateOneSongFromArtist(i, artistName);
    }

    if(artistAImage != undefined){
        document.getElementById("artistAboutBanner").src = artistAImage;
    }
}

function SetTheLatestRelease(artist){
    latestReleaseLi = "";
    let dbRef = ref(realdb);

    for (let i = brojPesama; i > 0; i--) {
        while(latestReleaseLi === ""){
            get(child(dbRef, "Songs/"+i)).then((snapshot)=>{
                if(snapshot.exists()){
                    songCreator = snapshot.val().Creator;
                    if(songCreator.includes(artist)){
                        songToBePlayed = snapshot.val().SongURL;
                        songTitle  = snapshot.val().SongName;
                        imageURL = snapshot.val().ImgURL;
                        latestReleaseLi =  `<li class="songItem">
                            <div class="songInfo">
                                <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                                <div class="songText">
                                    <h2>`+ songTitle +`</h2>
                                    <h3>`+ songCreator +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Latest Release',this.parentElement,'`+ i +`');"></div>
                            <div class="songBtns">
                                <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ i +`')"><i class="fa-solid fa-bars"></i></button>
                            </div>
                            <span class="latestPin">Latest</span>
                        </li>`;

                        document.getElementsByClassName("latestRelease")[0].innerHTML = "";
                        document.getElementsByClassName("latestRelease")[0].innerHTML = latestReleaseLi;
                    }
                }
            })
            break;
        }    
    }
}

let artistAppearsOnList = document.getElementsByClassName("artistAppearsOn")[0];

function GetPlaylistsArtistAppearsOn(playlistName,artist){
    let name = playlistName;

    artistAppearsOnList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            playlistArtists = snapshot.val().Artists;
            if(playlistArtists.toLowerCase().includes(artist.toLowerCase())){
                playlistName = snapshot.val().Title;
                playlistBanner = snapshot.val().Banner;
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                let currentLi =  `<li class="playlistItem" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img loading="lazy" src="`+ playlistBanner +`" alt="playlistBanner">
                <h3>`+ playlistName +`</h3>
                <h5>`+ playlistArtists +`</h5>
                </li>`;

                artistAppearsOnList.innerHTML += currentLi;
            }
        }
    })
}

let artistTopTracksList = document.getElementsByClassName("artistTopTracks")[0];

function GenerateOneSongFromArtist(songName,artist){
    let name = songName;

    artistTopTracksList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            if(songCreator.toLowerCase().includes(artist.toLowerCase())){
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Artists',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                </li>`;
                artistTopTracksList.innerHTML += currentLI;
            }
        }
    })
}

// ----- PLAYLIST PAGE

let playlistSongsList = document.getElementsByClassName("playlistSongsList")[0];

let isPlaylistPageOpen = false;

export function openPlaylistPage(playlistID, pName, pBanner, pLikes, pSongs){

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    if(document.getElementById("playlistChecker").innerHTML !== pName){

        playlistSongsList.innerHTML = "";

        document.getElementById("playlistLikesH5").style.display = "block";
        document.getElementById("likePlaylist").style.display = "block";

        let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;

        let playlistBanners = document.getElementsByName("playlistBanner");
        playlistBanners.forEach((banner) => {
            banner.src = pBanner;
        })

        let playlistNamess = document.getElementsByName("playlistName");
        playlistNamess.forEach((name) => {
            name.innerHTML = pName;
        })

        let playlistLikess = document.getElementsByName("playlistLikes");
        playlistLikess.forEach((like) => {
            like.innerHTML = pLikes;
        })

        let playlistSongss = pSongs.split(',');
        for (let i = 0; i < playlistSongss.length; i++) {
            GenerateOneSongFromPlaylist(playlistSongss[i]);
        }
    }else{
        let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;
    }
}

function GenerateOneSongFromPlaylist(songName){
    let name = songName;

    playlistSongsList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Playlists',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            playlistSongsList.innerHTML += currentLI;
        }
    })
}

export function closePlaylistPage(){

    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
    playlistScreen.classList.remove("playlistScreenOpen");
    isPlaylistPageOpen = false;
}

let closePlaylistBtn = document.getElementById("closePlaylistPage");
closePlaylistBtn.addEventListener(('click'), () => {
    closePlaylistPage();
})

// ----- THE VAULT

let isTheVaultOn = false;

let openTheVaultBtn = document.getElementById("openTheVaultBtn");
openTheVaultBtn.addEventListener('click', () => {
    if(!isTheVaultOn){
        document.getElementById("currentSong").focus();
        playRandomSongForTheVault();

        let vaultSection = document.getElementsByClassName("vaultSection")[0];
        openTheVaultBtn.classList.add("openedVaultBtn");
        openTheVaultBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;

        isTheVaultOn = true;
    }
});

function playerSelectedSongVault(songName){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            imageURL = snapshot.val().ImgURL;

            playerSelectedSong(songToBePlayed,songTitle,songCreator,imageURL,"TheVault",0);
        }
    })
}

export function playRandomSongForTheVault(){
    setTheVault();
    let g = Math.floor(Math.random() * brojPesama) + 1;
    playerSelectedSongVault(g);
}

// Make a playlist

let numberOfPlaylists = 0;

export function MakeAPlaylist(){
    OpenMakePlaylistScreen();
}

export async function SubmitAPlaylist(){
    let result = await UploadProcess();

    if(result){
        DBMakePl();
    }else{
        setTimeout(() => {
            DBMakePl();
        }, 1500);
    }
}

function DBMakePl(){
    const dbRef = ref(realdb);
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setTheme = snapshot.val().AppTheme;

            let currentMakePlaylistName = document.getElementsByClassName("currentMakePlaylistName")[0];

            set(ref(realdb, "Users/"+currentUser.Username),
            {
                Username: setUsername,
                Email: setEmail,
                LikedSongs: setLikedSongs,
                Password: setPassword,
                Playlists: (setPlaylists + "{" + (numberOfPlaylists+1) + "}" + currentMakePlaylistName.innerHTML + "}" + imageDownload + "}}"),
                AppTheme: setTheme
            })
            .then(()=>{
                alert("Playlist made");
                LoadUserPlaylists();
            })
            .catch((error)=>{
                alert("error "+error);
            })
        }
    })
}

// ----- GENERATING YOURS PAGE

let yoursPage = document.getElementsByClassName("yoursScreen")[0];
let yourPlaylists = document.getElementsByClassName("yourPlaylists")[0];

function LoadUserPlaylists(){
    yourPlaylists.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let usersPlaylists = (snapshot.val().Playlists).split('{');
            numberOfPlaylists = usersPlaylists.length;

            for (let i = numberOfPlaylists-2; i > 0; i--) {
                let currentLi =  `<li class="songItem" id="`+ usersPlaylists[i].split('}')[0] +`">
                    <div class="songInfo">
                        <img loading="lazy" src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
                        <div class="songText">
                            <h2>`+ usersPlaylists[i].split('}')[1] +`</h2>
                            <h3>`+ "by " + currentUser.Username +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="clickEffect(this); openMyPlaylistPage(`+ usersPlaylists[i].split('}')[0] +`,'`+ usersPlaylists[i].split('}')[1] +`','`+ usersPlaylists[i].split('}')[2] +`','`+ 0 +`','`+ usersPlaylists[i].split('}')[3] +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('playlist','`+ usersPlaylists[i].split('}')[2] +`','`+ "by " + currentUser.Username +`','`+ usersPlaylists[i].split('}')[1] +`','')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                </li>`;
                yourPlaylists.innerHTML += currentLi;
            }
        }
    })
}

function DeLoadUserPlaylists(){
    yourPlaylists.innerHTML = "";
}

export function openMyPlaylistPage(playlistID, pName, pBanner, pLikes, pSongs){

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

        document.getElementById("playlistLikesH5").style.display = "none";
        document.getElementById("likePlaylist").style.display = "none";

        let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
        playlistScreen.classList.add("playlistScreenOpen");
        isPlaylistPageOpen = true;

        let playlistBanners = document.getElementsByName("playlistBanner");
        playlistBanners.forEach((banner) => {
            banner.src = pBanner;
        })

        let playlistNamess = document.getElementsByName("playlistName");
        playlistNamess.forEach((name) => {
            name.innerHTML = pName;
        })

        let playlistLikess = document.getElementsByName("playlistLikes");
        playlistLikess.forEach((like) => {
            like.innerHTML = pLikes;
        })

        if(pSongs != ""){
            let playlistSongss = pSongs.split(',');
            for (let i = (playlistSongss.length-1); i >= 0; i--) {
                if(playlistSongss[i] != ""){
                    GenerateOneSongFromLiked(playlistSongss[i]);
                }
            }
        }else{
            playlistSongsList.innerHTML = "";
        }
}

// ----- MAKING A PLAYLIST

let reader = new FileReader();
let files = [];
let imageDownload;
let imageFileName = "";
let imageInput = document.getElementById("imageInput");

imageInput.onchange = e => {
    files = e.target.files;

    let extension = GetFileExt(files[0]);
    let name = GetFileName(files[0]);

    imageFileName = name + extension;

    reader.readAsDataURL(files[0]);

    reader.addEventListener('load', function () {
        document.getElementById("imageUploadView").style.backgroundImage = `url('`+ this.result +`')`;
    });
}

function GetFileExt(file){
    var temp = file.name.split('.');
    var ext = temp.slice(temp.length-1,temp.length);
    return '.'+ext[0];
}

function GetFileName(file){
    var temp = file.name.split('.');
    var fname = temp.slice(0,-1).join('.');
    return fname;
}

function UploadProcess(){
    return new Promise(resolve => {
        setTimeout(() => {
            var ImgToUpload = files[0];

            var ImgName = imageFileName;

            const metaData = {
                contentType: ImgToUpload.type
            }

            const storage = getStorage();

            const storageRef = sRef(storage, "Songs/"+ImgName);

            const UploadTask = uploadBytesResumable(storageRef, ImgToUpload, metaData);
    
            UploadTask.on('state-changed', (snapshot)=>{
                let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            },
            (error) =>{
                alert("Image failed to upload!" + "<br>" + error);
                resolve(false);
            },
            ()=>{
                getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
                    imageDownload = downloadURL;
                    document.getElementById("imageUploadView").innerHTML = "";
                    resolve(true);
                });
            }
            );
        }, 1000);
    })
}

function GenerateOneSongFromLiked(songName){
    let name = songName;

    playlistSongsList.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = snapshot.val().ImgURL;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <img loading="lazy" src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','Playlists',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`',true)"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            playlistSongsList.innerHTML += currentLI;
        }
    })
}

export function reloadLikedSongs(){

    let dbRef = ref(realdb);
    let userLiked;

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            userLiked = snapshot.val().LikedSongs;
            
            if(userLiked === undefined){
                userLiked = "";
            }
        
            if(userLiked !== ""){
                let playlistSongss = userLiked.split(',');
                for (let i = (playlistSongss.length-1); i > 0; i--) {
                    if(playlistSongss[i] !== ""){
                        GenerateOneSongFromLiked(playlistSongss[i]);
                    }
                }
            }else{
                playlistSongsList.innerHTML = "";
            }
        }
    })
}

export function openLikedSongs(){

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let userLiked = snapshot.val().LikedSongs;

            if(userLiked != undefined){
                openMyPlaylistPage(0, "Favourites", "images/favourites.jpg", "0", userLiked);
            }else{
                openMyPlaylistPage(0, "Favourites", "images/favourites.jpg", "0", "");
            }
        }
    })
}

// ----- LIKE SONGS

export function seeIfSongIsLiked(id){

    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setLikedSongs = snapshot.val().LikedSongs;

            if(setLikedSongs === undefined){
                setLikedSongs = "";
            }
            let likedSongsArray = setLikedSongs.split(',');

            const likeSongBtn = document.getElementById("likeSongBtn");
            const playerLikeBtn = document.getElementById("playerLikeBtn");
            const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");

            if(likedSongsArray.includes(id)){
                miniPlayerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                playerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favourites</h5>`;
            }else{
                miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favourites</h5>`;
            }
        }
    })

    return true;
}

export function addSongToLiked(id){
    const dbRef = ref(realdb);
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setTheme = snapshot.val().AppTheme;

            if(setLikedSongs === undefined){
                setLikedSongs = "";
            }
            let likedSongsArray = setLikedSongs.split(',');
            if(!likedSongsArray.includes(id)){
                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    Password: setPassword,
                    Playlists: setPlaylists,
                    LikedSongs: setLikedSongs + id + ",",
                    AppTheme: setTheme
                })
                .then(()=>{
                    const likeSongBtn = document.getElementById("likeSongBtn");
                    const playerLikeBtn = document.getElementById("playerLikeBtn");
                    const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                    likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favourites</h5>`;
                    playerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    reloadLikedSongs();
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }else{
                likedSongsArray = likedSongsArray.filter(function(item) {
                    return item !== id;
                });

                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    Password: setPassword,
                    Playlists: setPlaylists,
                    LikedSongs: likedSongsArray.toString(),
                    AppTheme: setTheme
                })
                .then(()=>{
                    const likeSongBtn = document.getElementById("likeSongBtn");
                    const playerLikeBtn = document.getElementById("playerLikeBtn");
                    const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                    likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favourites</h5>`;
                    playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    reloadLikedSongs();
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        }
    })
}

// ----- GETTING ARTIST ID FROM NAME

export function getArtistId(artistName){
    let dbRef = ref(realdb);
    
    for (let i = 0; i < brojArtista; i++) {
        get(child(dbRef, "Artists/"+i)).then((snapshot)=>{
            if(snapshot.exists()){
                let artistNameDB = snapshot.val().Artist;
                let artistImage = snapshot.val().ImageURL;
                let artistFollowers = snapshot.val().Followers;
                let artistListens = snapshot.val().Listens;
                let artistAboutImage = snapshot.val().AboutBanner;
                if(artistName == artistNameDB){
                    document.getElementById('seeMoreFromBtn').onclick = () => {
                        clickEffect(this); 
                        openArtistPage(i,artistName,artistImage,artistFollowers,artistListens,artistAboutImage);
                        closePopup();
                        closeBigPlayer();
                    };
                }
            }
        })
    }
}

// ----- LOADING USERS PLAYLISTS IN THE POPUP

const popupMyPlaylists = document.querySelector('.popupMyPlaylists');

export function LoadUserPlaylistsPopup(songId){
    popupMyPlaylists.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let usersPlaylists = (snapshot.val().Playlists).split('{');
            numberOfPlaylists = usersPlaylists.length;

            for (let i = numberOfPlaylists-2; i > 0; i--) {
                if(usersPlaylists[i].split('}')[3].includes(',' + songId) || usersPlaylists[i].split('}')[3].includes(songId + ',')){
                    let currentLi =  `<li class="songItem" id="`+ usersPlaylists[i].split('}')[0] +`">
                        <div class="songInfo">
                            <img loading="lazy" src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
                            <div class="songText">
                                <h2>`+ usersPlaylists[i].split('}')[1] +`</h2>
                                <h3>`+ "by " + currentUser.Username +`</h3>
                            </div>
                        </div>
                        <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ usersPlaylists[i].split('}')[0] +`)"></div>
                        <div class="songBtns greenCheck">
                            <button onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ usersPlaylists[i].split('}')[0] +`)"><i class="fa-solid fa-circle-check checkAnim"></i></button>
                            <div class="greenSidePl"></div>
                        </div>
                    </li>`;
                    popupMyPlaylists.innerHTML += currentLi;
                }else{
                    let currentLi =  `<li class="songItem" id="`+ usersPlaylists[i].split('}')[0] +`">
                        <div class="songInfo">
                            <img loading="lazy" src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
                            <div class="songText">
                                <h2>`+ usersPlaylists[i].split('}')[1] +`</h2>
                                <h3>`+ "by " + currentUser.Username +`</h3>
                            </div>
                        </div>
                        <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ usersPlaylists[i].split('}')[0] +`)"></div>
                        <div class="songBtns">
                            <button onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ usersPlaylists[i].split('}')[0] +`)"><i class="fa-solid fa-plus checkAnim"></i></button>
                            <div class="greenSidePl"></div>
                        </div>
                    </li>`;
                    popupMyPlaylists.innerHTML += currentLi;
                }
            }
        }
    })
}

export function addSongToThisPlaylist(clickedPlaylist, songId, playlistId){
    if(!clickedPlaylist.children[2].classList.contains('greenCheck')){
        clickedPlaylist.children[2].children[0].innerHTML = '<i class="fa-solid fa-circle-check checkAnim"></i>';
        clickedPlaylist.children[2].classList.add('greenCheck');
        let setUsername,setEmail,setPassword,setPlaylists,setLikedSongs,setTheme;
        let newSetPlaylists = "{";

        let dbRef = ref(realdb);

        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                setUsername = snapshot.val().Username;
                setEmail = snapshot.val().Email;
                setPassword = snapshot.val().Password;
                setPlaylists = snapshot.val().Playlists;
                setLikedSongs = snapshot.val().LikedSongs;
                setTheme = snapshot.val().AppTheme;
                let usersPlaylists = setPlaylists.split('{');

                for (let i = 1; i < usersPlaylists.length; i++) {
                    if(usersPlaylists[i].split('}')[0] == playlistId){
                        if(usersPlaylists[i].split('}')[3] != ""){
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + "," + songId + "}" + "{";
                        }else{
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + songId + "}" + "{";
                        }
                    }else{
                        if(i != (usersPlaylists.length-1)){
                            newSetPlaylists += usersPlaylists[i] + "{";
                        }else{
                            newSetPlaylists += usersPlaylists[i];
                        }
                    }
                }

                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    Password: setPassword,
                    Playlists: newSetPlaylists,
                    LikedSongs: setLikedSongs,
                    AppTheme: setTheme
                })
                .then(()=>{
                    LoadUserPlaylists();
                    // console.log("Added");
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    }
}

// ----- CALLING ALL NECESSARY FUNCTIONS

getUsername();
seeIfUserIsSignedIn();
generateSongs();
generateArtists();
generatePlaylists();
generateCategories();