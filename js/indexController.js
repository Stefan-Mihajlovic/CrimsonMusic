import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-analytics.js";
import { } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-storage.js';
import { getDatabase, ref, set, child, get, update, remove, onValue } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js';
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

// ----- FIREBASE INIT
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider(app);
const auth = getAuth(app);

const realdb = getDatabase();

function loadAppNumbers(){
    return new Promise(resolve => {
        onValue(ref(realdb, 'Songs/'), (snapshot) => {
            const data = snapshot.val();
            brojPesama = data.length - 1;

            onValue(ref(realdb, 'Artists/'), (snapshot) => {
                const data = snapshot.val();
                brojArtista = data.length - 1;

                onValue(ref(realdb, 'PublicPlaylists/'), (snapshot) => {
                    const data = snapshot.val();
                    brojPlejlista = data.length - 1;

                    resolve(true);
                })
            })
        });
    })
}

const username = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');

let accountNames = document.getElementsByName('accountName');
let accountEmails = document.getElementsByName('accountEmail');
let accountPhotos = document.getElementsByName('profilePhoto');
let accountUsername;
let accountEmail;
let profilePhoto;
export let accountTheme = "Dark";

let loggedIn = false;

let currentUser;

function isEmptyOrSpaces(str){
    return str == null || str.match(/^ *$/) !== null;
}

function Validation(){
    let emailregex = /^[a-zA-Z0-9]+@(gmail|yahoo|outlook|icloud)\.com$/;
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
        alert('Username is not valid and has to have more than 5 characters!');
        return false;
    }

    return true;
}

// ----- REGISTER USER

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
                ProfilePhoto: "1",
                LikedSongs: "",
                AppTheme: "Dark",
                FollowedArtists: "",
                LikedPlaylists: ""
            })
            .then(()=>{
                alert(`Welcome to Crimson ${username.value}!`);
                AuthenticateUser();
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

// ----- AUTHENTICATE USER

function AuthenticateUser(){
    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+username.value)).then((snapshot)=>{
        if(snapshot.exists()){
            let dbpass = decPass(snapshot.val().Password);
            if(dbpass == password.value){
                loginUser(snapshot.val());
                LoadUserPlaylists();
                LoadLikedPlaylists();
                LoadUserFArtists();
            }
        }else{
            alert("Account not found!");
        }
    })
}

function reloadUserPhotoAndUsername(){
    const dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            loginUser(snapshot.val());
        }
    })
}

// ----- DECRYPT PASSWORD

function decPass(dbpass){
    let pass12 = CryptoJS.AES.decrypt(dbpass, password.value);
    return pass12.toString(CryptoJS.enc.Utf8);
}

// ----- LOGIN USER

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
    
    let dbRef = ref(realdb);
    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setProfilePhoto = snapshot.val().ProfilePhoto;

            accountPhotos.forEach((photo) => {
                photo.src = `images/profiles/${setProfilePhoto}.png`;
            })
        }
    })

    accountTheme = user.AppTheme;
    setLoggedInScreen();
}

function getUsername(){
    let keepLoggedIn = localStorage.getItem('keepLoggedIn');

    if(keepLoggedIn === 'yes'){
        currentUser = JSON.parse(localStorage.getItem('user'));
    }
}

// ----- SIGN OUT USER

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
    profilePhoto = "1";
    accountPhotos.forEach((photo) => {
        photo.src = `images/profiles/${profilePhoto}.png`;
    });
    location.reload();
    return false;
}

let logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', ()=>{
    signOut(auth).then(() => {
        SignOutUser();
        DeLoadUserPlaylists();
        DeLoadLikedPlaylists();
        DeLoadUserFArtists();
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
    }
}

// Is user signed in check

export function UserSignedIn(){
    if(currentUser != undefined){
        return true;
    }else{
        return false;
    }
}

// ----- Generate a song based on the songID

let songToBePlayed,songTitle,songCreator,imageURL,songColor;

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
            songColor = snapshot.val().Color;
            let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img onError="noStorage()" src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Home',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                </div>
            </li>`;
            recSongs.innerHTML += currentLI;

            if(recSongs.children.length == 5){
                setTimeout(() => {
                    document.querySelector('.loaderWrapper').classList.add('loaderOff');
                }, 500);
            }
        }
    })
}

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

// ----- GENERATE ARTISTS
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
            let currentImg =  `<li id="song`+ name +`" class="artistItem" onclick="openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img onload="buttonClickAnim(this.parentElement)" src="`+ artistImage +`" alt="artistImage">
            <h3>`+ artistName +`</h3>
            </li>`;
            recArtists.innerHTML += currentImg;
        }
    })
}

function generateArtists(){
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

// ----- GENERATE PLAYLISTS
let playlistBanner,playlistLikes,playlistSongs,playlistArtists,playlistOwners;
let recPlaylists = document.getElementsByClassName("recPlaylists")[0];

function GetPlaylists(playlistName){
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            let currentLi = "";

            playlistName = snapshot.val().Title;
            playlistBanner = snapshot.val().Banner;
            playlistLikes = snapshot.val().Likes;
            playlistSongs = snapshot.val().Songs;
            playlistArtists = snapshot.val().Artists;
            playlistOwners = snapshot.val().Owners;

            if(playlistOwners != "..Crimson.."){
                currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBanner +`" alt="playlistBanner">
                    <h3>`+ playlistName +`</h3>
                    <h5>`+ playlistArtists +`</h5>
                </li>`;
            }else{
                currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div>
                        <img onload="buttonClickAnim(this.parentElement.parentElement)" src="`+ playlistBanner +`" alt="playlistBanner">
                        <img class="crimsonPlaylistTag" src="../images/CrimsonLogo.png" alt="Crimson Tag"></img>
                    </div>
                    <h3>`+ playlistName +`</h3>
                    <h5>`+ playlistArtists +`</h5>
                </li>`;
            }

            recPlaylists.innerHTML += currentLi;
        }
    })
}

