setHomeScreen();

// Checking if the user is accessing from mobile
let regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = regexp.test(navigator.userAgent);

if (!isMobileDevice) {
    window.location.href = `https://crimsonmusicpc.netlify.app/`;
}

let brojPesama;
let brojArtista;
let brojPlejlista;
let brojKategorija = 14;

let isPerformanceModeOn = false;

/* ----- GET THE TIME ----- */

window.onload = getTime();
function getTime(){
    let d = new Date();
    let time = d.getHours();

    todEl = document.getElementsByName('timeOfDay');
    todEl2 = document.getElementById('timeOfDayNav');

    if (time < 12) {
        todEl.forEach((todel) => {
            todel.innerHTML = 'Good Morning';
        });
        todEl2.innerHTML = 'Good Morning';
    }
    if (time >= 12 && time < 18) {
        todEl.forEach((todel) => {
            todel.innerHTML = 'Good Afternoon';
        });
        todEl2.innerHTML = 'Good Afternoon';
    }
    if (time >= 18) {
        todEl.forEach((todel) => {
            todel.innerHTML = 'Good Evening';
    });
        todEl2.innerHTML = 'Good Evening';
    }
    
    // Setting current year in settings
    document.querySelector('.currentYear').innerHTML = d.getFullYear();
}

/* ----- SET APP MODE ----- */

function setAppPMode(){
    if (/windows phone/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
        turnPerformanceModeOn();
    }else{
        turnPerformanceModeOff();
    }
}

/* ----- SET SCREEN ----- */

let currentScreen = "homeScreen";
let lastOpenSideScreen;
let isLoaderOff = false;
let startTSDValue = 0;

function setScreen(screenToSet, clickedBtn, activeScreen){

    if(!isLoaderOff && (activeScreen == "searchScreen" || activeScreen == "yoursScreen")){
        document.querySelector('.loaderWrapper').classList.add('loaderOff');
    }

    if(currentScreen == activeScreen && currentScreen == "searchScreen"){
        document.getElementById('searchInput').focus();

        return;
    }

    if(!UserSignedIn() && activeScreen == "yoursScreen"){
        openLoginPopup();
        return;
    }

    closePlaylistPage();
    closeArtistPage();
    closeCategoryPage();
    closeLoginScreen();

    if(activeScreen == "yoursScreen"){
        resetSearchScreenToNormal();
    }

    if (activeScreen !== currentScreen) {
        let buttons = document.querySelectorAll("nav > button");
        buttons.forEach((button) => {
            button.classList.remove("activeScreen");
        });
        clickedBtn.classList.add("activeScreen");

        let mains = document.querySelectorAll("main");
        mains.forEach((main) => {
            main.classList.remove("activeMain");
        });

        currentScreen = activeScreen;
    }

    let activeMain = document.getElementsByClassName(activeScreen)[0];
    activeMain.classList.add("activeMain");

    if(activeScreen == "searchScreen"){
        let searchList = document.getElementsByClassName("searchList")[0];
        let searchInput = document.getElementById("searchInput");
        let header = document.querySelector('header');

        searchList.classList.remove("searchListOpen");
        searchList.innerHTML = "";
        searchInput.value = "";
        header.style.display = 'none';
    }else{
        let header = document.querySelector('header');
        
        header.style.display = 'flex';
    }
}

function setHomeScreen(){
    document.getElementsByClassName("homeScreen")[0].classList.add("activeMain");
}

/* ----- Button clicks ----- */

document.querySelectorAll("button").forEach((button) => {
    buttonClickAnim(button);
});

function buttonClickAnim(button){
    button.addEventListener('touchstart', () => {
        button.classList.add("buttonClicked");
    });
    button.addEventListener('touchend', () => {
        setTimeout(() => {
            button.classList.remove("buttonClicked");
        }, 100);
    });
}

function clickEffect(button){
    if(button !== undefined){
        buttonClickAnim(button);
    }
}

const monopToggle = document.getElementById('monopToggle');
let isMonopOn = false;
let lastPlayerColor;
monopToggle.addEventListener('click', () => {
    isMonopOn = monopToggle.checked;
    if(monopToggle.checked){
        document.querySelector('.miniPlayer').classList.remove('colorfulMiniPlayer');
        document.getElementsByClassName('songBackdrop')[0].style.display = 'none';
        lastPlayerColor = getComputedStyle(document.documentElement).getPropertyValue('--currentSongColorBig');
        document.documentElement.style.setProperty("--currentSongColorBig", 'rgb(28, 22, 37)');
    }else{
        document.querySelector('.miniPlayer').classList.add('colorfulMiniPlayer');
        if(!isPerformanceModeOn){
            document.getElementsByClassName('songBackdrop')[0].style.display = 'block';
        }
        document.documentElement.style.setProperty("--currentSongColorBig", lastPlayerColor);
    }
})

let reduceAnimations = false;

const redanimToggle = document.getElementById('redanimToggle');
redanimToggle.addEventListener('click', () => {
    if(redanimToggle.checked){
        const pageBars = document.getElementsByClassName('pageBar');
        for (let i = 0; i < pageBars.length; i++) {
            pageBars[i].classList.add('noAnimTransitions');
        }
        const mains = document.querySelectorAll('main');
        for (let i = 0; i < mains.length; i++) {
            mains[i].classList.add('noAnimTransitions');
        }
        document.querySelector('header').classList.add('noAnimTransitions');
        document.getElementById('mobileNav').classList.add('noAnimTransitions');

        document.getElementById('popupWrapper').classList.add('noAnimTransitions');
        document.getElementsByClassName('popupScreen')[0].classList.add('noAnimTransitions');

        document.getElementsByClassName('player')[0].classList.add('noAnimTransitions');
        document.getElementsByClassName('miniPlayer')[0].classList.add('noAnimTransitions');
        document.getElementsByClassName('bigSongInfo')[0].classList.add('noAnimTransitions');
        document.getElementsByClassName('bigControls')[0].classList.add('noAnimTransitions');

        document.querySelector('.categoryScreen').classList.add('noAnimTransitions');
        document.querySelector('.artistScreen').classList.add('noAnimTransitions');
        document.querySelector('.playlistScreen').classList.add('noAnimTransitions');
        document.querySelector('.makePlaylistScreen').classList.add('noAnimTransitions');
        document.querySelector('.loginScreen').classList.add('noAnimTransitions');
        document.querySelector('.bugReportScreen').classList.add('noAnimTransitions');
        document.querySelector('.LicenseAndProfileScreen').classList.add('noAnimTransitions');
        document.getElementsByClassName('loggedInScreen')[0].classList.add('noAnimTransitions');
        
        const h2s = document.querySelectorAll('h2');
        for (let i = 0; i < h2s.length; i++) {
            h2s[i].classList.add('noAnimTransitions');
        }

        const songItems = document.querySelectorAll('.songItem');
        for (let i = 0; i < songItems.length; i++) {
            songItems[i].classList.add('noAnimTransitions');
        }
        const artistItems = document.querySelectorAll('.artistItem');
        for (let i = 0; i < artistItems.length; i++) {
            artistItems[i].classList.add('noAnimTransitions');
        }
        const playlistItems = document.querySelectorAll('.playlistItem');
        for (let i = 0; i < playlistItems.length; i++) {
            playlistItems[i].classList.add('noAnimTransitions');
        }

        document.getElementById('searchBarYours').classList.add('noAnimTransitions');
        
        reduceAnimations = true;
    }else{
        const pageBars = document.getElementsByClassName('pageBar');
        for (let i = 0; i < pageBars.length; i++) {
            pageBars[i].classList.remove('noAnimTransitions');
        }
        const mains = document.querySelectorAll('main');
        for (let i = 0; i < mains.length; i++) {
            mains[i].classList.remove('noAnimTransitions');
        }
        document.querySelector('header').classList.remove('noAnimTransitions');
        document.getElementById('mobileNav').classList.remove('noAnimTransitions');

        document.getElementById('popupWrapper').classList.remove('noAnimTransitions');
        document.getElementsByClassName('popupScreen')[0].classList.remove('noAnimTransitions');

        document.getElementsByClassName('player')[0].classList.remove('noAnimTransitions');
        document.getElementsByClassName('miniPlayer')[0].classList.remove('noAnimTransitions');
        document.getElementsByClassName('bigSongInfo')[0].classList.remove('noAnimTransitions');
        document.getElementsByClassName('bigControls')[0].classList.remove('noAnimTransitions');

        document.querySelector('.categoryScreen').classList.remove('noAnimTransitions');
        document.querySelector('.artistScreen').classList.remove('noAnimTransitions');
        document.querySelector('.playlistScreen').classList.remove('noAnimTransitions');
        document.querySelector('.makePlaylistScreen').classList.remove('noAnimTransitions');
        document.querySelector('.loginScreen').classList.remove('noAnimTransitions');
        document.querySelector('.bugReportScreen').classList.remove('noAnimTransitions');
        document.querySelector('.LicenseAndProfileScreen').classList.remove('noAnimTransitions');
        document.getElementsByClassName('loggedInScreen')[0].classList.remove('noAnimTransitions');
        
        const h2s = document.querySelectorAll('h2');
        for (let i = 0; i < h2s.length; i++) {
            h2s[i].classList.remove('noAnimTransitions');
        }

        const songItems = document.querySelectorAll('.songItem');
        for (let i = 0; i < songItems.length; i++) {
            songItems[i].classList.remove('noAnimTransitions');
        }
        const artistItems = document.querySelectorAll('.artistItem');
        for (let i = 0; i < artistItems.length; i++) {
            artistItems[i].classList.remove('noAnimTransitions');
        }
        const playlistItems = document.querySelectorAll('.playlistItem');
        for (let i = 0; i < playlistItems.length; i++) {
            playlistItems[i].classList.remove('noAnimTransitions');
        }

        document.getElementById('searchBarYours').classList.remove('noAnimTransitions');

        reduceAnimations = false;
    }
})

