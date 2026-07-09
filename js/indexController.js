import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js';
import { getDatabase, ref, set, child, get, update, remove, onValue, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';

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
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
const auth = getAuth(app);

const realdb = getDatabase();

function getRecordImage(record, baseField, size = "large", fallback = ""){
    if(!record){
        return fallback;
    }

    const suffix = size === "small" ? "Small" : size === "original" ? "Original" : "Large";
    return record[`${baseField}${suffix}`] || record[baseField] || record[`${baseField}Original`] || fallback;
}

function getSongImage(record, size = "large"){
    return getRecordImage(record, "ImgURL", size, "images/defaultSong.webp");
}

function getArtistImage(record, size = "large"){
    return getRecordImage(record, "ImageURL", size, "images/defaultArtist.webp");
}

function getArtistAboutImage(record, size = "large"){
    return getRecordImage(record, "AboutBanner", size, getArtistImage(record, size));
}

function getPlaylistImage(record, size = "large"){
    return getRecordImage(record, "Banner", size, "images/defaultPlaylist.webp");
}

function getCategoryImage(record, size = "large"){
    return getRecordImage(record, "Banner", size, "images/defaultPlaylist.webp");
}

window.crimsonGetSongById = async function(songId){
    const dbRef = ref(realdb);
    const snapshot = await get(child(dbRef, "Songs/"+songId));

    if(!snapshot.exists()){
        return null;
    }

    return {
        songURL: snapshot.val().SongURL,
        title: snapshot.val().SongName,
        creator: snapshot.val().Creator,
        image: getSongImage(snapshot.val(), "large"),
        imageSmall: getSongImage(snapshot.val(), "small"),
        color: snapshot.val().Color
    };
}

const relatedSongCache = new Map();

function getRelatedTokens(record){
    return String(record?.Categories || record?.Category || record?.Genre || "")
        .toLowerCase()
        .split(/[,|/{}]+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

window.crimsonGetRelatedSongs = async function(currentSong, limit = 8){
    const currentId = String(currentSong?.id || "");
    if(!currentId){
        return [];
    }
    if(relatedSongCache.has(currentId)){
        return relatedSongCache.get(currentId);
    }

    const request = get(child(ref(realdb), "Songs")).then((snapshot) => {
        const records = snapshot.val() || {};
        const currentRecord = records[currentId] || {};
        const currentCreator = String(currentRecord.Creator || currentSong.creator || "").trim().toLowerCase();
        const currentTokens = new Set(getRelatedTokens(currentRecord));

        return Object.entries(records)
            .filter(([id, record]) => id !== currentId && record?.SongURL && record?.SongName)
            .map(([id, record]) => {
                const creator = String(record.Creator || "").trim().toLowerCase();
                const sharedTokens = getRelatedTokens(record).filter((token) => currentTokens.has(token));
                const sameCreator = !!currentCreator && creator === currentCreator;
                const score = (sameCreator ? 1000 : 0) + (sharedTokens.length * 120) + (Number(id) % 97) / 100;

                return {
                    id: String(id),
                    url: record.SongURL,
                    title: record.SongName,
                    creator: record.Creator || "Unknown artist",
                    image: getSongImage(record, "large"),
                    imageSmall: getSongImage(record, "small"),
                    color: record.Color || "#1c1625",
                    reason: sameCreator ? "Artist" : (sharedTokens.length ? "Similar vibe" : "For you"),
                    score
                };
            })
            .sort((first, second) => second.score - first.score)
            .slice(0, limit);
    }).catch((error) => {
        relatedSongCache.delete(currentId);
        throw error;
    });

    relatedSongCache.set(currentId, request);
    return request;
}

window.crimsonLoadLyricsIntoPlayerPopup = async function(songId){
    const lyricsBody = document.getElementById("queueLyricsBody");
    if(!lyricsBody){
        return;
    }

    const requestedId = String(songId);
    lyricsBody.dataset.lyricsSongId = requestedId;
    lyricsBody.innerHTML = "<p class=\"playerPopupLoading\">Loading lyrics...</p>";

    const dbRef = ref(realdb);
    const snapshot = await get(child(dbRef, "Songs/"+songId));

    if(lyricsBody.dataset.lyricsSongId !== requestedId){
        return;
    }

    if(snapshot.exists() && snapshot.val().Lyrics){
        const lines = String(snapshot.val().Lyrics)
            .replace(/<br\s*\/?\s*>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .split(/\r?\n/);
        const lyricFragment = document.createDocumentFragment();
        lines.forEach((line, index) => {
            const lyricLine = document.createElement("p");
            lyricLine.className = "playerPopupStaggerLine";
            lyricLine.style.setProperty("--player-popup-item-index", index);
            lyricLine.textContent = line || " ";
            lyricFragment.appendChild(lyricLine);
        });
        lyricsBody.replaceChildren(lyricFragment);
    }else{
        lyricsBody.innerHTML = "<p class=\"playerPopupLoading\">No lyrics available for this song.</p>";
    }
    lyricsBody.scrollTo(0, 0);
}

function loadAppNumbers(){
    return new Promise(resolve => {
        onValue(ref(realdb, 'Songs/'), (snapshot) => {
            const data = snapshot.val();
            brojPesama = data.length - 1;
            window.crimsonSongCount = brojPesama;

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
const googleLoginBtn = document.getElementById('googleLoginBtn');

let accountNames = document.getElementsByName('accountName');
let accountEmails = document.getElementsByName('accountEmail');
let accountPhotos = document.getElementsByName('profilePhoto');
const profilePhotoUpload = document.getElementById('profilePhotoUpload');
let accountUsername;
let accountEmail;
let profilePhoto;
export let accountTheme = "Dark";

let loggedIn = false;

let currentUser;
let selectedProfilePhotoFile = null;

function isEmptyOrSpaces(str){
    return str == null || str.match(/^ *$/) !== null;
}

function getProfilePhotoSrc(photoValue){
    if(!photoValue){
        return "images/profiles/1.png";
    }
    photoValue = String(photoValue);
    if(photoValue.startsWith("http") || photoValue.startsWith("blob:") || photoValue.startsWith("data:") || photoValue.includes("/")){
        return photoValue;
    }
    return `images/profiles/${photoValue}.png`;
}

function setAccountPhotoSrc(photoValue){
    const photoSrc = getProfilePhotoSrc(photoValue);
    accountPhotos.forEach((photo) => {
        photo.src = photoSrc;
    });

    const editablePhoto = document.querySelector('.accPhotoWrapper img');
    if(editablePhoto){
        editablePhoto.setAttribute('data-photo-url', photoValue || "1");
        editablePhoto.removeAttribute('data-photo-id');
        editablePhoto.removeAttribute('data-photo-upload');
    }
}

function getSafeFileName(file){
    const extension = GetFileExt(file).toLowerCase();
    const baseName = GetFileName(file).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "profile-photo";
    return `${baseName}-${Date.now()}${extension}`;
}

function uploadProfilePhoto(file){
    return new Promise(resolve => {
        if(!file){
            resolve(null);
            return;
        }

        const storage = getStorage();
        const storageRef = sRef(storage, `ProfilePhotos/${currentUser.Username}/${getSafeFileName(file)}`);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        uploadTask.on('state-changed', () => {},
        (error) => {
            alert("Profile photo failed to upload: " + error.message);
            resolve(null);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
            });
        });
    });
}

if(profilePhotoUpload){
    profilePhotoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file){
            return;
        }
        if(!file.type.startsWith("image/")){
            alert("Please choose an image file.");
            profilePhotoUpload.value = "";
            return;
        }
        if(file.size > 3 * 1024 * 1024){
            alert("Profile photo has to be under 3MB.");
            profilePhotoUpload.value = "";
            return;
        }

        selectedProfilePhotoFile = file;
        const previewUrl = URL.createObjectURL(file);
        const editablePhoto = document.querySelector('.accPhotoWrapper img');
        editablePhoto.src = previewUrl;
        editablePhoto.setAttribute('data-photo-upload', 'true');
        editablePhoto.removeAttribute('data-photo-id');
        editablePhoto.removeAttribute('data-photo-url');
        document.querySelector('.photoPicker').classList.add('displayNone');
        document.querySelector('.presetPhotoGrid').classList.add('displayNone');
        window.dispatchEvent(new CustomEvent('profilePhotoPickerClosed'));
    });

    window.addEventListener('profilePresetSelected', () => {
        selectedProfilePhotoFile = null;
        profilePhotoUpload.value = "";
    });
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
            const newUser = createDefaultUser(username.value, email.value);
            newUser.Password = encPass();

            set(ref(realdb, "Users/"+username.value),
            newUser)
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

function createDefaultUser(usernameValue, emailValue, authUser = null){
    return {
        Username: usernameValue,
        Email: emailValue,
        Password: "",
        Playlists: "",
        ProfilePhoto: "1",
        LikedSongs: "",
        AppTheme: "Dark",
        FollowedArtists: "",
        LikedPlaylists: "",
        AuthProvider: authUser ? "google" : "password",
        GoogleUid: authUser ? authUser.uid : ""
    };
}

// Encrypt the password using AES

function encPass(){
    let pass12 = CryptoJS.AES.encrypt(password.value, password.value);
    return pass12.toString();
}

// Call the register user on click
registerBtn.addEventListener('click', RegisterUser);
loginBtn.addEventListener('click', AuthenticateUser);
googleLoginBtn.addEventListener('click', SignInWithGoogle);

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

function sanitizeGoogleUsername(authUser){
    const rawName = authUser.displayName || (authUser.email ? authUser.email.split("@")[0] : "crimsonuser");
    const baseName = rawName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 18) || "crimsonuser";
    return baseName.length >= 4 ? baseName : `${baseName}${authUser.uid.slice(0, 4)}`;
}

function getFirstSnapshotValue(snapshot){
    let foundUser = null;
    snapshot.forEach((childSnapshot) => {
        if(!foundUser){
            foundUser = childSnapshot.val();
        }
    });
    return foundUser;
}

async function ensureGoogleUser(authUser){
    const usersRef = ref(realdb, "Users");
    const existingGoogleUserSnapshot = await get(query(usersRef, orderByChild("GoogleUid"), equalTo(authUser.uid)));
    const existingGoogleUser = getFirstSnapshotValue(existingGoogleUserSnapshot);

    if(existingGoogleUser){
        return existingGoogleUser;
    }

    const baseUsername = sanitizeGoogleUsername(authUser);
    let nextUsername = baseUsername;
    let usernameSnapshot = await get(child(ref(realdb), "Users/"+nextUsername));

    if(usernameSnapshot.exists() && usernameSnapshot.val().GoogleUid !== authUser.uid){
        nextUsername = `${baseUsername}${authUser.uid.slice(0, 6)}`;
        usernameSnapshot = await get(child(ref(realdb), "Users/"+nextUsername));
    }

    if(usernameSnapshot.exists()){
        return usernameSnapshot.val();
    }

    const newUser = createDefaultUser(nextUsername, authUser.email || "", authUser);
    await set(ref(realdb, "Users/"+nextUsername), newUser);
    return newUser;
}

async function handleGoogleCredential(authUser){
    const user = await ensureGoogleUser(authUser);
    loginUser(user);
    LoadUserPlaylists();
    LoadLikedPlaylists();
    LoadUserFArtists();
}

async function SignInWithGoogle(){
    try{
        const result = await signInWithPopup(auth, provider);
        await handleGoogleCredential(result.user);
    }catch(error){
        if(error.code === "auth/popup-blocked"){
            await signInWithRedirect(auth, provider);
            return;
        }
        if(error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request"){
            return;
        }
        alert("Google login failed: " + error.message);
    }
}

getRedirectResult(auth)
.then((result) => {
    if(result && result.user){
        handleGoogleCredential(result.user);
    }
})
.catch((error) => {
    alert("Google login failed: " + error.message);
});

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
            let setProfilePhoto = snapshot.val().ProfilePhoto || "1";
            setAccountPhotoSrc(setProfilePhoto);
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
    setAccountPhotoSrc(profilePhoto);
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

let songToBePlayed,songTitle,songCreator,imageURL,imageURLSmall,songColor;

let recSongs = document.getElementById("recSongs");

function GenerateOneSong(songName){
    let name = songName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Songs/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            songToBePlayed = snapshot.val().SongURL;
            songTitle  = snapshot.val().SongName;
            songCreator = snapshot.val().Creator;
            imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
            songColor = snapshot.val().Color;
            let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img onError="noStorage()" src="`+imageURLSmall+`" alt="songBanner">
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
let artistImage,artistImageSmall,artistFollowers,artistListens,artistAboutImage;
let recArtists = document.getElementsByClassName("recArtists")[0];

function GetArtists(artistName){
    let name = artistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "Artists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            artistName = snapshot.val().Artist;
            artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
            artistFollowers = snapshot.val().Followers;
            artistListens = snapshot.val().Listens;
            artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
            let currentImg =  `<li id="song`+ name +`" class="artistItem" onclick="openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img onload="buttonClickAnim(this.parentElement)" src="`+ artistImageSmall +`" alt="artistImage">
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
let playlistBanner,playlistBannerSmall,playlistLikes,playlistSongs,playlistArtists,playlistOwners;
let recPlaylists = document.getElementsByClassName("recPlaylists")[0];

function GetPlaylists(playlistName){
    let name = playlistName;

    let dbRef = ref(realdb);

    get(child(dbRef, "PublicPlaylists/"+name)).then((snapshot)=>{
        if(snapshot.exists()){
            let currentLi = "";

            playlistName = snapshot.val().Title;
            playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
            playlistLikes = snapshot.val().Likes;
            playlistSongs = snapshot.val().Songs;
            playlistArtists = snapshot.val().Artists;
            playlistOwners = snapshot.val().Owners;

            if(playlistOwners != "..Crimson.."){
                currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
                    <h3>`+ playlistName +`</h3>
                    <h5>`+ playlistArtists +`</h5>
                </li>`;
            }else{
                currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div>
                        <img onload="buttonClickAnim(this.parentElement.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
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
        window.crimsonSaveSearchHistory?.("search", searchedText);

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
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem songItemSearch" onclick="clickEffect(this)">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
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
                artistImage = getArtistImage(snapshot.val(), "large");
                artistImageSmall = getArtistImage(snapshot.val(), "small");
                artistFollowers = snapshot.val().Followers;
                artistListens = snapshot.val().Listens;
                artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
                let currentLi = `<li class="artistItemSearch" onclick="clickEffect(this); openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`'); clickEffect(this);">
                                    <div>
                                        <img  src="`+ artistImageSmall +`" alt="artistImage">
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
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItemSearch" onclick="clickEffect(this); openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                    <div class="playlistItemHolder">
                        <img  src="`+ playlistBannerSmall +`" alt="playlistBanner">
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

function renderCategoryCard(record){
    if(!record){
        return "";
    }

    const categoryName = record.Name || "Category";
    const categoryColor = record.Color || "#3c2368";
    const categoryBanner = getCategoryImage(record, "large");
    return `<button class="catItem" type="button" style="--category-color: ${categoryColor}" onclick="clickEffect(this); openCategoryPage('${categoryName}', '${categoryColor}', '${categoryBanner}')">
        <img class="categoryArtwork" src="${categoryBanner}" alt="" loading="lazy">
        <span class="categoryTint"></span>
        <h3>${categoryName}</h3>
        <span class="categoryCardArrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
    </button>`;
}

async function GetCategories(name){
    const dbRef = ref(realdb);
    const [firstSnapshot, secondSnapshot] = await Promise.all([
        get(child(dbRef, "Categories/"+name)),
        get(child(dbRef, "Categories/"+(name + 1)))
    ]);
    const firstCard = firstSnapshot.exists() ? renderCategoryCard(firstSnapshot.val()) : "";
    const secondCard = secondSnapshot.exists() ? renderCategoryCard(secondSnapshot.val()) : "";
    return (firstCard || secondCard)
        ? `<li class="catItems" style="--cat-row-index: ${Math.floor((name - 1) / 2)}">${firstCard}${secondCard}</li>`
        : "";
}

async function generateCategories(){
    const categoryIds = [];
    for(let i = 1; i < brojKategorija; i += 2){
        categoryIds.push(i);
    }

    const categoryRows = await Promise.all(categoryIds.map(GetCategories));
    categoriesList.innerHTML = categoryRows.filter(Boolean).join("");
    if(document.querySelector(".searchScreen.activeMain")){
        window.crimsonAnimateSearchCategories?.();
    }
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
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                playlistArtists = snapshot.val().Artists;
                let currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
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
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
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
    artistSongs.setAttribute("name", artistName);

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
    document.getElementsByClassName("latestRelease")[0].setAttribute("name", artistName);
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
                    artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                    artistFollowers = snapshot.val().Followers;
                    artistListens = snapshot.val().Listens;
                    artistAImage = getArtistAboutImage(snapshot.val(), "large");
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
                            let artistFollowers = snapshot.val().Followers;
    
                            if(!isArtistFollowed){
                                update(ref(realdb, "Artists/"+artistId), {
                                    Followers: String(Number(artistFollowers)+1)
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Unfollow`;
                                    window.crimsonPlayfulBurst?.(followArtistBtn, "follow");
                                })
                                .catch((error)=>{
                                    alert("error "+error);
                                })
                            }else{
                                update(ref(realdb, "Artists/"+artistId), {
                                    Followers: String(Number(artistFollowers)-1)
                                })
                                .then(()=>{
                                    // LoadUserFArtists();
                                    followArtistBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Follow`;
                                    window.crimsonPlayfulBurst?.(followArtistBtn, "unfollow");
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
                        imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                        songColor = snapshot.val().Color;
                        latestReleaseLi =  `<li class="songItem">
                            <div class="songInfo">
                                <div class="songVisualizer">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <img src="`+imageURLSmall+`" alt="songBanner">
                                <div class="songText">
                                    <h2>`+ songTitle +`</h2>
                                    <h3>`+ songCreator +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ i +`');"></div>
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
                playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                playlistLikes = snapshot.val().Likes;
                playlistSongs = snapshot.val().Songs;
                let currentLi =  `<li class="playlistItem" onclick="openPlaylistPage(`+ name +`,'`+ playlistName +`','`+ playlistBanner +`','`+ playlistLikes +`','`+ playlistSongs +`');">
                <img onload="buttonClickAnim(this.parentElement)" src="`+ playlistBannerSmall +`" alt="playlistBanner">
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
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                    <div class="songInfo">
                        <div class="songVisualizer">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <img src="`+imageURLSmall+`" alt="songBanner">
                        <div class="songText">
                            <h2>`+ songTitle +`</h2>
                            <h3>`+ songCreator +`</h3>
                        </div>
                    </div>
                    <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
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
    playlistSongsList.setAttribute("name", pName);
    document.getElementById("editOwnedPlaylistBtn").style.display = "none";

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
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURLSmall+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
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
                        window.crimsonPlayfulBurst?.(likePlaylistBtn, "like");
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
                        window.crimsonPlayfulBurst?.(likePlaylistBtn, "unlike");
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
            imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
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
    if(document.getElementById("submitMakePlaylist").disabled){
        return;
    }

    try{
        setMakePlaylistLoading(true, isEditingPlaylist() ? "Saving playlist..." : "Creating playlist...");
        let result = await UploadProcess();

        if(result){
            await DBMakePl();
        }
    }catch(error){
        alert("error " + error);
        setMakePlaylistLoading(false);
    }
}

let currentMakePlaylistName = document.querySelector('.currentMakePlaylistName');
function isEditingPlaylist(){
    return document.querySelector('.makePlaylistScreen').children[0].children[0].children[1].innerHTML == "Edit Playlist";
}

function setMakePlaylistLoading(isLoading, text){
    const form = document.querySelector('.makePlaylistForm');
    const button = document.getElementById("submitMakePlaylist");
    const statusText = document.getElementById("makePlaylistStatusText");
    const editing = isEditingPlaylist();

    form.classList.toggle("makePlaylistSubmitting", isLoading);
    button.disabled = isLoading;
    button.value = isLoading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create");

    if(statusText != null && text != undefined){
        statusText.innerHTML = text;
    }
}

function shouldDeleteStorageImage(url){
    return url != undefined && url != null && url != "" && !url.includes("defaultPlaylist.webp") && (url.includes("firebasestorage.googleapis.com") || url.startsWith("gs://"));
}

function deleteReplacedPlaylistCover(oldUrl, newUrl){
    if(!shouldDeleteStorageImage(oldUrl) || oldUrl == newUrl){
        return;
    }

    try{
        deleteObject(sRef(getStorage(), oldUrl)).catch(() => {});
    }catch(error){}
}

function closeMakePlaylistAfterSave(){
    if(typeof window.CloseMakePlaylistScreen == "function"){
        window.CloseMakePlaylistScreen();
    }
}

async function DBMakePl(){
    const dbRef = ref(realdb);
        if(currentUser == undefined){
            setMakePlaylistLoading(false);
            return;
        }
        if(currentUser != undefined && !isEditingPlaylist()){
            await get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
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
                    if(setPlaylists == undefined){
                        setPlaylists = "";
                    }

                    const newPlaylistId = numberOfPlaylists + 1;
                    const newPlaylistName = currentMakePlaylistName.innerHTML;
        
                    return set(ref(realdb, "Users/"+currentUser.Username),
                    {
                        Username: setUsername,
                        Email: setEmail,
                        LikedSongs: setLikedSongs,
                        Password: setPassword,
                        Playlists: (setPlaylists + "{" + newPlaylistId + "}" + newPlaylistName + "}" + imageDownload + "}}"),
                        ProfilePhoto: setProfilePhoto,
                        AppTheme: setTheme,
                        FollowedArtists: setFollowedArtists,
                        LikedPlaylists: setLikedPlaylists
                    })
                    .then(()=>{
                        setMakePlaylistLoading(false);
                        LoadUserPlaylists();
                        closeMakePlaylistAfterSave();
                        openMyPlaylistPage(newPlaylistId, newPlaylistName, imageDownload, "0", "");
                    })
                    .catch((error)=>{
                        setMakePlaylistLoading(false);
                        alert("error "+error);
                    })
                }else{
                    setMakePlaylistLoading(false);
                }
            })
        }
        else if(currentUser != undefined && isEditingPlaylist()){
            await get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
                if(snapshot.exists()){

                    let newSetPlaylists = "";
                    const editedPlaylistId = currentMakePlaylistName.getAttribute('data-playlist-id');
                    const editedPlaylistName = currentMakePlaylistName.innerHTML;
                    const editedPlaylistSongs = currentMakePlaylistName.getAttribute('data-playlist-songs') || "";
                    const oldPlaylistBanner = currentMakePlaylistName.getAttribute('data-playlist-banner') || "images/defaultPlaylist.webp";

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
                            if(usersPlaylists[i].split('}')[0] != editedPlaylistId){
                                newSetPlaylists += usersPlaylists[i];
                            }else{
                                newSetPlaylists += editedPlaylistId + "}" + editedPlaylistName + "}" + imageDownload + "}" + editedPlaylistSongs + "}";
                            }
                        }else{
                            if(usersPlaylists[i].split('}')[0] != editedPlaylistId){
                                newSetPlaylists += usersPlaylists[i] + "{";
                            }else{
                                newSetPlaylists += editedPlaylistId + "}" + editedPlaylistName + "}" + imageDownload + "}" + editedPlaylistSongs + "}" + "{";
                            }
                        }
                    }
    
                    return set(ref(realdb, "Users/"+currentUser.Username),
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
                        deleteReplacedPlaylistCover(oldPlaylistBanner, imageDownload);
                        setMakePlaylistLoading(false);
                        LoadUserPlaylists();
                        closeMakePlaylistAfterSave();
                        openMyPlaylistPage(editedPlaylistId, editedPlaylistName, imageDownload, "0", editedPlaylistSongs);
                    })
                    .catch((error)=>{
                        setMakePlaylistLoading(false);
                        alert("error "+error);
                    })
                }else{
                    setMakePlaylistLoading(false);
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
    yourPlaylists.innerHTML = `<li class="songItem favoritesLibraryItem" onclick="openLikedSongs();">
        <div class="songInfo">
            <img src="images/favorites.jpg" alt="playlistBanner">
            <div class="songText">
                <h2>Favorites</h2>
                <h3>Simply yours</h3>
            </div>
        </div>
    </li>`;

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
            artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
            artistFollowers = snapshot.val().Followers;
            artistListens = snapshot.val().Listens;
            artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
            let currentImg =  `<li id="song`+ name +`" class="artistItem" onclick="openArtistPage(`+ name +`,'`+ artistName +`','`+ artistImage +`','`+ artistFollowers +`','`+ artistListens +`','`+ artistAboutImage +`');">
            <img onload="buttonClickAnim(this.parentElement)" src="`+ artistImageSmall +`" alt="artistImage">
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
    playlistSongsList.setAttribute("name", pName);

        document.getElementById("playlistLikesH5").style.display = "none";
        document.getElementById("likePlaylist").style.display = "none";
        const editPlaylistBtn = document.getElementById("editOwnedPlaylistBtn");
        if(playlistID == 0 || pName == "Favorites"){
            editPlaylistBtn.style.display = "none";
        }else{
            editPlaylistBtn.style.display = "flex";
            editPlaylistBtn.onclick = () => {
                if(typeof window.OpenMakePlaylistScreen == "function"){
                    window.OpenMakePlaylistScreen(true, playlistID, pName, pBanner, pSongs);
                }
            };
        }

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
                        let playlistBanner = getPlaylistImage(snapshot.val(), "large");
            playlistBannerSmall = getPlaylistImage(snapshot.val(), "small");
                        let playlistLikes = snapshot.val().Likes;
                        let playlistSongs = snapshot.val().Songs;
                        let playlistArtists = snapshot.val().Artists;

                        let currentLi =  `<li class="songItem" id="`+ usersLikedPlaylists[i] +`">
                            <div class="songInfo">
                                <img  src="`+ playlistBannerSmall +`" alt="playlistBanner">
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
    if(!files || !files[0]){
        const fallbackCover = isEditingPlaylist() ? currentMakePlaylistName.getAttribute('data-playlist-banner') : "images/defaultPlaylist.webp";
        imageDownload = fallbackCover || "images/defaultPlaylist.webp";
        document.getElementById("imageUploadView").style.backgroundImage = `url("${imageDownload}")`;
        return;
    }

    let extension = GetFileExt(files[0]);
    let name = GetFileName(files[0]);

    imageFileName = name + extension;

    reader.readAsDataURL(files[0]);

    reader.onload = function () {
        document.getElementById("imageUploadView").style.backgroundImage = `url('`+ this.result +`')`;
    };
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
        files = imageInput.files;

        if(!files || !files[0]){
            imageDownload = isEditingPlaylist() ? (currentMakePlaylistName.getAttribute('data-playlist-banner') || "images/defaultPlaylist.webp") : "images/defaultPlaylist.webp";
            resolve(true);
            return;
        }

        var ImgToUpload = files[0];
        var ImgName = Date.now() + "-" + (imageFileName || ImgToUpload.name);

        const metaData = {
            contentType: ImgToUpload.type
        }

        const storage = getStorage();
        const storageRef = sRef(storage, "Playlists/"+ImgName);
        const UploadTask = uploadBytesResumable(storageRef, ImgToUpload, metaData);

        UploadTask.on('state-changed', (snapshot)=>{
            let progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setMakePlaylistLoading(true, "Uploading cover " + progress + "%...");
        },
        (error) =>{
            setMakePlaylistLoading(false);
            alert("Image failed to upload! " + error);
            resolve(false);
        },
        ()=>{
            getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
                imageDownload = downloadURL;
                resolve(true);
            });
        }
        );
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
                imageURL = getSongImage(snapshot.val(), "large");
            imageURLSmall = getSongImage(snapshot.val(), "small");
                songColor = snapshot.val().Color;
                let currentLI =  `<li class="songItem">
                <div class="songInfo">
                    <div class="songVisualizer">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <img src="`+imageURLSmall+`" alt="songBanner">
                    <div class="songText">
                        <h2>`+ songTitle +`</h2>
                        <h3>`+ songCreator +`</h3>
                    </div>
                </div>
                <div class="songClickDiv" onclick="playerSelectedSong('`+ songToBePlayed +`','`+ songTitle +`','`+ songCreator +`','`+ imageURL +`','`+ songColor +`','',this.parentElement,'`+ name +`');"></div>
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
    const requestedId = String(id);

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
                let likedSongsArray = setLikedSongs.split(',').filter(Boolean);
                window.crimsonLikedSongIds = new Set(likedSongsArray.map(String));
    
                const likeSongBtn = document.getElementById("likeSongBtn");
                const playerLikeBtn = document.getElementById("playerLikeBtn");
                const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
                const shouldUpdatePopup = likeSongBtn?.getAttribute("data-song-id") === requestedId;
    
                if(likedSongsArray.includes(requestedId)){
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    playerLikeBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
                    if(shouldUpdatePopup){
                        likeSongBtn.classList.remove("popupItemLoading");
                        likeSongBtn.innerHTML = `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`;
                    }
                }else{
                    miniPlayerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    playerLikeBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
                    if(shouldUpdatePopup){
                        likeSongBtn.classList.remove("popupItemLoading");
                        likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
                    }
                }
            }
        })
    }

    return true;
}

export function addSongToLiked(id, likeBtn){
    const dbRef = ref(realdb);
    const songId = String(id);
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
                    if(!likedSongsArray.includes(songId)){
                        window.crimsonLikedSongIds = window.crimsonLikedSongIds || new Set();
                        window.crimsonLikedSongIds.add(songId);
                        set(ref(realdb, "Users/"+currentUser.Username),
                        {
                            Username: setUsername,
                            Email: setEmail,
                            Password: setPassword,
                            Playlists: setPlaylists,
                            ProfilePhoto: setProfilePhoto,
                            LikedSongs: setLikedSongs + songId + ",",
                            AppTheme: setTheme,
                            FollowedArtists: setFollowedArtists,
                            LikedPlaylists: setLikedPlaylists
                        })
                        .then(()=>{
                            if(likeBtn != undefined){
                                window.crimsonPlayfulBurst?.(likeBtn, "like");
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
                        window.crimsonLikedSongIds = window.crimsonLikedSongIds || new Set();
                        window.crimsonLikedSongIds.delete(songId);
                        likedSongsArray = likedSongsArray.filter(function(item) {
                            return item !== songId;
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
                                window.crimsonPlayfulBurst?.(likeBtn, "unlike");
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
                let artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                let artistFollowers = snapshot.val().Followers;
                let artistListens = snapshot.val().Listens;
                let artistAboutImage = getArtistAboutImage(snapshot.val(), "large");
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
    popupMyPlaylists.innerHTML = `<li class="popupPlaylistLoading">Loading playlists...</li>`;

    let dbRef = ref(realdb);

    if(currentUser != undefined){
        get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
            if(snapshot.exists()){
                let usersPlaylists = (snapshot.val().Playlists || "").split('{');
                numberOfPlaylists = usersPlaylists.length - 1;
                const playlistRows = [];
    
                for (let i = numberOfPlaylists; i > 0; i--) {
                    const playlistParts = usersPlaylists[i].split('}');
                    const playlistId = playlistParts[0];
                    const playlistName = playlistParts[1];
                    const playlistBanner = playlistParts[2];
                    const playlistBannerSmall = playlistBanner;
                    const playlistSongs = playlistParts[3] || "";
                    const rowIndex = playlistRows.length;
                    if(!playlistId || !playlistName){
                        continue;
                    }

                    if(playlistSongs.split(',').includes(String(songId))){
                        playlistRows.push(`<li class="songItem popupPlaylistItem" style="--popup-item-index: `+ rowIndex +`" id="`+ playlistId +`">
                            <div class="songInfo">
                                <img src="`+ playlistBannerSmall +`" alt="playlistBanner">
                                <div class="songText">
                                    <h2>`+ playlistName +`</h2>
                                    <h3>`+ "by " + currentUser.Username +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ playlistId +`)"></div>
                            <div class="songBtns greenCheck playlistCanRemove">
                                <button class="playlistAddedMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-circle-check checkAnim"></i></button>
                                <button class="playlistRemoveMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-xmark checkAnim"></i></button>
                                <div class="greenSidePl"></div>
                            </div>
                        </li>`);
                    }else{
                        playlistRows.push(`<li class="songItem popupPlaylistItem" style="--popup-item-index: `+ rowIndex +`" id="`+ playlistId +`">
                            <div class="songInfo">
                                <img src="`+ playlistBannerSmall +`" alt="playlistBanner">
                                <div class="songText">
                                    <h2>`+ playlistName +`</h2>
                                    <h3>`+ "by " + currentUser.Username +`</h3>
                                </div>
                            </div>
                            <div class="songClickDiv" onclick="addSongToThisPlaylist(this.parentElement,`+ songId +`,`+ playlistId +`)"></div>
                            <div class="songBtns">
                                <button onclick="addSongToThisPlaylist(this.parentElement.parentElement,`+ songId +`,`+ playlistId +`)"><i class="fa-solid fa-plus checkAnim"></i></button>
                                <div class="greenSidePl"></div>
                            </div>
                        </li>`);
                    }
                }

                popupMyPlaylists.innerHTML = playlistRows.length ? playlistRows.join("") : `<li class="popupPlaylistLoading">No playlists yet.</li>`;
            }
        })
    }else{
        
    }
}

// ----- ADDING SONG TO A SPECIFIC PLAYLIST

export function addSongToThisPlaylist(clickedPlaylist, songId, playlistId){
    const actionBtns = clickedPlaylist.children[2];
    const isRemoving = actionBtns.classList.contains('greenCheck');
    const previousHTML = actionBtns.innerHTML;
    const previousClasses = actionBtns.className;

    if(isRemoving){
        actionBtns.innerHTML = '<button onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-plus checkAnim"></i></button><div class="greenSidePl"></div>';
        actionBtns.classList.remove('greenCheck', 'playlistCanRemove');
    }else{
        actionBtns.innerHTML = '<button class="playlistAddedMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-circle-check checkAnim"></i></button><button class="playlistRemoveMark" onclick="addSongToThisPlaylist(this.parentElement.parentElement,'+ songId +','+ playlistId +')"><i class="fa-solid fa-xmark checkAnim"></i></button><div class="greenSidePl"></div>';
        actionBtns.classList.add('greenCheck', 'playlistCanRemove');
    }

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then((snapshot)=>{
        if(snapshot.exists()){
            let setUsername = snapshot.val().Username;
            let setEmail = snapshot.val().Email;
            let setPassword = snapshot.val().Password;
            let setPlaylists = snapshot.val().Playlists;
            let setLikedSongs = snapshot.val().LikedSongs;
            let setTheme = snapshot.val().AppTheme;
            let setProfilePhoto = snapshot.val().ProfilePhoto;
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

            const songIdString = String(songId);
            const playlistIdString = String(playlistId);
            const usersPlaylists = setPlaylists.split('{');
            const newSetPlaylists = usersPlaylists.map((playlistString) => {
                const playlistParts = playlistString.split('}');
                if(playlistParts[0] !== playlistIdString || playlistParts.length < 4){
                    return playlistString;
                }

                const playlistSongs = (playlistParts[3] || "").split(',').filter(Boolean);
                const nextSongs = isRemoving
                    ? playlistSongs.filter((item) => item !== songIdString)
                    : playlistSongs.includes(songIdString) ? playlistSongs : playlistSongs.concat(songIdString);

                return playlistParts[0] + "}" + playlistParts[1] + "}" + playlistParts[2] + "}" + nextSongs.join(',') + "}";
            }).join('{');

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
                actionBtns.innerHTML = previousHTML;
                actionBtns.className = previousClasses;
                alert("error "+error);
            })
        }
    })
}

// ----- PLAYER LYRICS

export function turnLyrics(songId){
    isLyricsOn = true;
    if(typeof window.openPlayerPopup === "function"){
        window.openPlayerPopup("lyrics");
    }
    if(typeof window.crimsonLoadLyricsIntoPlayerPopup === "function"){
        window.crimsonLoadLyricsIntoPlayerPopup(songId);
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
                    window.crimsonLoadLyricsIntoPlayerPopup(songId);
                }
            }
        }
    })
}

export function closePlayerLyrics(previousPBH2text, previousPBBonclick){
    if(isLyricsOn){
        if(typeof window.closePlayerPopup === "function"){
            window.closePlayerPopup();
        }
        isLyricsOn = false;
    }
}

function closePlayerLyrics2(playedFrom){
    if(isLyricsOn){
        if(typeof window.closePlayerPopup === "function"){
            window.closePlayerPopup();
        }
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
                    let artistImage = getArtistImage(snapshot.val(), "large");
            artistImageSmall = getArtistImage(snapshot.val(), "small");
                    let artistFollowers = snapshot.val().Followers;
                    let artistListens = snapshot.val().Listens;
                    let artistAboutImage = getArtistAboutImage(snapshot.val(), "large");

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
saveAccountBtn .addEventListener('click', async (e) => {
    e.preventDefault();

    let dbRef = ref(realdb);

    get(child(dbRef, "Users/"+currentUser.Username)).then(async (snapshot)=>{
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

            const editablePhoto = document.querySelector('.accPhotoWrapper').children[0];
            let newProfilePhoto = editablePhoto.getAttribute('data-photo-id');

            if(editablePhoto.getAttribute('data-photo-upload') === 'true'){
                saveAccountBtn.value = "Uploading...";
                saveAccountBtn.classList.add('disabledBtn');
                const uploadedPhotoUrl = await uploadProfilePhoto(selectedProfilePhotoFile);
                saveAccountBtn.value = "Save";
                saveAccountBtn.classList.remove('disabledBtn');

                if(!uploadedPhotoUrl){
                    return;
                }

                newProfilePhoto = uploadedPhotoUrl;
                selectedProfilePhotoFile = null;
                if(profilePhotoUpload){
                    profilePhotoUpload.value = "";
                }
            }else if(newProfilePhoto == undefined || newProfilePhoto == null){
                newProfilePhoto = editablePhoto.getAttribute('data-photo-url');
            }

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
                editablePhoto.setAttribute('data-photo-url', newProfilePhoto);
                editablePhoto.removeAttribute('data-photo-id');
                editablePhoto.removeAttribute('data-photo-upload');
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