function generatePlaylists(){

    let randomList = [];

    for (let i = 0; i < 5; i++) {
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

const searchBtn = document.getElementById("submitSearch");
searchBtn.addEventListener('click', () => {
    
    const searchInput = document.getElementById("searchInput");
    const searchedText = searchInput.value;
    const searchedTextLower = searchedText.toLowerCase();

    const isAllCh = document.getElementById("allInput").checked;
    const isSongsCh = document.getElementById("songsInput").checked;
    const isArtistsCh = document.getElementById("artistsInput").checked;
    const isPlaylistsCh = document.getElementById("playlistsInput").checked;
    const isProfilesCh = document.getElementById("profilesInput").checked;

    searchList.innerHTML = "";
    searchList.classList.add("searchListOpen");

    if(searchedTextLower != ""){
        if(isAllCh || isSongsCh){
            for (let i = 1; i <= brojPesama; i++) {
                findSearchedSong(i,searchedTextLower);
            }
        }
    
        if(isAllCh || isArtistsCh){
            for (let i = 1; i <= brojArtista; i++) {
                findSearchedArtist(i,searchedTextLower);
            }
        }

        if(isAllCh || isPlaylistsCh){
            for (let i = 1; i <= brojPlejlista; i++) {
                findSearchedPlaylist(i,searchedTextLower);
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
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem songItemSearch" onclick="clickEffect(this)">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
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
                                        <img  src="`+ artistImage +`" alt="artistImage">
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
                        <img  src="`+ playlistBanner +`" alt="playlistBanner">
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
            <h3>`+ catName +`</h3><div class="darkenCat"></div>
            </div>`;
        }
    })

    get(child(dbRef, "Categories/"+(name+1))).then((snapshot)=>{
        if(snapshot.exists()){
            catName2 = snapshot.val().Name;
            catColor2 = snapshot.val().Color;
            catBanner2 = snapshot.val().Banner;

            currentLi += `<div class="catItem" onclick="clickEffect(this); openCategoryPage('`+ catName2 +`', '`+ catColor2 +`', '`+ catBanner2 +`')" style="background-color: `+ catColor2 +`">
            <h3>`+ catName2 +`</h3><div class="darkenCat"></div>
            </div></li>`;

            categoriesList.innerHTML += currentLi;
        }
    })
}

// ----- CATEGORY PAGE

let categoryPage = document.getElementsByClassName("categoryScreen")[0];
let categoryRecommendedPlaylistsList = document.getElementsByClassName("categoryRecommendedPlaylists")[0];
let categoryRecommendedSongsList = document.getElementsByClassName("categoryRecommendedSongs")[0];
let categoryAccentBubble = document.getElementsByClassName("categoryAccentBubble")[0];

let isCategoryPageOpen = false;

export function openCategoryPage(category, color, banner){

    categoryPage.classList.add('screenOpenOnTop');

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != categoryPage){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = categoryPage;

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

    categoryPage.classList.remove("playerMovable");

    categoryPage.classList.remove('screenOpenOnTop');
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
                let currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBanner +`" alt="playlistBanner">
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
            if(songCat.includes(inputText)){
                songTitle  = snapshot.val().SongName;
                songToBePlayed = snapshot.val().SongURL;
                songCreator = snapshot.val().Creator;
                imageURL = snapshot.val().ImgURL;
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Search',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="clickEffect(this); openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                    </li>`;
                categoryRecommendedSongsList.innerHTML += currentLI;
            }
        }
    })
}

// ----- ARTIST PAGE

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
    artistScreen.classList.remove('screenOpenOnTop');

    artistScreen.classList.remove("playerMovable");

    isArtistPageOpen = false;
}

export async function openArtistPage(artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage){

    let artistScreen = document.getElementsByClassName("artistScreen")[0];
    artistScreen.classList.add('screenOpenOnTop');

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != artistScreen){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = artistScreen;

    checkIfArtistIsFollowed(artistID);

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    for (let i = 0; i < screenScrollables.length; i++) {
        screenScrollables[i].scrollTop = 0;
    }
    
    if(!isArtistPageOpen){
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

    for (let i = 0; i <= brojPesama; i++) {
        GenerateOneSongFromArtist(i, artistName);
    }

    const followArtistBtn = document.getElementById('followArtistBtn');
    followArtistBtn.addEventListener('click', () => {
        if(UserSignedIn()){
            followArtist(artistID);
        }else{
            openLoginPopup();
        }
    });

    if(artistAImage != undefined){
        document.getElementById("artistAboutBanner").src = artistAImage;
    }

    setTimeout(() => {
        defaultPlaylistSort = document.querySelector('.artistSongs').innerHTML;
    }, 500);
}

export function openArtistPageByName(artistName2){

    let dbRef = ref(realdb);
    let artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage;
    let br = 0;
    
    for (let i = 1; i < brojArtista; i++) {
        get(child(dbRef, "Artists/"+i)).then((snapshot)=>{
            if(snapshot.exists()){
                let ArtistName = artistName2.split(',')[0];

                artistName = snapshot.val().Artist;

                if(artistName.includes(ArtistName)){
                    artistID = i;
                    artistImage = snapshot.val().ImageURL;
                    artistFollowers = snapshot.val().Followers;
                    artistListens = snapshot.val().Listens;
                    artistAboutImage = snapshot.val().AboutBanner;
                    br = 1;
                    closeBigPlayer();
                    openArtistPage(artistID, artistName, artistImage, artistFollowers, artistListens, artistAImage);
                }
            }
        })
        if(br == 1){
            break;
        }
    }
}

function checkIfArtistIsFollowed(artistId){
    const dbRef = ref(realdb);
    const followArtistBtn = document.getElementById('followArtistBtn');

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
    
                let fArtistsCut = setFollowedArtists.split(',');
                if(fArtistsCut.includes(String(artistId))){
                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Unfollow`;
                }else{
                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Follow`;
                }
            }
        })
    }
}