const pmToggle = document.getElementById('pmToggle');
pmToggle.addEventListener('click', () => {
    if(pmToggle.checked){
        turnPerformanceModeOn();
    }else{
        turnPerformanceModeOff();
    }
})

function turnPerformanceModeOn(){
    document.documentElement.style.setProperty("--gmBackdrop", "none");
    document.documentElement.style.setProperty("--gmBackdropPlayer", "none");
    document.querySelector('.songBackdrop').style.display = 'none';
    pmToggle.checked = true;
    isPerformanceModeOn = true;
    redrawAppTheme();
}

function turnPerformanceModeOff(){
    document.documentElement.style.setProperty("--gmBackdrop", "blur(20px) brightness(1.2)");
    document.documentElement.style.setProperty("--gmBackdropPlayer", "brightness(0.5) blur(50px) saturate(2.5)");
    if(!isMonopOn){
        document.querySelector('.songBackdrop').style.display = 'block';
    }
    pmToggle.checked = false;
    isPerformanceModeOn = false;
    redrawAppTheme();
}

function redrawAppTheme(){

    let themePreferencee = window.matchMedia("(prefers-color-scheme: dark)");

    if(document.getElementById('lightThemeInput').checked){
        setLightTheme();
    }
    if(document.getElementById('darkThemeInput').checked){
        setDarkTheme();
    }
    if(document.getElementById('autoThemeInput').checked){
        setAutoTheme(themePreferencee);
    }

}

let nextSongBtn = 0,prevSongBtn = 0,currentSongBtn = 0;
let isAutoPlayOn = true;
let isShuffleOn = false;
const autoplayBtn = document.querySelector('#autoplayBtn');
autoplayBtn.addEventListener('click', () => {
    if (isAutoPlayOn) {
        autoplayBtn.classList.add('activeBtn');
        autoplayBtn.innerHTML = `AUTOPLAY OFF<i class="bi bi-collection-play-fill"></i>`;
        isAutoPlayOn = false;
    }else{
        autoplayBtn.classList.remove('activeBtn');
        autoplayBtn.innerHTML = `AUTOPLAY ON<i class="bi bi-collection-play-fill"></i>`;
        isAutoPlayOn = true;
    }
})

const backwardBtn = document.querySelector('#backward');
backwardBtn.addEventListener('click', () => {
    if(prevSongBtn != 0){
        prevSongBtn.children[1].click();
    }
})

const forwardBtn = document.querySelector('#forward');
forwardBtn.addEventListener('click', () => {
    if(isShuffleOn){
        PlayRandomSongShuffle();
    }else{
        if(nextSongBtn != 0){
            nextSongBtn.children[1].click();
        }
    }
})

const addToPlBtn = document.querySelector('#addToPlBtn');
addToPlBtn.addEventListener('click', addToPlFunc);

function addToPlFunc(){
    if(UserSignedIn()){
        popupScreen.classList.add("popupPl");
        LoadUserPlaylistsPopup(addToPlBtn.getAttribute('name'));
        this.removeEventListener('click', addToPlFunc);
        addToPlBtn.onclick = () => {};
    }else{
        openLoginPopup();
    }
}

const shuffleBtn = document.getElementById('shuffleBtn');
shuffleBtn.addEventListener('click', () => {
    isShuffleOn = !isShuffleOn;
    shuffleBtn.classList.toggle("buttonTurnedOn");
    if(isRepeatOn){
        isRepeatOn = false;
        repeatBtn.classList.toggle('buttonTurnedOn');
    }
})

/* ----- LOGIN SCREEN ----- */

function openLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    let buttons = document.querySelectorAll("nav > button");
    buttons.forEach((button) => {
        button.classList.remove("activeScreen");
    });
    document.querySelector('.settingsBtnNav').classList.add("activeScreen");

    loginScreen.classList.add("loginScreenOpen");
}

function closeLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    document.querySelector('.settingsBtnNav').classList.remove("activeScreen");
    if(currentScreen == "homeScreen"){
        document.querySelector('.HomeBtnNav').classList.add("activeScreen");
    }else if(currentScreen == "searchScreen"){
        document.querySelector('.SearchBtnNav').classList.add("activeScreen");
    }else if(currentScreen == "yoursScreen"){
        document.querySelector('.LibraryBtnNav').classList.add("activeScreen");
    }

    loginScreen.classList.remove("playerMovable");

    loginScreen.classList.remove("loginScreenOpen");
    setTimeout(() => {
        loginScreen.style.left = 'auto';
    }, 350);
}

/* ----- LicenseS SCREEN ----- */

function openLicenseAndProfileScreen(isLicenseScreen){
    let LicenseAndProfileScreen = document.getElementsByClassName("LicenseAndProfileScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    console.log(isLicenseScreen);
    if(isLicenseScreen){
        document.querySelector('.licensesSS').classList.remove('displayNone');
        document.querySelector('.profileSS').classList.add('displayNone');

        document.querySelector('.lapsTitle').innerHTML = 'Licenses';

    }else{
        document.querySelector('.licensesSS').classList.add('displayNone');
        document.querySelector('.profileSS').classList.remove('displayNone');

        document.querySelector('.lapsTitle').innerHTML = 'Profile';

        document.querySelector('.photoPicker').classList.add('displayNone');
        document.querySelector('.accPhotoWrapper').classList.remove('displayNone');

    }

    LicenseAndProfileScreen.classList.add("LicenseAndProfileScreenOpen");
}

function closeLicenseAndProfileScreen(){
    let LicenseAndProfileScreen = document.getElementsByClassName("LicenseAndProfileScreen")[0];

    LicenseAndProfileScreen.classList.remove("playerMovable");

    LicenseAndProfileScreen.classList.remove("LicenseAndProfileScreenOpen");
    setTimeout(() => {
        LicenseAndProfileScreen.style.left = 'auto';
    }, 350);
}

function openPhotoPicker(){
    document.querySelector('.photoPicker').classList.remove('displayNone');
    document.querySelector('.accPhotoWrapper').classList.add('displayNone');
}

function setPPSS(src){
    document.querySelector('.accPhotoWrapper').children[0].src = src;
    let photoId = src.split('.png')[0].slice(-1);

    document.querySelector('.accPhotoWrapper').children[0].setAttribute('data-photo-id', photoId);
    
    document.querySelector('.photoPicker').classList.add('displayNone');
    document.querySelector('.accPhotoWrapper').classList.remove('displayNone');
}

// Switch from register to login screen
function RegToLog(){
    const titles = document.getElementsByName("regLogTitle");
    const emailInput = document.getElementById("email");
    const alreadyAcc = document.getElementById("alreadtAcc");
    const registerBtn = document.getElementById("registerBtn");
    const loginBtn = document.getElementById("loginBtn");

    titles.forEach((title) => {
        title.innerHTML = "Login";
    });
    email.style.display = "none";
    alreadyAcc.innerHTML = `Don't have an account? <span class="highlightSpan" onclick="LogToReg()">Register here!</span>`;
    registerBtn.style.display = "none";
    loginBtn.style.display = "block";
}

function LogToReg(){
    let titles = document.getElementsByName("regLogTitle");
    let emailInput = document.getElementById("email");
    let alreadyAcc = document.getElementById("alreadtAcc");
    let registerGoogleBtn = document.getElementById("regGoogleBtn");

    titles.forEach((title) => {
        title.innerHTML = "Register";
    });
    email.style.display = "block";
    alreadyAcc.innerHTML = `Already have an account? <span class="highlightSpan" onclick="RegToLog()">Log in!</span>`;
    registerBtn.style.display = "block";
    loginBtn.style.display = "none";
}

/* ----- Set logged in screen ----- */

function setLoggedInScreen(){
    document.getElementsByClassName("loginForm")[0].style.display = "none";
    document.getElementsByClassName("loginCrimsonLogo")[0].style.display = "none";
    document.getElementsByClassName("loggedInScreen")[0].style.display = "flex";
    document.getElementsByName("regLogTitle")[0].innerHTML = "Settings";

}

function setLoggedOutScreen(){
    document.getElementsByClassName("loginForm")[0].style.display = "flex";
    document.getElementsByClassName("loggedInScreen")[0].style.display = "none";
    document.getElementsByName("regLogTitle")[0].innerHTML = "Register";
}

/* ----- PLAYER ----- */

let isPlayerOpen = false;
let isSongPaused = true;

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpenTop");
    player.classList.remove("playerOpen");
    player.style.top = 'auto';
    document.getElementsByTagName("nav")[0].classList.remove("navClosed");
    // Setting the opacity to 1 on main and header
    document.getElementsByClassName(currentScreen)[0].style.opacity = '1';
    document.querySelector('header').style.opacity = '1';
    document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
    isPlayerOpen = false;
}