function followArtist(artistId){
    const dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }
    
                let isArtistFollowed = false;
                let newFollowedArtists;
                let fArtistsCut = setFollowedArtists.split(',');
                if(fArtistsCut.includes(String(artistId))){
                    isArtistFollowed = true;
                    for (let i = 0; i < fArtistsCut.length; i++) {
                        if(fArtistsCut[i] == artistId){
                            fArtistsCut.splice(i, 1);
                        }
                    }
                    newFollowedArtists = fArtistsCut.join(',');
                }else{
                    isArtistFollowed = false;
                    newFollowedArtists = setFollowedArtists + artistId + ",";
                }
    
                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    LikedSongs: setLikedSongs,
                    Password: setPassword,
                    Playlists: setPlaylists,
                    ProfilePhoto: setProfilePhoto,
                    AppTheme: setTheme,
                    FollowedArtists: newFollowedArtists,
                    LikedPlaylists: setLikedPlaylists
                })
                .then(()=>{
                    const followArtistBtn = document.getElementById('followArtistBtn');
    
                    get(child(dbRef, "Artists/"+artistId)).then((snapshot)=>{
                        if(snapshot.exists()){
                            let artistNameDB = snapshot.val().Artist;
                            let artistImage = snapshot.val().ImageURL;
                            let artistFollowers = snapshot.val().Followers;
                            let artistListens = snapshot.val().Listens;
                            let artistAboutImage = snapshot.val().AboutBanner;
    
                            if(!isArtistFollowed){
                                set(ref(realdb, "Artists/"+artistId),
                                {
                                    AboutBanner: artistAboutImage,
                                    Artist: artistNameDB,
                                    Followers: String(Number(artistFollowers)+1),
                                    ImageURL: artistImage,
                                    Listens: artistListens
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Unfollow`;
                                })
                                .catch((error)=>{
                                    alert("error "+error);
                                })
                            }else{
                                set(ref(realdb, "Artists/"+artistId),
                                {
                                    AboutBanner: artistAboutImage,
                                    Artist: artistNameDB,
                                    Followers: String(Number(artistFollowers)-1),
                                    ImageURL: artistImage,
                                    Listens: artistListens
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Follow`;
                                })
                                .catch((error)=>{
                                    alert("error "+error);
                                })
                            }
                        }
                    })
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    }
}

function SetTheLatestRelease(artist){
    let latestReleaseLi = "";
    let dbRef = ref(realdb);

    for (let i = 0; i < brojPesama; i++) {
            // console.log(i);
            get(child(dbRef, "Songs/"+i)).then((snapshot)=>{
                if(snapshot.exists()){
                    songCreator = snapshot.val().Creator;
                    if(songCreator.includes(artist)){
                        songToBePlayed = snapshot.val().SongURL;
                        songTitle  = snapshot.val().SongName;
                        imageURL = snapshot.val().ImgURL;
                        songColor = snapshot.val().Color;
                        latestReleaseLi =  `<li class="songItem">
                            <div class="songInfo">
                                <div class="songVisualizer">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <img src="`+imageURL+`" alt="songBanner">
                                <div class="songText">
                                    <h2>`+ songTitle +`</h2>
                                    <h3>`+ songCreator +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Latest Release',this.parentElement,'`+ i +`');"></div>
                            <div class="songBtns">
                                <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ i +`')"><i class="fa-solid fa-bars"></i></button>
                            </div>
                        </li>`;

                        document.getElementsByClassName("latestRelease")[0].innerHTML = "";
                        document.getElementsByClassName("latestRelease")[0].innerHTML = latestReleaseLi;
                    }
                }
            })
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
                let currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBanner +`" alt="playlistBanner">
                <h3>`+ playlistName +`</h3>
                <h5>`+ playlistArtists +`</h5>
                </li>`;

                artistAppearsOnList.innerHTML += currentLi;
            }
        }
    })
}

let artistSongs = document.getElementsByClassName("artistSongs")[0];

function GenerateOneSongFromArtist(songName,artist){
    let name = songName;

    artistSongs.innerHTML = "";

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            if(songCreator.toLowerCase().includes(artist.toLowerCase())){
                songToBePlayed = snapshot.val().SongURL;
                songTitle  = snapshot.val().SongName;
                imageURL = snapshot.val().ImgURL;
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURL+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Artists',this.parentElement,'`+ name +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
                    </div>
                </li>`;
                artistSongs.innerHTML += currentLI;
            }
        }
    })
}

// ----- PLAYLIST PAGE

let playlistSongsList = document.getElementsByClassName("playlistSongsList")[0];

let isPlaylistPageOpen = false;

export function openPlaylistPage(playlistID, pName, pBanner, pLikes, pSongs){

    let playlistScreen = document.getElementsByClassName("playlistScreen")[0];
    playlistScreen.classList.add('screenOpenOnTop');

    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != playlistScreen){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = playlistScreen;

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    if(document.getElementById("playlistChecker").innerHTML !== pName){

        playlistSongsList.innerHTML = "";

        document.getElementById("playlistLikesH5").style.display = "block";
        document.getElementById("likePlaylist").style.display = "flex";

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

        IsPPlaylistLiked(playlistID);

        let playlistSongss = pSongs.split(',');
        for (let i = 0; i < playlistSongss.length; i++) {
            GenerateOneSongFromPlaylist(playlistSongss[i]);
        }

        document.getElementById('likePlaylist').setAttribute('name',playlistID);

        setTimeout(() => {
            defaultPlaylistSort = document.querySelector('.playlistSongsList').innerHTML;
        }, 500);
    }else{
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
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Playlists',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`')"><i class="fa-solid fa-bars"></i></button>
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

    playlistScreen.classList.remove("playerMovable");

    playlistScreen.classList.remove('screenOpenOnTop');
}

const closePlaylistBtn = document.getElementById("closePlaylistPage");
closePlaylistBtn.addEventListener(('click'), () => {
    closePlaylistPage();
});

const likePlaylistBtn = document.getElementById('likePlaylist');
likePlaylistBtn.addEventListener('click', () => {
    
    const dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }

                let slpArray = setLikedPlaylists.split(',');
                let playlistID = likePlaylistBtn.getAttribute('name');
                if(!slpArray.includes(playlistID)){
                    setLikedPlaylists += playlistID + ",";

                    set(ref(realdb, "Users/"+currentUser.Username),
                    {
                        Username: setUsername,
                        Email: setEmail,
                        LikedSongs: setLikedSongs,
                        Password: setPassword,
                        Playlists: setPlaylists,
                        ProfilePhoto: setProfilePhoto,
                        AppTheme: setTheme,
                        FollowedArtists: setFollowedArtists,
                        LikedPlaylists: setLikedPlaylists
                    })
                    .then(()=>{
                        // console.log("Uspesno!");
                        likePlaylistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                        LoadLikedPlaylists();
                    })
                    .catch((error)=>{
                        alert("error "+error);
                    })
                }else{
                    slpArray = slpArray.filter(function(item) {
                        return item !== playlistID;
                    });
                    setLikedPlaylists = slpArray.join(',');

                    set(ref(realdb, "Users/"+currentUser.Username),
                    {
                        Username: setUsername,
                        Email: setEmail,
                        LikedSongs: setLikedSongs,
                        Password: setPassword,
                        Playlists: setPlaylists,
                        ProfilePhoto: setProfilePhoto,
                        AppTheme: setTheme,
                        FollowedArtists: setFollowedArtists,
                        LikedPlaylists: setLikedPlaylists
                    })
                    .then(()=>{
                        // console.log("Uspesno!");
                        likePlaylistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                        LoadLikedPlaylists();
                    })
                    .catch((error)=>{
                        alert("error "+error);
                    })
                }
            }
        })
    }else{
        openLoginPopup();
    }
});

function IsPPlaylistLiked(id){

    const dbRef = ref(realdb);

    id = id + "";

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let slpArray
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                if(setLikedPlaylists != undefined){
                    slpArray = setLikedPlaylists.split(',');
                }else{
                    slpArray = "";
                }
                if(slpArray.includes(id)){
                    likePlaylistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                }else{
                    likePlaylistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                }
            }
        })
    }
}

// ----- THE VAULT

let vaultSongArray = [];

let isTheVaultOn = false;

export function vaultEmotionLoad(categ){
    playRandomSongForTheVault(categ);
    closeTheVault();
}

function playerSelectedSongVault(songName){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songCreator = snapshot.val().Creator;
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            imageURL = snapshot.val().ImgURL;
            songColor = snapshot.val().Color;

            playerSelectedSong(songToBePlayed,songTitle,songCreator,imageURL,songColor,"TheVault",'',name);
        }
    })
}

export function playRandomSongForTheVault(categ){
    if(categ != undefined || categ != null){
        setTheVault();

        let dbRef = ref(realdb);

        get(child(dbRef, "SongsByMoods/"+categ)).then((snapshot)=>{
            if(snapshot.exists()){
                let setSongs = snapshot.val().Songs;
                setSongs += "";
                vaultSongArray = setSongs.split(',');

                let songToPlayV = Math.floor(Math.random() * vaultSongArray.length);
                playerSelectedSongVault(vaultSongArray[songToPlayV]);
            }
        })
    }else{
        let songToPlayV = Math.floor(Math.random() * vaultSongArray.length);
        playerSelectedSongVault(vaultSongArray[songToPlayV]);
    }
}

// ----- Make a playlist

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

let currentMakePlaylistName = document.querySelector('.currentMakePlaylistName');
function DBMakePl(){
    const dbRef = ref(realdb);
        if(currentUser != undefined && document.querySelector('.makePlaylistScreen').children[0].children[0].children[1].innerHTML != "Edit Playlist"){
            get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){
                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setTheme = snapshot.val().AppTheme;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedPlaylists == undefined){
                        setLikedPlaylists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
        
                    set(ref(realdb, "Users/"+currentUser.Username),
                    {
                        Username: setUsername,
                        Email: setEmail,
                        LikedSongs: setLikedSongs,
                        Password: setPassword,
                        Playlists: (setPlaylists + "{" + (numberOfPlaylists+1) + "}" + currentMakePlaylistName.innerHTML + "}" + imageDownload + "}}"),
                        ProfilePhoto: setProfilePhoto,
                        AppTheme: setTheme,
                        FollowedArtists: setFollowedArtists,
                        LikedPlaylists: setLikedPlaylists
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
        else if(currentUser != undefined && document.querySelector('.makePlaylistScreen').children[0].children[0].children[1].innerHTML == "Edit Playlist"){
            get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){

                    let newSetPlaylists = "";

                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setTheme = snapshot.val().AppTheme;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    setFollowedArtists = snapshot.val().FollowedArtists;
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
                    if(setLikedPlaylists == undefined){
                        setLikedPlaylists = "";
                    }
                    if(setPlaylists == undefined){
                        setPlaylists = "";
                    }
    
                    let usersPlaylists = setPlaylists.split('{');
    
                    for (let i = 0; i < usersPlaylists.length; i++) {
                        if(i == (usersPlaylists.length-1)){
                            if(usersPlaylists[i].split('}')[0] != currentMakePlaylistName.getAttribute('data-playlist-id')){
                                newSetPlaylists += usersPlaylists[i];
                            }else{
                                newSetPlaylists += currentMakePlaylistName.getAttribute('data-playlist-id') + "}" + currentMakePlaylistName.innerHTML + "}" + currentMakePlaylistName.getAttribute('data-playlist-banner') + "}" + currentMakePlaylistName.getAttribute('data-playlist-songs') + "}";
                            }
                        }else{
                            if(usersPlaylists[i].split('}')[0] != currentMakePlaylistName.getAttribute('data-playlist-id')){
                                newSetPlaylists += usersPlaylists[i] + "{";
                            }else{
                                newSetPlaylists += currentMakePlaylistName.getAttribute('data-playlist-id') + "}" + currentMakePlaylistName.innerHTML + "}" + currentMakePlaylistName.getAttribute('data-playlist-banner') + "}" + currentMakePlaylistName.getAttribute('data-playlist-songs') + "}" + "{";
                            }
                        }
                    }
    
                    set(ref(realdb, "Users/"+currentUser.Username),
                    {
                        Username: setUsername,
                        Email: setEmail,
                        Password: setPassword,
                        Playlists: newSetPlaylists,
                        ProfilePhoto: setProfilePhoto,
                        LikedSongs: setLikedSongs,
                        AppTheme: setTheme,
                        FollowedArtists: setFollowedArtists,
                        LikedPlaylists: setLikedPlaylists
                    })
                    .then(()=>{
                        alert("Playlist saved");
                        LoadUserPlaylists();
                    })
                    .catch((error)=>{
                        alert("error "+error);
                    })
                }
            })
        }
}