const currentSongAudio = document.getElementById("currentSong");
let playingFrom = document.getElementById("playingFromSpan");

// PLAY THE SELECTED SONG

let isTheVaultOn = false;
let LastPlayedFromBtn;

function playerSelectedSong(songURL,songTitle,songCreator,imageURL,songColor,playedFrom,playedFromBtn,id){

    document.documentElement.style.setProperty("--currentSongColor", songColor);
    document.documentElement.style.setProperty("--currentSongColorBig", songColor);

    openMiniPlayer();

    if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
        LastPlayedFromBtn.classList.remove("songPlayingLi");
        LastPlayedFromBtn.classList.remove("songPlayingLiPaused");
    }

    currentSongAudio.autoplay = true;
    currentSongAudio.src = songURL;
    var playPromise = currentSongAudio.play();

    if (playPromise !== undefined) {
    playPromise.then(_ => {
        // Automatic playback started!
    })
    .catch(error => {
        // Auto-play was prevented
    });
    }

    let songBanners = document.getElementsByName("songBanner");
    let songTitles = document.getElementsByName("songTitle");
    let songArtists = document.getElementsByName("songArtist");

    let songPlayBtns = document.getElementsByName("songPlayButton");
    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-play");
        button.children[0].classList.add("fa-circle-pause");
    });
    isSongPaused = false;

    songBanners.forEach((banner) => {
        banner.src = imageURL;
    });
    songTitles.forEach((title) => {
        title.innerHTML = songTitle;
    });
    songArtists.forEach((artist) => {
        artist.innerHTML = songCreator;
    });

    playingFrom = document.getElementById("playingFromSpan");
    if(playedFrom != undefined){
        playingFrom.innerHTML = playedFrom;
    }else{
        playingFrom.innerHTML = playedFromBtn.parentElement.name;
        playedFrom = playedFromBtn.parentElement.name;
    }

    LastPlayedFromBtn = playedFromBtn;

    if(playedFromBtn != 0){
        let songList = playedFromBtn.parentElement;
        for (let i = 0; i < songList.children.length; i++) {
            songList.children[i].classList.remove("songPlayingLi");
            if(songList.children[i] == playedFromBtn){
                currentSongBtn = playedFromBtn;
                currentSongBtn.classList.add("songPlayingLi");
                nextSongBtn = songList.children[i+1] || 0;
                prevSongBtn = songList.children[i-1] || 0;
                if(prevSongBtn != 0){
                    prevSongBtn.classList.remove("songPlayingLi");
                }
            }
        }
    }

    seeIfSongIsLiked(id);
    const checkLyrics = document.getElementById('checkLyrics');
    checkLyrics.setAttribute('onclick', `doesSongHaveLyrics(${id},'${playedFrom}')`);
    checkLyrics.click();

    const playerLyricsBtn = document.getElementById("playerLyricsBtn");
    playerLyricsBtn.setAttribute('onclick', `turnLyrics(`+ id +`)`);

    const playerLikeBtn = document.getElementById("playerLikeBtn");
    playerLikeBtn.onclick = () => {
        addSongToLiked(id,playerLikeBtn);
    }

    const openArtistPageBigBtn = document.getElementById('openArtistPageBigBtn');
    openArtistPageBigBtn.onclick = () => {
        openArtistPageByName(songCreator);
    }

    const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
    miniPlayerLikeBtn.onclick = () => {
        addSongToLiked(id,miniPlayerLikeBtn);
    }

    const miniPlayerPopupBtn = document.getElementById("miniPlayerPopupBtn");
    miniPlayerPopupBtn.onclick = () => {
        openPopup('song',imageURL,songCreator,songTitle,id);
    }
}

// PLAY PLAYLIST FROM PLAY BUTTON

function playPlaylist(){
    
    pausePlayCurrentSong("Playlist");

}

// Open MINI PLAYER
function openMiniPlayer(){
    document.querySelector('#mobileNav').classList.remove('navNoPlayer');
    if(!isPlayerOpen){
        let player = document.getElementsByClassName("player")[0];
        player.style.opacity = "1";
        player.style.pointerEvents = "all";
        player.style.transform = "translateY(0%)";
        isPlayerOpen = true;
    }
}

// PAUSE / PLAY THE CURRENT SONG

let songPlayBtns = document.getElementsByName("songPlayButton");
let playPlaylistBtn = document.getElementById("playPlaylistBtn");
let playlistQueue = document.getElementsByClassName("playlistSongsList")[0].children;

function pausePlayCurrentSong(from){

    if(from === "Playlist"){
        playlistQueue[0].classList.add("songPlayingLi");
    }

    if(isSongPaused){
        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-play");
            button.children[0].classList.add("fa-circle-pause");
        });

        if(from === "Playlist"){
            playPlaylistBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
            if(currentSongAudio.currentTime === 0){
                playlistQueue[0].children[1].click();
            }else{
                currentSongAudio.play();
                if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
                    LastPlayedFromBtn.classList.remove("songPlayingLiPaused");
                    LastPlayedFromBtn.classList.add("songPlayingLi");
                }
            }
        }else{
            currentSongAudio.play();
            if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
                LastPlayedFromBtn.classList.remove("songPlayingLiPaused");
                LastPlayedFromBtn.classList.add("songPlayingLi");
            }
        }

        isSongPaused = false;
    }else{
        currentSongAudio.pause();

        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-pause");
            button.children[0].classList.add("fa-circle-play");
        });

        if(from === "Playlist"){
            playPlaylistBtn.innerHTML = `<i class="fa-solid fa-play"></i> Play`;
        }

        if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
            LastPlayedFromBtn.classList.remove("songPlayingLi");
            LastPlayedFromBtn.classList.add("songPlayingLiPaused");
        }

        isSongPaused = true;
    }
}

let songTime = document.getElementById("currentSongInput");

let isRepeatOn = false;

function setTheVault(){
    isTheVaultOn = true;
}

let randomListShuffle = [];
currentSongAudio.addEventListener('ended', () => {
    if(isRepeatOn){
        currentSongAudio.currentTime = 0;
        currentSongAudio.play();
    }else{
        if(isTheVaultOn){
            playRandomSongForTheVault();
        }
        else if(isAutoPlayOn){
            if(isShuffleOn){
                PlayRandomSongShuffle();
            }
            else if(nextSongBtn != 0){
                nextSongBtn.children[1].click();
            }
        }
        else{
            let songPlayBtns = document.getElementsByName("songPlayButton");
    
            songPlayBtns.forEach((button) => {
                button.children[0].classList.remove("fa-circle-pause");
                button.children[0].classList.add("fa-circle-play");
            });
            
            currentSongBtn.classList.remove("songPlayingLi");
            currentSongBtn.classList.remove("songPlayingLiPaused");

            isSongPaused = true;
        }
    }
});

let repeatBtn = document.getElementById("repeatBtn");
repeatBtn.addEventListener('click', () => {
    isRepeatOn = !isRepeatOn;
    if(isShuffleOn){
        isShuffleOn = !isShuffleOn;
        shuffleBtn.classList.toggle("buttonTurnedOn");
    }
    repeatBtn.classList.toggle("buttonTurnedOn");
});

// Play random song shuffle

function PlayRandomSongShuffle(){
    // console.log("ShuffleOn");
    let currentPlaylistUl,currentPlaylistLength;

    if(nextSongBtn != 0){
        currentPlaylistUl = nextSongBtn.parentElement.className;
        currentPlaylistLength = nextSongBtn.parentElement.children.length;
    }else{
        currentPlaylistUl = prevSongBtn.parentElement.className;
        currentPlaylistLength = prevSongBtn.parentElement.children.length;
    }

    // console.log("UL: " + currentPlaylistUl);
    // console.log("Length: " + currentPlaylistLength);
    
    if(randomListShuffle.length >= currentPlaylistLength){
        randomListShuffle = [];
    }
    while(true){
        let g = Math.floor(Math.random() * currentPlaylistLength);
        if(!randomListShuffle.includes(g)){
            // console.log(document.getElementsByClassName(currentPlaylistUl)[0]);
            document.getElementsByClassName(currentPlaylistUl)[0].children[g].children[1].click();
            randomListShuffle.push(g);
            break;
        }
    }
}

// Set the seekbar and times relative to the songs current time
currentSongAudio.addEventListener('timeupdate', () =>{
    let musicCurr = currentSongAudio.currentTime;
    let musicDur = currentSongAudio.duration;

    // End Time
    let min = Math.floor(musicDur / 60);
    let sec = Math.floor(musicDur % 60);

    if(sec<10){
        sec = `0${sec}`;
    }
    
    document.getElementById("currentSongTimeLeft").innerHTML = `${min}:${sec}`;

    //Curr Time
    let min2 = Math.floor(musicCurr / 60);
    let sec2 = Math.floor(musicCurr % 60);

    if(sec2<10){
        sec2 = `0${sec2}`;
    }

    document.getElementById("currentSongTime").innerHTML = `${min2}:${sec2}`;

    let progressBar = parseInt((currentSongAudio.currentTime/currentSongAudio.duration)*100);
    songTime.value = progressBar;

    let miniSeekBar = document.getElementById("miniSeekBar");
    miniSeekBar.style.width = progressBar + "%";


});

songTime.addEventListener('change', ()=>{
    var seekto = currentSongAudio.duration * (songTime.value / 100);
    currentSongAudio.currentTime = seekto;
});

// Pausing the audio outside of the app
currentSongAudio.addEventListener('pause', () =>{
    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-pause");
        button.children[0].classList.add("fa-circle-play");
    });
    isSongPaused = true;
});

// Playing the audio outside of the app
currentSongAudio.addEventListener('play', () =>{
    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-play");
        button.children[0].classList.add("fa-circle-pause");
    });
    isSongPaused = false;
});

// CHECK THE CHIPS ON SEARCH

let allChips = document.getElementsByName("allChip");

function checkTheChip(chipName){
    allChips.forEach((chip) => {
        if(chip.checked){
            chip.classList.add("allchipCh");
        }else{
            chip.classList.remove("allchipCh");
        }
    })

    document.getElementById('submitSearch').click();
}


// SCROLL ON PAGEBARS

let screenScrollables = document.getElementsByName("screenScrollable");
let sideBanner1 = document.getElementsByName("artistBanner")[0];
let sideBanner2 = document.getElementsByName("playlistBanner")[0];
let sideBanner3 = document.getElementsByName("catBanner")[0];

screenScrollables.forEach((screen) => {
    screen.addEventListener("scroll", ()=>{

        if(!reduceAnimations){
            if(screen.id != "screenScrollableCat"){
                if(screen.scrollTop < 0){
                    screen.children[2].children[0].classList.add('noAnimTransitions');
                    let newHeight = Number(-screen.scrollTop) + (500 + Number(getComputedStyle(document.documentElement).getPropertyValue("--topInsetArea").split('p')[0]));
                    screen.children[2].children[0].style.height = `${newHeight}px`;
                    if(screen.scrollTop > -120){
                        screen.children[2].children[1].style.opacity = 1;
                    }else{
                        screen.children[2].children[1].style.opacity = 0;
                    }
                }else{
                    screen.children[2].children[1].style.opacity = 1;
                    screen.children[2].children[0].classList.remove('noAnimTransitions');
                    screen.children[2].children[0].style.height = `calc(env(safe-area-inset-top) + 500px)`;
                }

                if(screen.scrollTop > 150){
                    let curOp = 1 - (screen.scrollTop/136 - 1);
                    screen.children[2].children[1].children[0].style.opacity = curOp;
                    screen.children[2].children[0].style.opacity = curOp;
                }else{
                    screen.children[2].children[1].children[0].style.opacity = 1;
                    screen.children[2].children[0].style.opacity = 1;
                }
            }else{
                if(screen.scrollTop > 130){
                    let curOp = 1 - (screen.scrollTop/125 - 1);
                    screen.children[3].children[0].style.opacity = curOp;
                }else{
                    screen.children[3].children[0].style.opacity = 1;
                }
            }
    
            if(screen.scrollTop > 268){
                screen.children[0].classList.add("pageBarOn");
                screen.children[1].classList.add("pageBarOn2");
            }else{
                screen.children[0].classList.remove("pageBarOn");
                screen.children[1].classList.remove("pageBarOn2");
            }
    
            if(screen.id != "screenScrollableCat"){
                screen.children[2].children[0].classList.add('noAnimTransitions');
                screen.children[2].children[0].style.transform = "translateY(-"+ screen.scrollTop / 3 +"px)";
            }else{
                screen.children[3].children[0].classList.add('noAnimTransitions');
                screen.children[3].children[0].style.transform = "translateY(-"+ screen.scrollTop / 4 +"px)";
            }
        }else{
            if(screen.scrollTop > 250){
                screen.children[0].classList.add("pageBarOn");
                screen.children[1].classList.add("pageBarOn2");
            }else{
                screen.children[0].classList.remove("pageBarOn");
                screen.children[1].classList.remove("pageBarOn2");
            }
        }

    })
})

// THE VAULT

function pausePlayCurrentSongVault(){

    let songPlayBtns = document.getElementsByName("songPlayButton");

    if(isSongPaused){
        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-play");
            button.children[0].classList.add("fa-circle-pause");
        });
        
        currentSongAudio.play();
        isSongPaused = false;
    }else{
        currentSongAudio.pause();

        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-pause");
            button.children[0].classList.add("fa-circle-play");
        });

        isSongPaused = true;
    }
}

// Make a Playlist

let makePlScreen = document.getElementsByClassName("makePlaylistScreen")[0];
let isMakePlOpen = false;

function OpenMakePlaylistScreen(editing, playlistIdP, playlistNameP, playlistBannerP, playlistSongsP){

    if(editing){
        document.querySelector('.formImageInput').classList.add('displayNone');

        makePlScreen.children[0].children[0].children[1].innerHTML = "Edit Playlist";

        document.getElementById('nameInput').value = playlistNameP;
        document.getElementById('submitMakePlaylist').value = "Save";

        document.getElementById('imageUploadView').style.backgroundImage = `url("${playlistBannerP}")`;
        document.querySelector('.currentMakePlaylistName').innerHTML = playlistNameP;
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-id', playlistIdP);
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-songs', playlistSongsP);
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-banner', playlistBannerP);
    }else{
        document.querySelector('.formImageInput').classList.remove('displayNone');

        makePlScreen.children[0].children[0].children[1].innerHTML = "Make Playlist";

        document.getElementById('nameInput').value = "";
        document.getElementById('submitMakePlaylist').value = "Create";

        document.getElementById('imageUploadView').style.backgroundImage = "none";
        document.querySelector('.currentMakePlaylistName').innerHTML = "My Playlist";
        document.querySelector('.currentMakePlaylistName').removeAttribute('data-playlist-id');
        document.querySelector('.currentMakePlaylistName').removeAttribute('data-playlist-songs');
        document.querySelector('.currentMakePlaylistName').removeAttribute('data-playlist-banner');
    }

    makePlScreen.classList.add("makePlaylistScreenOpen");
    makePlScreen.classList.add('screenOpenOnTop');
    
    if(lastOpenSideScreen != undefined && lastOpenSideScreen != null && lastOpenSideScreen != makePlScreen){
        lastOpenSideScreen.classList.remove('screenOpenOnTop');
    }
    lastOpenSideScreen = makePlScreen;

    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");
}

function CloseMakePlaylistScreen(){
    makePlScreen.classList.remove("makePlaylistScreenOpen");
    makePlScreen.classList.remove('screenOpenOnTop');

    makePlaylistScreen.classList.remove("playerMovable");

    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
}

function changeMakePlaylistName(text){
    if(text != ""){
        document.getElementsByClassName("currentMakePlaylistName")[0].innerHTML = text;
    }else{
        document.getElementsByClassName("currentMakePlaylistName")[0].innerHTML = "My Playlist";
    }
}

// ----- Close Popup