// ----- GENERATING YOURS PAGE

let yoursPage = document.getElementsByClassName("yoursScreen")[0];
let yourPlaylists = document.getElementsByClassName("yourPlaylists")[0];
let yourFArtists = document.getElementsByClassName("yourFArtists")[0];
let yourLPlaylists = document.getElementsByClassName('yourLPlaylists')[0];

function LoadUserPlaylists(){
    yourPlaylists.innerHTML = "";

    let dbRef = ref(realdb);

    if(currentUser == null || currentUser == undefined)
        return;
    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let usersPlaylists = (snapshot.val().Playlists).split('{');
            numberOfPlaylists = usersPlaylists.length - 1;

            for (let i = numberOfPlaylists; i > 0; i--) {
                let currentLi =  `<li class="songItem" id="`+ usersPlaylists[i].split('}')[0] +`">
                    <div class="songInfo">
                        <img src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
                        <div class="songText">
                            <h2>`+ usersPlaylists[i].split('}')[1] +`</h2>
                            <h3>`+ "by " + currentUser.Username +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="clickEffect(this); openMyPlaylistPage(`+ usersPlaylists[i].split('}')[0] +`,'`+ usersPlaylists[i].split('}')[1] +`','`+ usersPlaylists[i].split('}')[2] +`','`+ 0 +`','`+ usersPlaylists[i].split('}')[3] +`');"></div>
                    <div class="songBtns">
                        <button onclick="openPopup('playlist','`+ usersPlaylists[i].split('}')[2] +`','`+ "by " + currentUser.Username +`','`+ usersPlaylists[i].split('}')[1] +`',${usersPlaylists[i].split('}')[0]},'${usersPlaylists[i].split('}')[3]}')"><i class="fa-solid fa-bars"></i></button>
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

function LoadUserFArtists(){
    yourFArtists.innerHTML = "";

    const dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
    
                let fArtistsCut = setFollowedArtists.split(',');
                fArtistsCut.reverse();
                fArtistsCut.forEach(artist => {
                    if(artist != undefined && artist != ""){
                        GetArtists2(artist);
                    }
                });
            }
        })
    }
}

function GetArtists2(artistName){
    let name = artistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            artistImage = snapshot.val().ImageURL;
            artistFollowers = snapshot.val().Followers;
            artistListens = snapshot.val().Listens;
            artistAboutImage = snapshot.val().AboutBanner;
            let currentImg =  `<li id="song`+ name +`" class="artistItem" onclick="openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img onload="buttonClickAnim(this.parentElement)" src="`+ artistImage +`" alt="artistImage">
            <h3>`+ artistName +`</h3>
            </li>`;
            yourFArtists.innerHTML += currentImg;
        }
    })
}

function DeLoadUserFArtists(){
    yourFArtists.innerHTML = "";
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

        setTimeout(() => {
            defaultPlaylistSort = document.querySelector('.playlistSongsList').innerHTML;
        }, 500);
}



function LoadLikedPlaylists(){
    yourLPlaylists.innerHTML = "";

    let dbRef = ref(realdb);

    if(currentUser == null || currentUser == undefined)
        return;
    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let usersLikedPlaylists
            if(snapshot.val().LikedPlaylists != undefined){
                usersLikedPlaylists = (snapshot.val().LikedPlaylists).split(',');
            }else{
                usersLikedPlaylists = "";
            }
            let numberOfLPlaylists = usersLikedPlaylists.length;

            let dbRef = ref(realdb);

            for (let i = 0; i < numberOfLPlaylists-1; i++) {
                get(child(dbRef, "PublicPlaylists/"+usersLikedPlaylists[i])).then((snapshot)=>{
                    if(snapshot.exists()){
                        let playlistName = snapshot.val().Title;
                        let playlistBanner = snapshot.val().Banner;
                        let playlistLikes = snapshot.val().Likes;
                        let playlistSongs = snapshot.val().Songs;
                        let playlistArtists = snapshot.val().Artists;

                        let currentLi =  `<li class="songItem" id="`+ usersLikedPlaylists[i] +`">
                            <div class="songInfo">
                                <img  src="`+ playlistBanner +`" alt="playlistBanner">
                                <div class="songText">
                                    <h2>`+ playlistName +`</h2>
                                    <h3>`+ "by " + playlistArtists +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="clickEffect(this); openPlaylistPage(`+ usersLikedPlaylists[i] +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');"></div>
                        </li>`;
                        yourLPlaylists.innerHTML += currentLi;
                    }
                })
            }
        }
    })
}

function DeLoadLikedPlaylists(){
    yourLPlaylists.innerHTML = "";
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
        if(document.querySelector('.makePlaylistScreen').children[0].children[0].children[1].innerHTML != "Edit Playlist"){
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
        }else{
            resolve(true);
        }
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
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURL+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','Playlists',this.parentElement,'`+ name +`');"></div>
                <div class="songBtns">
                    <button onclick="openPopup('song','`+ imageURL +`','`+ songCreator +`','`+ songTitle +`','`+ songName +`',true)"><i class="fa-solid fa-bars"></i></button>
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
                openMyPlaylistPage(0, "Favorites", "images/favoritesPlaylistPage.gif", "0", userLiked);
            }else{
                openMyPlaylistPage(0, "Favorites", "images/favoritesPlaylistPage.gif", "0", "");
            }
        }
    })
}

// ----- LIKE SONGS

export function seeIfSongIsLiked(id){

    const dbRef = ref(realdb);

    if(currentUser != undefined){
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
                    likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`;
                }else{
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
                }
            }
        })
    }

    return true;
}