let isPopupOpen = false;
function openPopup(type,src,art,nam,id,isLikedPage){
    const popupWrapper = document.getElementById("popupWrapper");
    popupWrapper.classList.add("popupOpen");

    popupWrapper.focus();
    isPopupOpen = true;

    getArtistId(art.split(',')[0]);

    const songPopupBody = document.getElementsByClassName("songPopupBody")[0];
    const playlistPopupBody = document.getElementsByClassName("playlistPopupBody")[0];

    const popupImages = document.getElementsByName("popupImage");
    const popupSongTitle = document.getElementsByName("popupSongTitle");
    const popupArtist = document.getElementsByName("popupArtist");

    if(type == "playlist"){
        document.getElementById('deletePlaylistBtn').setAttribute('data-playlist-id', id);
        document.getElementById('deletePlaylistBtn').setAttribute('data-playlist-name', nam);
        document.getElementById('editPlaylistBtn').setAttribute('data-playlist-id', id);
        document.getElementById('editPlaylistBtn').setAttribute('data-playlist-name', nam);
        document.getElementById('editPlaylistBtn').setAttribute('data-playlist-banner', src);
        document.getElementById('editPlaylistBtn').setAttribute('data-playlist-songs', isLikedPage);
    }

    popupScreen.classList.remove("playerMovable");
    popupScreen.focus();
    popupScreen.style.top = 'auto';

    addToPlBtn.setAttribute('name', id);

    popupImages.forEach((image) => {
        image.src = src;
    })

    popupSongTitle.forEach((title) => {
        title.innerHTML = nam;
    })

    art = art.split(',')[0];
    popupArtist.forEach((artist) => {
        artist.innerHTML = art;
    })

    if(type === 'song'){
        songPopupBody.style.display = "block";
        playlistPopupBody.style.display = "none";
    }else{
        songPopupBody.style.display = "none";
        playlistPopupBody.style.display = "block";
    }

    seeIfSongIsLiked(id);

    let likeSongBtn = document.getElementById("likeSongBtn");
    likeSongBtn.addEventListener('click', () => {
        if(UserSignedIn()){
            addSongToLiked(id);
            likeSongBtn.classList.add("likeBtnAnim2");
            setTimeout(() => {
                likeSongBtn.classList.remove("likeBtnAnim2");
            }, 500);
        }else{
            openLoginPopup();
        }
    })
}

function closePopup(){
    const popupWrapper = document.getElementById("popupWrapper");
    popupWrapper.classList.remove("popupOpen");

    isPopupOpen = false;

    const popupMyPlaylists = document.querySelector('.popupMyPlaylists');
    popupScreen.classList.remove('popupPl');
    popupMyPlaylists.innerHTML = "";
    addToPlBtn.addEventListener('click', addToPlFunc);
}

// ----- SET APP THEME

const autoThemeInput = document.getElementById('autoThemeInput');

let themePreference = window.matchMedia("(prefers-color-scheme: dark)");
const setAutoTheme = e => {
    let autoThemeInput2 = document.getElementById('autoThemeInput2');
    lightThemeInput2.checked = false;
    autoThemeInput2.checked = true;
    darkThemeInput2.checked = false;
    if(e.matches){
        setDarkTheme();
        // console.log("Set to Dark!");
    }else{
        setLightTheme();
        // console.log("Set to Light!");
    }
}

setAppPMode();
setAutoTheme(themePreference);
themePreference.addEventListener('change', () => {
    if(autoThemeInput.checked){
        setAutoTheme(themePreference);
    }
});

function setAppTheme(userTheme,clicked){

    if(userTheme === "Dark"){
        setDarkTheme(clicked);
    }else if(userTheme === "Light"){
        setLightTheme(clicked);
    }else{
        autoThemeInput.checked = true;
        themePreference = window.matchMedia("(prefers-color-scheme: dark)");
        setAutoTheme(themePreference);
    }
}

function setDarkTheme(clicked){

    let lightThemeInput = document.getElementById("lightThemeInput");
    let lightThemeInput2 = document.getElementById("lightThemeInput2");
    let darkThemeInput = document.getElementById("darkThemeInput");
    let darkThemeInput2 = document.getElementById("darkThemeInput2");
    let autoThemeInput2 = document.getElementById('autoThemeInput2');
    
    if(clicked){
        lightThemeInput2.checked = false;
        autoThemeInput2.checked = false;
        darkThemeInput2.checked = true;
    }

    document.documentElement.style.setProperty('--bodyBg', '#0e0d13');
    document.documentElement.style.setProperty('--bodyBgMP', 'rgb(18, 14, 24)');
    document.documentElement.style.setProperty('--playerColor', '#1f1d23');
    document.documentElement.style.setProperty('--offWhite', '#DCD6F7');
    document.documentElement.style.setProperty('--yoursBubbleColor', 'rgba(90, 0, 27, 0.7)');
    document.documentElement.style.setProperty('--offWhiteDark', '#8a85a1');
    document.documentElement.style.setProperty('--sidePageback', 'black');
    document.documentElement.style.setProperty('--mainColor', '#251e2c');
    document.documentElement.style.setProperty('--mainColorLighter', 'rgba(21, 19, 23, 0.6)');
    document.documentElement.style.setProperty('--secondaryColor', 'rgba(19, 19, 19, 0.45)');
    document.documentElement.style.setProperty('--latestReleaseBox', '#100e1c');
    document.documentElement.style.setProperty('--popupScreenBg', 'linear-gradient(0deg, rgb(14, 11, 19), rgb(21, 17, 27))');
    if(isPerformanceModeOn){
        document.documentElement.style.setProperty('--footerBg', '#16141c');
    }else{
        document.documentElement.style.setProperty('--footerBg', 'rgba(22, 20, 28, 0.7)');
    }
    document.documentElement.style.setProperty('--footerBgHO', 'rgb(30, 27, 37)');

    accountTheme = "Dark";
}

function setLightTheme(clicked){

    let lightThemeInput = document.getElementById("lightThemeInput");
    let lightThemeInput2 = document.getElementById("lightThemeInput2");
    let darkThemeInput = document.getElementById("darkThemeInput");
    let darkThemeInput2 = document.getElementById("darkThemeInput2");
    let autoThemeInput2 = document.getElementById('autoThemeInput2');

    if(clicked){
        lightThemeInput2.checked = true;
        darkThemeInput2.checked = false;
        autoThemeInput2.checked = false;
    }

    document.documentElement.style.setProperty('--bodyBg', '#ece8ff');
    document.documentElement.style.setProperty('--bodyBgMP', 'rgba(255, 255, 255, 0.4)');
    document.documentElement.style.setProperty('--playerColor', '#CFB7E3');
    document.documentElement.style.setProperty('--offWhite', '#100e1c');
    document.documentElement.style.setProperty('--offWhiteDark', '#100e1c');
    document.documentElement.style.setProperty('--darken', '#ede7ff');
    document.documentElement.style.setProperty('--yoursBubbleColor', 'rgba(134, 69, 255, 0.5)');
    document.documentElement.style.setProperty('--sidePageback', 'linear-gradient(0deg, #ece8ff, rgba(134, 69, 255, 0.1))');
    document.documentElement.style.setProperty('--mainColor', '#d3cdee');
    document.documentElement.style.setProperty('--mainColorLighter', 'rgba(255, 255, 255, 0.5)');
    document.documentElement.style.setProperty('--latestReleaseBox', 'rgb(0,0,0,0.2)');
    document.documentElement.style.setProperty('--vibeVault', 'rgba(169, 141, 215, 0.25)');
    document.documentElement.style.setProperty('--popupScreenBg', 'var(--darken)');
    document.documentElement.style.setProperty('--secondaryColor', 'rgba(230, 230, 230, 0.45)');
    if(isPerformanceModeOn){
        document.documentElement.style.setProperty('--footerBg', 'rgba(222, 213, 255, 1)');
    }else{
        document.documentElement.style.setProperty('--footerBg', 'rgba(222, 213, 255, 0.8)');
    }
    document.documentElement.style.setProperty('--footerBgHO', 'rgba(192, 179, 219, 1)');

    accountTheme = "Light";
}

// ----- ELEMENTS OPEN / CLOSE

const movablePlayer = document.getElementsByClassName("player")[0];
const playerOpenDiv = document.getElementsByClassName("playerClickDiv")[0];
const playerOpenDiv2 = document.getElementsByClassName("playerClickDiv2")[0];
let offsetY,currentTouchPos = 0;
let playerTouchStarted = false, playerTouchStarted2 = false;
let moveStarted = true;
let playerNormalPos = movablePlayer.offsetTop;
let sidePageNormalPos = document.getElementsByClassName("loginScreen")[0].offsetLeft;

const move = (e) => {
    currentTouchPos = (e.touches[0].clientY - offsetY);
    if(currentTouchPos <= (-50)){
        return;
    }
    moveStarted = true;
    // Update div pos based on new cursor pos
    movablePlayer.style.top = `${e.touches[0].clientY - offsetY}px`;
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

let isLyricsOn = false;

playerOpenDiv.addEventListener("touchstart", (e) => {
    // console.log("touched");
    if(window.innerWidth < window.innerHeight){
        playerMovedDown = true;
        document.getElementsByTagName("nav")[0].classList.add("navClosed");
        movablePlayer.classList.add("playerOpen");
        if(reduceAnimations){
            document.querySelector('.bigControls').classList.add('noPointerEvents');
            setTimeout(() => {
                document.querySelector('.bigControls').classList.remove('noPointerEvents');
            }, 200);
        }

        // Calc the initial offset Values
        offsetY = e.touches[0].clientY - movablePlayer.offsetTop;
        movablePlayer.style.top = `${e.touches[0].clientY - offsetY}px`;
        movablePlayer.classList.add("playerMovable");

        if(isLyricsOn){
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
        }
        document.addEventListener("touchmove", move);
        playerTouchStarted = true;
        moveStarted = false;
    }
})

// ----- playerDiv 2

const bigSongBanner = document.getElementById("bigSongBanner");
let topInsetNumber = Number(getComputedStyle(document.documentElement).getPropertyValue("--topInsetArea").split('p')[0]);
let bigSongBannerMoved = false, playerMovedDown = false;

const move2 = (e) => {
    currentTouchPos = (e.touches[0].clientY - offsetY - topInsetNumber);
    // console.log(currentTouchPos);
    // Update div pos based on new cursor pos
    if(currentTouchPos > 0 && !isPopupOpen && !isLyricsOn){
        if(!bigSongBannerMoved){
            moveStarted = true;
            playerMovedDown = true;
            movablePlayer.classList.add("playerMovable");
            bigSongBanner.classList.remove("playerMovable");
            movablePlayer.style.top = `${e.touches[0].clientY - offsetY - 50}px`;
        }
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

playerOpenDiv2.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    if(window.innerWidth < window.innerHeight){
        currentTouchPosSkip = 0;
        offsetY = e.touches[0].clientY - movablePlayer.offsetTop;
        offsetX = e.touches[0].clientX - movablePlayer.offsetLeft;
        movablePlayer.classList.add("playerMovable");
        bigSongBanner.classList.add("playerMovable");
        document.addEventListener("touchmove", move2);
        document.addEventListener("touchmove", moveSideSkip);
        playerTouchStarted2 = true;
        moveStarted = false;
    }
})

// ----- PLAYER SONG SKIPPING

let currentTouchPosSkip;
const moveSideSkip = (e) =>{
    if(!playerMovedDown){
        currentTouchPosSkip = e.touches[0].clientX - offsetX;
        if(Math.abs(currentTouchPosSkip) > 30){
            bigSongBannerMoved = true;
            // Update div pos based on new cursor pos
            let dragDelay;
            if(currentTouchPosSkip > 0){
                dragDelay = 30;
            }else{
                dragDelay = -30;
            }
            bigSongBanner.style.transform = `translateX(${e.touches[0].clientX - offsetX - dragDelay}px)`;
        }
    }else{
        currentTouchPosSkip = 0;
    }
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// ----- SIDE PAGES CLOSE

let offsetX;
const loginScreen = document.getElementsByClassName("loginScreen")[0];
const LicenseAndProfileScreen = document.getElementsByClassName("LicenseAndProfileScreen")[0];
const closeLoginScreenBtn = document.getElementById("closeLoginScreen");
const closeLicenseAndProfileScreenBtn = document.getElementById("closeLicenseAndProfileScreen");
let touchSideStarted = false;
let currentSideCloseTouched = "";

function setSideCloseTouched(screen){
    currentSideCloseTouched = screen;
}

let closeCurrentScreens = document.querySelectorAll('.closeCurrentScreen');
closeCurrentScreens.forEach((closeBtn) => {
    closeBtn.addEventListener('touchstart', () => {
        setSideCloseTouched(closeBtn.id);
    })
})

const moveSide = (e) => {
    currentTouchPos = (e.touches[0].clientX - offsetX);
    moveStarted = true;
    // Update div pos based on new cursor pos
    loginScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + (e.touches[0].clientX - offsetX));
}

closeLoginScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - loginScreen.offsetLeft;
    loginScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    loginScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide);
    touchSideStarted = true;
    moveStarted = false;
})

const closePlaylistScreenBtn = document.getElementById("closePlaylistScreen");
const closeArtistScreenBtn = document.getElementById("closeArtistScreen");
const closeCategoryScreenBtn = document.getElementById("closeCategoryScreen");
const closeMakePlaylistScreenBtn = document.getElementById("closeMakePlaylistScreen");
const closeBugScreenBtn = document.getElementById("closeBugScreen");
const playlistScreen = document.getElementsByClassName("playlistScreen")[0];
const artistScreen = document.getElementsByClassName("artistScreen")[0];
const categoryScreen = document.getElementsByClassName("categoryScreen")[0];
const makePlaylistScreen = document.getElementsByClassName("makePlaylistScreen")[0];
const bugReportScreen = document.getElementsByClassName("bugReportScreen")[0];

// Playlist Close

closePlaylistScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - playlistScreen.offsetLeft;
    playlistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    playlistScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide2);
    touchSideStarted = true;
    moveStarted = false;
})

const moveSide2 = (e) =>{
    currentTouchPos = e.touches[0].clientX - offsetX;
    moveStarted = true;
    // Update div pos based on new cursor pos
    playlistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// Artist Close

closeArtistScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - artistScreen.offsetLeft;
    artistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    artistScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide3);
    touchSideStarted = true;
    moveStarted = false;
})

const moveSide3 = (e) =>{
    currentTouchPos = e.touches[0].clientX - offsetX;
    moveStarted = true;
    // Update div pos based on new cursor pos
    artistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// Category Close

closeCategoryScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - categoryScreen.offsetLeft;
    categoryScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    categoryScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide4);
    touchSideStarted = true;
    moveStarted = false;
})

const moveSide4 = (e) =>{
    currentTouchPos = e.touches[0].clientX - offsetX;
    moveStarted = true;
    // Update div pos based on new cursor pos
    categoryScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// Make a Playlist Close

closeMakePlaylistScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - makePlaylistScreen.offsetLeft;
    makePlaylistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    makePlaylistScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide5);
    touchSideStarted = true;
    moveStarted = false;
})

const moveSide5 = (e) =>{
    currentTouchPos = e.touches[0].clientX - offsetX;
    moveStarted = true;
    // Update div pos based on new cursor pos
    makePlaylistScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// Bug Report Close

closeBugScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - bugReportScreen.offsetLeft;
    bugReportScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    bugReportScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide6);
    touchSideStarted = true;
    moveStarted = false;
})

const moveSide6 = (e) =>{
    currentTouchPos = e.touches[0].clientX - offsetX;
    moveStarted = true;
    // Update div pos based on new cursor pos
    bugReportScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + e.touches[0].clientX - offsetX);
}

// License Screen Close

const moveSide7 = (e) => {
    currentTouchPos = (e.touches[0].clientX - offsetX);
    moveStarted = true;
    // Update div pos based on new cursor pos
    LicenseAndProfileScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    // console.log("moved " + (e.touches[0].clientX - offsetX));
}

closeLicenseAndProfileScreenBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    offsetX = e.touches[0].clientX - LicenseAndProfileScreen.offsetLeft;
    LicenseAndProfileScreen.style.left = `${e.touches[0].clientX - offsetX}px`;
    LicenseAndProfileScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", moveSide7);
    touchSideStarted = true;
    moveStarted = false;
})

// Popup Screen

const popupScreen = document.getElementsByClassName("popupScreen")[0];
let playerTouchStarted3 = false;
let startPopupOffsetTop = popupScreen.offsetTop;