export function addSongToLiked(id, likeBtn){
    const dbRef = ref(realdb);
        if(currentUser != undefined){

            get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){
                    let setUsername = snapshot.val().Username;
                    let setEmail = snapshot.val().Email;
                    let setPassword = snapshot.val().Password;
                    let setPlaylists = snapshot.val().Playlists;
                    let setProfilePhoto = snapshot.val().ProfilePhoto;
                    let setLikedSongs = snapshot.val().LikedSongs;
                    let setTheme = snapshot.val().AppTheme;
                    let setLikedPlaylists = snapshot.val().LikedPlaylists;
                    let setFollowedArtists = snapshot.val().FollowedArtists;
        
                    if(setFollowedArtists == undefined){
                        setFollowedArtists = "";
                    }
                    if(setLikedSongs == undefined){
                        setLikedSongs = "";
                    }
                    if(setLikedPlaylists === undefined){
                        setLikedPlaylists = "";
                    }
                    let likedSongsArray = setLikedSongs.split(',');
                    if(!likedSongsArray.includes(id)){
                        set(ref(realdb, "Users/"+currentUser.Username),
                        {
                            Username: setUsername,
                            Email: setEmail,
                            Password: setPassword,
                            Playlists: setPlaylists,
                            ProfilePhoto: setProfilePhoto,
                            LikedSongs: setLikedSongs + id + ",",
                            AppTheme: setTheme,
                            FollowedArtists: setFollowedArtists,
                            LikedPlaylists: setLikedPlaylists
                        })
                        .then(()=>{
                            if(likeBtn != undefined){
                                likeBtn.classList.add('likeBtnAnim');
                                setTimeout(() => {
                                    likeBtn.classList.remove('likeBtnAnim');
                                }, 400);
                            }
                            const likeSongBtn = document.getElementById("likeSongBtn");
                            const playerLikeBtn = document.getElementById("playerLikeBtn");
                            const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                            likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`;
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
                            ProfilePhoto: setProfilePhoto,
                            LikedSongs: likedSongsArray.toString(),
                            AppTheme: setTheme,
                            LikedPlaylists: setLikedPlaylists,
                            FollowedArtists: setFollowedArtists
                        })
                        .then(()=>{
                            if(likeBtn != undefined){
                                likeBtn.classList.add('likeBtnAnimDel');
                                setTimeout(() => {
                                    likeBtn.classList.remove('likeBtnAnimDel');
                                }, 400);
                            }
                            const likeSongBtn = document.getElementById("likeSongBtn");
                            const playerLikeBtn = document.getElementById("playerLikeBtn");
                            const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                            likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
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
        }else{
            openLoginPopup();
        }
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
                if(artistName.includes(artistNameDB)){
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

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let usersPlaylists = (snapshot.val().Playlists).split('{');
                numberOfPlaylists = usersPlaylists.length - 1;
    
                for (let i = numberOfPlaylists; i > 0; i--) {
                    if(usersPlaylists[i].split('}')[3]?.includes(',' + songId) || usersPlaylists[i].split('}')[3]?.includes(songId + ',')){
                        let currentLi =  `<li class="songItem" id="`+ usersPlaylists[i].split('}')[0] +`">
                            <div class="songInfo">
                                <img src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
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
                                <img src="`+ usersPlaylists[i].split('}')[2] +`" alt="playlistBanner">
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
    }else{
        
    }
}

// ----- ADDING SONG TO A SPECIFIC PLAYLIST

export function addSongToThisPlaylist(clickedPlaylist, songId, playlistId){
    if(!clickedPlaylist.children[2].classList.contains('greenCheck')){
        clickedPlaylist.children[2].children[0].innerHTML = '<i class="fa-solid fa-circle-check checkAnim"></i>';
        clickedPlaylist.children[2].classList.add('greenCheck');
        let setUsername,setEmail,setPassword,setPlaylists,setLikedSongs,setTheme;
        let newSetPlaylists = "";
        let setFollowedArtists, setProfilePhoto;

        let dbRef = ref(realdb);

        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                setUsername = snapshot.val().Username;
                setEmail = snapshot.val().Email;
                setPassword = snapshot.val().Password;
                setPlaylists = snapshot.val().Playlists;
                setLikedSongs = snapshot.val().LikedSongs;
                setTheme = snapshot.val().AppTheme;
                setProfilePhoto = snapshot.val().ProfilePhoto;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }

                let usersPlaylists = setPlaylists.split('{');

                for (let i = 0; i < usersPlaylists.length; i++) {
                    if(usersPlaylists[i].split('}')[0] == playlistId && i == (usersPlaylists.length-1)){
                        if(usersPlaylists[i].split('}')[3] != ""){
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + "," + songId + "}";
                        }else{
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + songId + "}";
                        }
                    }else if(usersPlaylists[i].split('}')[0] == playlistId && i != (usersPlaylists.length-1)){
                        if(usersPlaylists[i].split('}')[3] != ""){
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + "," + songId + "}" + "{";
                        }else{
                            newSetPlaylists += usersPlaylists[i].split('}')[0] + "}" + usersPlaylists[i].split('}')[1] + "}" + usersPlaylists[i].split('}')[2] + "}" + usersPlaylists[i].split('}')[3] + songId + "}" + "{";
                        }
                    }else{
                        if(i == (usersPlaylists.length-1)){
                            newSetPlaylists += usersPlaylists[i];
                        }else{
                            newSetPlaylists += usersPlaylists[i] + "{";
                        }
                    }
                }

                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    Password: setPassword,
                    Playlists: newSetPlaylists,
                    ProfilePhoto: setProfilePhoto,
                    LikedSongs: setLikedSongs,
                    AppTheme: setTheme,
                    FollowedArtists: setFollowedArtists,
                    LikedPlaylists: setLikedPlaylists
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

// ----- PLAYER LYRICS

export function turnLyrics(songId){
    isLyricsOn = true;
    const bigSongInfo = document.getElementsByClassName('bigSongInfo')[0];
    const playerLyrcis = document.getElementsByClassName('playerLyrcis')[0];
    const playerPageBar = document.getElementsByClassName('player')[0].children[1];
    let previousPBH2text = playerPageBar.children[1].innerHTML;
    let previousPBBonclick = playerPageBar.children[0].onclick;

    document.querySelector('.playerClickDiv2').classList.add('playerClickDiv2Lyrics');

    bigSongInfo.children[0].classList.add('playerBannerAway');
    setTimeout(() => {
        bigSongInfo.children[0].style.display = 'none';
        document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
    }, 450);
    bigSongInfo.children[3].style.display = 'none';

    playerPageBar.children[0].innerHTML = '<i class="fa-solid fa-xmark"></i>';
    let artistPB = bigSongInfo.children[3].children[0].children[1].innerHTML;

    playerLyrcis.style.display = 'block';
    playerLyrcis.scrollTop = 0;
    playerLyrcis.classList.remove('playerLyricsAway');
    setTimeout(() => {
        playerLyrcis.classList.add('playerLyrcisOn');
    }, 600);

    let dbRef = ref(realdb);

        get(child(dbRef, "Songs/"+songId)).then((snapshot)=>{
            if(snapshot.exists()){
                let LYRICS = snapshot.val().Lyrics;
                if(LYRICS != undefined){
                    playerLyrcis.innerHTML = LYRICS;
                }
            }
        })

    playerPageBar.children[0].onclick = () => {
        closePlayerLyrics(previousPBH2text, previousPBBonclick);
    }
}

export function doesSongHaveLyrics(songId, playedFrom){
    const playerLyricsBtn = document.getElementById('playerLyricsBtn');

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+songId)).then((snapshot)=>{
        if(snapshot.exists()){
            let LYRICS = snapshot.val().Lyrics;
            if(LYRICS == undefined || LYRICS == ""){
                playerLyricsBtn.classList.add("disabledBtn");
                if(isLyricsOn){
                    closePlayerLyrics2(playedFrom);
                }
            }else{
                playerLyricsBtn.classList.remove("disabledBtn");
                if(isLyricsOn){
                    turnLyrics(songId);
                }
            }
        }
    })
}

export function closePlayerLyrics(previousPBH2text, previousPBBonclick){
    if(isLyricsOn){
        const bigSongInfo = document.getElementsByClassName('bigSongInfo')[0];
        const playerLyrcis = document.getElementsByClassName('playerLyrcis')[0];
        const playerPageBar = document.getElementsByClassName('player')[0].children[1];

        document.querySelector('.playerClickDiv2').classList.remove('playerClickDiv2Lyrics');

        bigSongInfo.children[0].style.display = 'block';
        bigSongInfo.children[0].classList.remove('playerBannerAway');
        bigSongInfo.children[3].style.display = 'flex';

        playerLyrcis.classList.add('playerLyricsAway');
        playerLyrcis.classList.remove('playerLyrcisOn');
        setTimeout(() => {
            playerLyrcis.style.display = 'none';
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
        }, 450);

        playerPageBar.children[1].classList.remove("smallH2");
        playerPageBar.children[1].innerHTML = previousPBH2text;
        playerPageBar.children[0].onclick = previousPBBonclick;
        playerPageBar.children[0].innerHTML = '<i class="fa-solid fa-angle-down"></i>';

        isLyricsOn = false;
    }
}

function closePlayerLyrics2(playedFrom){
    if(isLyricsOn){
        const bigSongInfo = document.getElementsByClassName('bigSongInfo')[0];
        const playerLyrcis = document.getElementsByClassName('playerLyrcis')[0];
        const playerPageBar = document.getElementsByClassName('player')[0].children[1];

        document.querySelector('.playerClickDiv2').classList.remove('playerClickDiv2Lyrics');

        bigSongInfo.children[0].style.display = 'block';
        bigSongInfo.children[0].classList.remove('playerBannerAway');
        bigSongInfo.children[3].style.display = 'flex';

        playerLyrcis.classList.add('playerLyricsAway');
        playerLyrcis.classList.remove('playerLyrcisOn');
        setTimeout(() => {
            playerLyrcis.style.display = 'none';
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
        }, 450);

        playerPageBar.children[1].innerHTML = "Playing From " + `<span id="playingFromSpan">${playedFrom}</span>`;
        playerPageBar.children[1].classList.remove("smallH2");
        playerPageBar.children[0].onclick = () => {
            closeBigPlayer();
        };
        playerPageBar.children[0].innerHTML = '<i class="fa-solid fa-angle-down"></i>';

        isLyricsOn = false;
    }
}

// ----- THIS MONTHS FEATURE

function generateThisMonthsFeature(){
    let dbRef = ref(realdb);

    get(child(dbRef, "HomeFeatures/ThisMonthsArtist")).then((snapshot)=>{
        if(snapshot.exists()){
            let setArtistId = snapshot.val().ArtistId;
            let setSongId = snapshot.val().SongId;
            let setMonth = snapshot.val().Month;

            document.getElementsByClassName('thisMFSection')[0].innerHTML = `
            <h2 class="catTitle">This Months Feature</h2>
            <div class="thisMFDiv">
                <img onload="buttonClickAnim(this.parentElement)" id="artistMFBanner" src="images/CrimsonLogo.png" alt="artistFeatureBanner">
                <div id="MFArtistInfo">
                    
                </div>
            </div>
            `;

            get(child(dbRef, "Artists/"+setArtistId)).then((snapshot)=>{
                if(snapshot.exists()){
                    let artistName = snapshot.val().Artist;
                    let artistImage = snapshot.val().ImageURL;
                    let artistFollowers = snapshot.val().Followers;
                    let artistListens = snapshot.val().Listens;
                    let artistAboutImage = snapshot.val().AboutBanner;

                    document.querySelector('.thisMFDiv').addEventListener('click', () => {
                        openArtistPage(setArtistId, artistName, artistImage, artistFollowers, artistListens , artistAboutImage);
                    })

                    document.getElementById('artistMFBanner').src = artistImage;
                    document.getElementById('MFArtistInfo').innerHTML += `
                        <h2 id="MFArtistName">${artistName}</h2>
                        <h5 id="MFArtistFollowers">${artistFollowers + "&nbsp;Followers"}</h5>
                        <button onclick="clickEffect(this)">View Profile</button>
                        `;
                }
            })
        }
    })
}

// ----- DELETE PLAYLIST

const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
deletePlaylistBtn.addEventListener('click', () => {

    const playlistId = deletePlaylistBtn.getAttribute('data-playlist-id');
    const playlistNameP = deletePlaylistBtn.getAttribute('data-playlist-name');
    let newSetPlaylists = "";

    if (confirm(`Are you sure you want to delete: ${playlistNameP}?`) == true) {
        let dbRef = ref(realdb);

        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let setUsername = snapshot.val().Username;
                let setEmail = snapshot.val().Email;
                let setLikedSongs = snapshot.val().LikedSongs;
                let setPassword = snapshot.val().Password;
                let setPlaylists = snapshot.val().Playlists;
                let setProfilePhoto = snapshot.val().ProfilePhoto;
                let setTheme = snapshot.val().AppTheme;
                let setFollowedArtists = snapshot.val().FollowedArtists;
                let setLikedPlaylists = snapshot.val().LikedPlaylists;
                setFollowedArtists = snapshot.val().FollowedArtists;
                if(setFollowedArtists == undefined){
                    setFollowedArtists = "";
                }
                if(setLikedSongs == undefined){
                    setLikedSongs = "";
                }
                if(setLikedPlaylists == undefined){
                    setLikedPlaylists = "";
                }
                if(setPlaylists == undefined){
                    setPlaylists = "";
                }

                let usersPlaylists = setPlaylists.split('{');

                for (let i = 0; i < usersPlaylists.length; i++) {
                    if(usersPlaylists[i].split('}')[0] != playlistId){
                        if(i == (usersPlaylists.length-1)){
                            newSetPlaylists += usersPlaylists[i];
                        }else{
                            newSetPlaylists += usersPlaylists[i] + "{";
                        }
                    }
                }

                newSetPlaylists = newSetPlaylists.slice(0, -1);

                set(ref(realdb, "Users/"+currentUser.Username),
                {
                    Username: setUsername,
                    Email: setEmail,
                    Password: setPassword,
                    Playlists: newSetPlaylists,
                    ProfilePhoto: setProfilePhoto,
                    LikedSongs: setLikedSongs,
                    AppTheme: setTheme,
                    FollowedArtists: setFollowedArtists,
                    LikedPlaylists: setLikedPlaylists
                })
                .then(()=>{
                    LoadUserPlaylists();
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    } else {
        
    }
})

// ----- EDIT PLAYLIST

const editPlaylistBtn = document.getElementById('editPlaylistBtn');
editPlaylistBtn.addEventListener('click', () => {

    const playlistIdP = editPlaylistBtn.getAttribute('data-playlist-id');
    const playlistNameP = editPlaylistBtn.getAttribute('data-playlist-name');
    const playlistBannerP = editPlaylistBtn.getAttribute('data-playlist-banner');
    const playlistSongsP = editPlaylistBtn.getAttribute('data-playlist-songs');
    let newSetPlaylists = "";

    closePopup();
    OpenMakePlaylistScreen(true, playlistIdP, playlistNameP, playlistBannerP, playlistSongsP);
})

const saveAccountBtn = document.getElementById('saveAccount');
saveAccountBtn .addEventListener('click', (e) => {
    e.preventDefault();

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setProfilePhoto = snapshot.val().ProfilePhoto;
            let setTheme = snapshot.val().AppTheme;
            let setFollowedArtists = snapshot.val().FollowedArtists;
            let setLikedPlaylists = snapshot.val().LikedPlaylists;
            setFollowedArtists = snapshot.val().FollowedArtists;
            if(setFollowedArtists == undefined){
                setFollowedArtists = "";
            }
            if(setLikedSongs == undefined){
                setLikedSongs = "";
            }
            if(setLikedPlaylists == undefined){
                setLikedPlaylists = "";
            }
            if(setPlaylists == undefined){
                setPlaylists = "";
            }

            let newProfilePhoto = document.querySelector('.accPhotoWrapper').children[0].getAttribute('data-photo-id');
            if(newProfilePhoto == undefined || newProfilePhoto == null){
                newProfilePhoto = setProfilePhoto;
            }

            set(ref(realdb, "Users/"+currentUser.Username),
            {
                Username: setUsername,
                Email: setEmail,
                Password: setPassword,
                Playlists: setPlaylists,
                ProfilePhoto: newProfilePhoto,
                LikedSongs: setLikedSongs,
                AppTheme: setTheme,
                FollowedArtists: setFollowedArtists,
                LikedPlaylists: setLikedPlaylists
            })
            .then(()=>{
                alert("Successfully saved the profile!");
                reloadUserPhotoAndUsername();
            })
            .catch((error)=>{
                alert("error "+error);
            })
        }
    })
})

// ----- BUG REPORTING

const bugReportForm = document.querySelector('.bugReportForm');
bugReportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let bugSubject = document.getElementById('bugSubject').value;
    let bugDescription = document.getElementById('bugDescription').value;
    if(bugDescription.length < 10){
        alert('Description is too short. Describe the issue a bit more!');
    }else{
        let dbRef = ref(realdb);

        get(child(dbRef, "BugReports/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){

                let setBugs = snapshot.val().Bugs;
                let bugsLength = setBugs.split('{').length;
                if(setBugs == null || setBugs == undefined){
                    setBugs = "";
                }
                bugsLength++;
                
                let setBugsNew = setBugs + "{" + bugsLength + "}" + bugSubject + "}" + bugDescription + "}";
                if(setBugsNew.length > 10000){
                    setBugsNew = "";
                }

                set(ref(realdb, "BugReports/"+currentUser.Username),
                {
                    Bugs: setBugsNew
                })
                .then(()=>{
                    alert('Bug submitted. Thank you!');
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }else{
                let setBugs = 1 + "}" + bugSubject + "}" + bugDescription + "}";
    
                set(ref(realdb, "BugReports/"+currentUser.Username),
                {
                    Bugs: setBugs
                })
                .then(()=>{
                    alert('Bug submitted. Thank you!');
                })
                .catch((error)=>{
                    alert("error "+error);
                })
            }
        })
    }
});

// ----- APP LOADING

async function loadApp(){
    let result = await loadAppNumbers();

    generateSongs();
    generateArtists();
    generatePlaylists();
    generateCategories();
    generateThisMonthsFeature();
    RegToLog();
    // Removing the loader after init
    // document.querySelector('.loaderWrapper').classList.add('displayNone');

    LoadUserPlaylists();
    LoadLikedPlaylists();
    LoadUserFArtists();
}

// ----- CALLING ALL NECESSARY FUNCTIONS

getUsername();
seeIfUserIsSignedIn();
loadApp();