const move3 = (e) => {
    currentTouchPos = (e.touches[0].clientY - offsetY);
    moveStarted = true;
    // Update div pos based on new cursor pos
    if(currentTouchPos > startPopupOffsetTop){
        popupScreen.classList.add("playerMovable");
        popupScreen.style.top = `${e.touches[0].clientY - offsetY}px`;
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

popupScreen.addEventListener("touchstart", (e) => {
    if(window.innerWidth < window.innerHeight){
        // console.log("touched");
        // Calc the initial offset Values
        offsetY = e.touches[0].clientY - popupScreen.offsetTop;
        popupScreen.style.top = `${e.touches[0].clientY - offsetY}px`;
        popupScreen.classList.add("playerMovable");
        document.addEventListener("touchmove", move3);
        playerTouchStarted3 = true;
        moveStarted = false;
    }
})

// ----- TOUCH END

document.addEventListener("touchend", () => {
    if(playerTouchStarted){
        document.removeEventListener("touchmove", move);
        movablePlayer.classList.remove("playerMovable");
        if(currentTouchPos < playerNormalPos - 125){
            movablePlayer.style.top = `calc(env(safe-area-inset-top) - 50px)`;
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            isPlayerOpen = true;
        }else{
            movablePlayer.style.top = `calc(${playerNormalPos}px + env(safe-area-inset-top) - env(safe-area-inset-bottom)*0.6)`;
            movablePlayer.classList.remove("playerOpen");
            document.getElementsByTagName("nav")[0].classList.remove("navClosed");
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
            isPlayerOpen = false;
        }
        playerTouchStarted = false;
        if(!moveStarted){
            movablePlayer.classList.add("playerOpen");
            movablePlayer.style.top = `calc(env(safe-area-inset-top) - 50px)`;
            document.getElementsByTagName("nav")[0].classList.add("navClosed");
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            isPlayerOpen = true;
        }
    }
    if(touchSideStarted && moveStarted){
        document.removeEventListener("touchmove", moveSide);
        document.removeEventListener("touchmove", moveSide2);
        document.removeEventListener("touchmove", moveSide3);
        document.removeEventListener("touchmove", moveSide4);
        document.removeEventListener("touchmove", moveSide5);
        document.removeEventListener("touchmove", moveSide6);
        document.removeEventListener("touchmove", moveSide7);
        loginScreen.classList.remove("playerMovable");
        playlistScreen.classList.remove("playerMovable");
        artistScreen.classList.remove("playerMovable");
        categoryScreen.classList.remove("playerMovable");
        makePlaylistScreen.classList.remove("playerMovable");
        bugReportScreen.classList.remove("playerMovable");
        LicenseAndProfileScreen.classList.remove("playerMovable");
        playlistScreen.style.left = '0';
        artistScreen.style.left = '0';
        categoryScreen.style.left = '0';
        loginScreen.style.left = '0';
        makePlaylistScreen.style.left = '0';
        bugReportScreen.style.left = '0';
        LicenseAndProfileScreen.style.left = '0';
        if(currentTouchPos >= sidePageNormalPos + 75){
            if(currentSideCloseTouched == "closePlaylistScreen"){
                closePlaylistPage();
            }
            if(currentSideCloseTouched == "closeArtistScreen"){
                closeArtistPage();
            }
            if(currentSideCloseTouched == "closeCategoryScreen"){
                closeCategoryPage();
            }
            if(currentSideCloseTouched == "closeLoginScreen"){
                closeLoginScreen();
            }
            if(currentSideCloseTouched == "closeMakePlaylistScreen"){
                CloseMakePlaylistScreen();
            }
            if(currentSideCloseTouched == "closeBugScreen"){
                closeBugScreenF();
            }
            if(currentSideCloseTouched == "closeLicenseAndProfileScreen"){
                closeLicenseAndProfileScreen();
            }
            touchSideStarted = false;
            moveStarted = false;
        }
    }
    if(playerTouchStarted2 && moveStarted){
        if(currentTouchPos > 100){
            movablePlayer.classList.remove("playerMovable");
            movablePlayer.classList.remove("playerOpen");
            movablePlayer.style.top = `calc(${playerNormalPos}px + env(safe-area-inset-top) - env(safe-area-inset-bottom)*0.6)`;
            document.removeEventListener("touchmove", move2);
            document.getElementsByTagName("nav")[0].classList.remove("navClosed");
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
            isPlayerOpen = false;
        }else{
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            movablePlayer.classList.remove("playerMovable");
            movablePlayer.style.top = `calc(env(safe-area-inset-top) - 50px)`;
            isPlayerOpen = true;
        }
    }
    document.removeEventListener("touchmove", moveSideSkip);
    if(bigSongBannerMoved){
        movablePlayer.classList.remove("playerMovable");
        if(currentTouchPosSkip > 130){
            bigSongBanner.classList.remove("playerMovable");
            bigSongBanner.style.transform = "translateX(200%)";
            setTimeout(() => {
                backwardBtn.click();
                bigSongBanner.classList.add("playerMovable");
                setTimeout(() => {
                    bigSongBanner.style.transform = "translateX(-200%)";
                    setTimeout(() => {
                        bigSongBanner.classList.remove("playerMovable");
                        bigSongBanner.style.transform = "translateX(0)";
                    }, 10);
                }, 10);
            }, 350);
        }
        if(currentTouchPosSkip < 130){
            bigSongBanner.classList.remove("playerMovable");
            bigSongBanner.style.transform = "translateX(-200%)";
            setTimeout(() => {
                forwardBtn.click();
                bigSongBanner.classList.add("playerMovable");
                setTimeout(() => {
                    bigSongBanner.style.transform = "translateX(200%)";
                    setTimeout(() => {
                        bigSongBanner.classList.remove("playerMovable");
                        bigSongBanner.style.transform = "translateX(0)";
                    }, 10);
                }, 10);
            }, 350);
        }
    }
    if(playerTouchStarted3){
        popupScreen.classList.remove("playerMovable");
        document.removeEventListener("touchmove", move3);
        if(moveStarted){
            if(currentTouchPos <= startPopupOffsetTop + 100){
                popupScreen.style.top = "calc(" + startPopupOffsetTop + "px + env(safe-area-inset-top)";
            }else{
                closePopup();
            }
        }
    }
    playerMovedDown = false;
    bigSongBannerMoved = false;
    playerTouchStarted3 = false;
    playerTouchStarted2 = false;
    playerTouchStarted = false;
})

// ----- CLOSE THE POPUP ADD TO PLAYLIST UL

const closePopupPlBtn = document.querySelector('#closePopupPlBtn');
closePopupPlBtn.addEventListener('click', () => {
    popupScreen.classList.remove("popupPl");
    if(window.innerHeight > window.innerWidth){
        popupScreen.style.top = "calc(" + startPopupOffsetTop + "px + env(safe-area-inset-top)";
    }
    setTimeout(() => {
        addToPlBtn.addEventListener('click', addToPlFunc);
    }, 100);
})

// ----- TEXT SCROLL ON OVERFLOW

const scrollTexts = document.getElementsByClassName("scrollText");

function isOverflown(element) {
    return element.scrollWidth > element.clientWidth;
}

// Create a new instance of 'MutationObserver' named 'observer', 
// Passing it a callback function
observer = new MutationObserver(function(mutationsList, observer) {
    mutationsList[0].target.classList.remove("scrollTextCl");
    if(isOverflown(mutationsList[0].target)){
        mutationsList[0].target.classList.add("scrollTextCl");
    }
});

// Call 'observe' on that MutationObserver instance, 
// Passing it the element to observe, and the options object
for (let i = 0; i < scrollTexts.length; i++) {
    observer.observe(scrollTexts[i].children[0], {characterData: false, childList: true, attributes: false});
}

// ----- Search -> YOURS SCREEN

function showSearchBarYours(searchOnBtn){
    document.getElementById('searchBarYours').classList.toggle('searchBarOn');
    if(searchOnBtn.innerHTML == `<i class="fa-solid fa-xmark" aria-hidden="true"></i>` || searchOnBtn.innerHTML == `<i class="fa-solid fa-xmark"></i>`){
        resetSearchScreenToNormal();
    }else{
        document.getElementById('searchYoursInput').focus();
        searchOnBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        document.querySelector('.favoritesItem').classList.add('displayNone');
        document.querySelector('.yourPlaylistsH1').classList.add('displayNone');
        document.querySelector('.yourPlaylists').classList.add('displayNone');
        document.querySelector('.yourLPlaylistsH1').classList.add('displayNone');
        document.querySelector('.yourLPlaylists').classList.add('displayNone');
        document.querySelector('.yourFArtistsH1').classList.add('displayNone');
        document.querySelector('.yourFArtists').classList.add('displayNone');
    }
}

function resetSearchScreenToNormal(){
    document.getElementById('searchYoursInput').value = "";

    document.getElementById('searchBarYours').classList.remove('searchBarOn');

    searchOnBtn = document.querySelector('.searchOnYoursBtn');
    searchOnBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`;
    document.querySelector('.favoritesItem').classList.remove('displayNone');
    document.querySelector('.yourPlaylistsH1').classList.remove('displayNone');
    document.querySelector('.yourPlaylists').classList.remove('displayNone');
    document.querySelector('.yourLPlaylistsH1').classList.remove('displayNone');
    document.querySelector('.yourLPlaylists').classList.remove('displayNone');
    document.querySelector('.yourFArtistsH1').classList.remove('displayNone');
    document.querySelector('.yourFArtists').classList.remove('displayNone');

    const yourPlaylists = [].slice.call(document.querySelector('.yourPlaylists').children);
    yourPlaylists.forEach((playlist) => {
        playlist.classList.remove('displayNone');
    })

    const yourLPlaylists = [].slice.call(document.querySelector('.yourLPlaylists').children);
    yourLPlaylists.forEach((playlist) => {
        playlist.classList.remove('displayNone');
    })

    const yourFArtists = [].slice.call(document.querySelector('.yourFArtists').children);
    yourFArtists.forEach((artist) => {
        artist.classList.remove('displayNone');
    })
}

const submitYoursSearchBtn = document.getElementById("submitYoursSearch");
submitYoursSearchBtn.addEventListener('click', () => {
    const searchInput = document.getElementById('searchYoursInput').value;
    const yourPlaylists = [].slice.call(document.querySelector('.yourPlaylists').children);
    const yourLPlaylists = [].slice.call(document.querySelector('.yourLPlaylists').children);
    const yourFArtists = [].slice.call(document.querySelector('.yourFArtists').children);

    let brP = 0, brL = 0, brA = 0;
    if(searchInput != "" && searchInput != undefined){

        yourPlaylists.forEach((playlist) => {
            if(playlist.children[0].children[1].children[0].innerHTML.toLowerCase().includes(searchInput.toLowerCase()) || searchInput.toLowerCase().includes(playlist.children[0].children[1].children[0].innerHTML.toLowerCase())){
                playlist.classList.remove('displayNone');
                brP++;
            }else{
                playlist.classList.add('displayNone');
            }
        })

        yourLPlaylists.forEach((playlist) => {
            if(playlist.children[0].children[1].children[0].innerHTML.toLowerCase().includes(searchInput.toLowerCase()) || searchInput.toLowerCase().includes(playlist.children[0].children[1].children[0].innerHTML.toLowerCase())){
                playlist.classList.remove('displayNone');
                brL++;
            }else{
                playlist.classList.add('displayNone');
            }
        })

        yourFArtists.forEach((artist) => {
            if(artist.children[1].innerHTML.toLowerCase().includes(searchInput.toLowerCase()) || searchInput.toLowerCase().includes(artist.children[1].innerHTML.toLowerCase())){
                artist.classList.remove('displayNone');
                brA++;
            }else{
                artist.classList.add('displayNone');
            }
        })

        if(brP != 0){
            document.querySelector('.yourPlaylistsH1').classList.remove('displayNone');
            document.querySelector('.yourPlaylists').classList.remove('displayNone');
            brP = 0;
        }else{
            document.querySelector('.yourPlaylistsH1').classList.add('displayNone');
            document.querySelector('.yourPlaylists').classList.add('displayNone');
        }

        if(brL != 0){
            document.querySelector('.yourLPlaylistsH1').classList.remove('displayNone');
            document.querySelector('.yourLPlaylists').classList.remove('displayNone');
            brP = 0;
        }else{
            document.querySelector('.yourLPlaylistsH1').classList.add('displayNone');
            document.querySelector('.yourLPlaylists').classList.add('displayNone');
        }

        if(brA != 0){
            document.querySelector('.yourFArtistsH1').classList.remove('displayNone');
            document.querySelector('.yourFArtists').classList.remove('displayNone');
            brA = 0;
        }else{
            document.querySelector('.yourFArtistsH1').classList.add('displayNone');
            document.querySelector('.yourFArtists').classList.add('displayNone');
        }
    }
});

// ------ Login Popup

let isLoginPopupOn = false;

function openLoginPopup(){
    if(!isLoginPopupOn){
        document.getElementsByClassName('loginPopup')[0].classList.add('loginPopupOn');
        setTimeout(() => {
            document.getElementsByClassName('loginPopup')[0].classList.remove('loginPopupOn');
            isLoginPopupOn = false;
        }, 2500);
        isLoginPopupOn = true;
    }
}

// function closeLoginPopup(){
//     document.getElementsByClassName('loginPopup')[0].classList.remove('loginPopupOn');
//     isLoginPopupOn = false;
// }

// ----- Search sticky

const stickyElm = document.querySelector('#searchScreenBar');

const observer2 = new IntersectionObserver( 
  ([e]) => e.target.classList.toggle('isSticky', e.intersectionRatio < 1),
  {threshold: [1]}
);

observer2.observe(stickyElm);

// ----- PC player seek

if(window.innerHeight < window.innerWidth){
    const miniSeek = document.querySelector('.miniSeek');
    miniSeek.addEventListener('click', (e) => {
        let procent = e.clientX / miniSeek.clientWidth;
        procent = Math.round(procent * 100 - 1);
        document.getElementById('currentSongInput').value = procent;
        let seekto = currentSongAudio.duration * (procent / 100);
        currentSongAudio.currentTime = seekto;
    })
}

// ----- BUG REPORT SCREEN

let isBugReportScreenOpen = false;

function openBugReport(){
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    bugReportScreen.classList.add("bugReportScreenOpen");

    isBugReportScreenOpen = true;
}

function closeBugScreenF(){
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    bugReportScreen.classList.remove("bugReportScreenOpen");
    
    bugReportScreen.classList.remove("playerMovable");

    isBugReportScreenOpen = false;
}

function noStorage(){
    document.querySelector('.noStorageMessage').style.display = 'flex';
}

function playArtist(){
    document.querySelector('.artistSongs').children[0].children[1].click();
}

// ----- PLAYLIST SORTING

let playlistToSort = null, defaultPlaylistSort = null;
const sortBtns = document.querySelectorAll('.sortBtn');
sortBtns.forEach((sortBtn) => {
    sortBtn.addEventListener("click", () => {
        playlistToSort = document.querySelector(`.${sortBtn.getAttribute('data-playlisttosort')}`);

        let sortPopup = document.querySelector('.sortPopup');

        let sortBtnRect = sortBtn.getBoundingClientRect();
        let offsetX = sortBtnRect.left - document.body.getBoundingClientRect().left;
        let offsetY = sortBtnRect.top - document.body.getBoundingClientRect().top;
        offsetX = Math.round(offsetX - sortPopup.getBoundingClientRect().width);
        offsetY = Math.round(offsetY + sortBtnRect.height + 5);

        document.querySelector('.sortPopupWrapper').classList.add('sortPopupOpen');
        document.documentElement.style.setProperty('--sortPopupTop', `${offsetY}px`);
        document.documentElement.style.setProperty('--sortPopupLeft', `${offsetX}px`);
    })
})

function closeSortPopup(){
    document.querySelector('.sortPopupWrapper').classList.remove('sortPopupOpen');
}

function sortPlaylist(sortType){
    if(playlistToSort == null || defaultPlaylistSort == null){
        return;
    }
    if(sortType == "Default"){
        playlistToSort.innerHTML = defaultPlaylistSort;
    }else if(sortType == "A-Z"){
        sortUlAtoZ(true);
    }else{
        sortUlAtoZ(false);
    }
    closeSortPopup();
}

function sortUlAtoZ(AtoZ){
    let songsToSort = playlistToSort.children;
    if(AtoZ){
        try {
            for (let i = 0; i < playlistToSort.children.length - 1; i++) {
                for (let j = i + 1; j < playlistToSort.children.length; j++) {
                    if(songsToSort[i].children[0].children[2].children[0].innerHTML > 
                        songsToSort[j].children[0].children[2].children[0].innerHTML){
                            let temp = songsToSort[j].innerHTML;
                            songsToSort[j].innerHTML = songsToSort[i].innerHTML;
                            songsToSort[i].innerHTML = temp;
                    }
                }
            }
        } catch (error) {
            
        }
    }else{
        try {
            for (let i = 0; i < playlistToSort.children.length - 1; i++) {
                for (let j = i + 1; j < playlistToSort.children.length; j++) {
                    if(songsToSort[i].children[0].children[2].children[0].innerHTML < 
                        songsToSort[j].children[0].children[2].children[0].innerHTML){
                            let temp = songsToSort[j].innerHTML;
                            songsToSort[j].innerHTML = songsToSort[i].innerHTML;
                            songsToSort[i].innerHTML = temp;
                    }
                }
            }
        } catch (error) {
            
        }
    }
}

// ----- VAULT

function openTheVault(){
    document.querySelector('.vaultSection').classList.toggle('vaultSectionOn');
    if(document.querySelector('.vaultSection').classList.contains('vaultSectionOn')){
        document.querySelector('.vaultPlayBtn').innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    }else{
        document.querySelector('.vaultPlayBtn').innerHTML = `<i class="fa-solid fa-play"></i>`;
    }
}

function closeTheVault(){
    document.querySelector('.vaultSection').classList.remove('vaultSectionOn');
    document.querySelector('.vaultPlayBtn').innerHTML = `<i class="fa-solid fa-play"></i>`;
}