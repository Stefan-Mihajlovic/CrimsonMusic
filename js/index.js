setHomeScreen();

let brojPesama = 31;
let brojArtista = 18;
let brojPlejlista = 5;
let brojKategorija = 14;

/* ----- GET THE TIME ----- */

window.onload = getTime();
function getTime(){
    var d = new Date();
    var time = d.getHours();

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
}

/* ----- SET SCREEN ----- */

let currentScreen = "homeScreen";

function setScreen(screenToSet, clickedBtn, activeScreen){

    closePlaylistPage();
    closeArtistPage();
    closeCategoryPage();
    closeLoginScreen();

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

        let bubble = document.getElementsByClassName("bubble")[0];
        bubble.classList.remove("yoursScreenBubble");
        bubble.classList.remove("searchScreenBubble");
        bubble.classList.remove("homeScreenBubble");
        bubble.classList.add(activeScreen+"Bubble");

        currentScreen = activeScreen;
    }

    let activeMain = document.getElementsByClassName(activeScreen)[0];
    activeMain.classList.add("activeMain");

    if(activeScreen === "searchScreen"){
        let searchList = document.getElementsByClassName("searchList")[0];
        let searchInput = document.getElementById("searchInput");

        searchList.classList.remove("searchListOpen");
        searchList.innerHTML = "";
        searchInput.value = "";
    }
}

function setHomeScreen(){
    document.getElementsByClassName("homeScreen")[0].classList.add("activeMain");
}

/* ----- Button clicks ----- */

document.querySelectorAll("button").forEach((button) => {
    button.addEventListener('click', () => {
        buttonClickAnim(button);
    });
});

function buttonClickAnim(button){
    button.classList.add("buttonClicked");
    setTimeout(() => {
        button.classList.remove("buttonClicked");
    }, 150);
}

function clickEffect(button){
    if(button !== undefined){
        button.classList.add("buttonClicked");
        setTimeout(() => {
            button.classList.remove("buttonClicked");
        }, 150);
    }
}

const monopToggle = document.getElementById('monopToggle');
monopToggle.addEventListener('click', () => {
    if(monopToggle.checked){
        document.getElementsByClassName('songBackdrop')[0].style.display = 'none';
    }else{
        document.getElementsByClassName('songBackdrop')[0].style.display = 'block';
    }
})

let nextSongBtn = 0,prevSongBtn = 0,currentSongBtn = 0;
let isAutoPlayOn = true;
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
    if(nextSongBtn != 0){
        nextSongBtn.children[1].click();
    }
})

const addToPlBtn = document.querySelector('#addToPlBtn');
addToPlBtn.addEventListener('click', addToPlFunc);

function addToPlFunc(){
    popupScreen.classList.add("popupPl");
    LoadUserPlaylistsPopup(addToPlBtn.getAttribute('name'));
    this.removeEventListener('click', addToPlFunc);
    addToPlBtn.onclick = () => {};
}

/* ----- LOGIN SCREEN ----- */

function openLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    loginScreen.classList.add("loginScreenOpen");
}

function closeLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    loginScreen.classList.remove("loginScreenOpen");
    setTimeout(() => {
        loginScreen.style.left = 'auto';
    }, 350);
}

// Switch from register to login screen
function RegToLog(){
    let titles = document.getElementsByName("regLogTitle");
    let emailInput = document.getElementById("email");
    let alreadyAcc = document.getElementById("alreadtAcc");
    let registerBtn = document.getElementById("registerBtn");
    let loginBtn = document.getElementById("loginBtn");

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
    document.getElementsByClassName("loggedInScreen")[0].style.display = "flex";
    document.getElementsByName("regLogTitle")[0].innerHTML = "Account";

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

function playerSelectedSong(songURL,songTitle,songCreator,imageURL,playedFrom,playedFromBtn,id){
    openMiniPlayer();

    currentSongAudio.autoplay = true;
    currentSongAudio.src = songURL;
    currentSongAudio.play();

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

    playingFrom.innerHTML = playedFrom;

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
    checkLyrics.setAttribute('onclick', `doesSongHaveLyrics(`+ id +`)`);
    checkLyrics.click();

    const playerLyricsBtn = document.getElementById("playerLyricsBtn");
    playerLyricsBtn.setAttribute('onclick', `turnLyrcis(`+ id +`)`);

    const playerLikeBtn = document.getElementById("playerLikeBtn");
    playerLikeBtn.onclick = () => {
        addSongToLiked(id);
    }

    const miniPlayerLikeBtn = document.getElementById("miniPlayerLikeBtn");
    miniPlayerLikeBtn.onclick = () => {
        addSongToLiked(id);
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
    if(!isPlayerOpen){
        let player = document.getElementsByClassName("player")[0];
        player.style.opacity = "1";
        player.style.pointerEvents = "all";
        player.style.transform = "translateY(0%)";
        isPlayerOpen = true;
    }
}

// PAUSE / PLAY THE CURRENT SONG

function pausePlayCurrentSong(from){

    let songPlayBtns = document.getElementsByName("songPlayButton");
    let playPlaylistBtn = document.getElementById("playPlaylistBtn");
    let playlistQueue = document.getElementsByClassName("playlistSongsList")[0].children;

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
            }
        }else{
            currentSongAudio.play();
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

        isSongPaused = true;
    }
}

let songTime = document.getElementById("currentSongInput");

let isRepeatOn = false;

function setTheVault(){
    isTheVaultOn = true;
}

currentSongAudio.addEventListener('ended', () => {
    if(isRepeatOn){
        currentSongAudio.currentTime = 0;
        currentSongAudio.play();
    }else{
        if(isTheVaultOn){
            playRandomSongForTheVault();
        }
        else if(isAutoPlayOn){
            if(nextSongBtn != 0){
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

            isSongPaused = true;
        }
    }
});

let repeatBtn = document.getElementById("repeatBtn");
repeatBtn.addEventListener('click', () => {
    isRepeatOn = !isRepeatOn;
    repeatBtn.classList.toggle("buttonTurnedOn");
});

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
})

// CHECK THE CHIPS ON SEARCH

let allChips = document.getElementsByName("allChip");

function checkTheChip(){
    allChips.forEach((chip) => {
        if(chip.checked){
            chip.classList.add("allchipCh");
        }else{
            chip.classList.remove("allchipCh");
        }
    })
}


// SCROLL ON PAGEBARS

let screenScrollables = document.getElementsByName("screenScrollable");
let sideBanner1 = document.getElementsByName("artistBanner")[0];
let sideBanner2 = document.getElementsByName("playlistBanner")[0];
let sideBanner3 = document.getElementsByName("catBanner")[0];

screenScrollables.forEach((screen) => {
    screen.addEventListener("scroll", ()=>{

        if(screen.id !== "screenScrollableCat"){
            if(screen.scrollTop > 170){
                screen.children[2].children[1].children[0].style.opacity = 1 - (screen.scrollTop/124.5 - 1);
            }else{
                screen.children[2].children[1].children[0].style.opacity = 1;
            }
        }

        if(screen.scrollTop > 250){
            screen.children[0].classList.add("pageBarOn");
            screen.children[1].classList.add("pageBarOn2");
        }else{
            screen.children[0].classList.remove("pageBarOn");
            screen.children[1].classList.remove("pageBarOn2");
        }

        sideBanner1.style.transform = "translateY(-"+ screen.scrollTop / 3 +"px)";
        sideBanner2.style.transform = "translateY(-"+ screen.scrollTop / 3 +"px)";
        sideBanner3.style.transform = "translateY(-"+ screen.scrollTop / 3 +"px)";
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

function OpenMakePlaylistScreen(){
    makePlScreen.classList.add("makePlaylistScreenOpen");
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");
}

function CloseMakePlaylistScreen(){
    makePlScreen.classList.remove("makePlaylistScreenOpen");
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

function openPopup(type,src,art,nam,id,isLikedPage){
    const popupWrapper = document.getElementById("popupWrapper");
    popupWrapper.classList.add("popupOpen");

    getArtistId(art.split(',')[0]);

    const songPopupBody = document.getElementsByClassName("songPopupBody")[0];
    const playlistPopupBody = document.getElementsByClassName("playlistPopupBody")[0];

    const popupImages = document.getElementsByName("popupImage");
    const popupSongTitle = document.getElementsByName("popupSongTitle");
    const popupArtist = document.getElementsByName("popupArtist");

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
    if(isLikedPage){
        likeSongBtn.addEventListener('click', () => {
            addSongToLiked(id);
            likeSongBtn.classList.add("likeBtnAnim");
            setTimeout(() => {
                likeSongBtn.classList.remove("likeBtnAnim");
            }, 500);
        })
    }else{
        likeSongBtn.addEventListener('click', () => {
            addSongToLiked(id);
            likeSongBtn.classList.add("likeBtnAnim");
            setTimeout(() => {
                likeSongBtn.classList.remove("likeBtnAnim");
            }, 500);
        })
    }
}

function closePopup(){
    const popupWrapper = document.getElementById("popupWrapper");
    popupWrapper.classList.remove("popupOpen");

    const popupMyPlaylists = document.querySelector('.popupMyPlaylists');
    popupScreen.classList.remove('popupPl');
    popupMyPlaylists.innerHTML = "";
    addToPlBtn.addEventListener('click', addToPlFunc);
}

// ----- SET APP THEME

function setAppTheme(userTheme){

    if(userTheme === "Dark"){
        setDarkTheme();
    }else if(userTheme === "Light"){
        setLightTheme();
    }

    if(darkThemeInput.checked){
        setDarkTheme();
    }else{
        setLightTheme();
    }
}

function setDarkTheme(){

    let lightThemeInput = document.getElementById("lightThemeInput");
    let lightThemeInput2 = document.getElementById("lightThemeInput2");
    let darkThemeInput = document.getElementById("darkThemeInput");
    let darkThemeInput2 = document.getElementById("darkThemeInput2");
    
    lightThemeInput2.checked = false;
    darkThemeInput2.checked = true;

    document.documentElement.style.setProperty('--bodyBg', 'black');
    document.documentElement.style.setProperty('--playerColor', '#242027');
    document.documentElement.style.setProperty('--offWhite', '#DCD6F7');
    document.documentElement.style.setProperty('--darken', 'black');
    document.documentElement.style.setProperty('--allChColor', 'rgba(255, 255, 255, 0.2)');
    document.documentElement.style.setProperty('--yoursBubbleColor', 'rgb(90, 0, 27)');
    document.documentElement.style.setProperty('--pageBarColor', 'rgba(0, 0, 0, 0.8)');
    document.documentElement.style.setProperty('--offWhiteDark', '#8a85a1');
    document.documentElement.style.setProperty('--sidePageback', 'black');
    document.documentElement.style.setProperty('--mainColor', 'rgba(36, 34, 39, 0.6)');
    document.documentElement.style.setProperty('--mainColorLighter', 'rgba(21, 19, 23, 0.6)');
    document.documentElement.style.setProperty('--secondaryColor', 'rgba(19, 19, 19, 0.45)');
    document.documentElement.style.setProperty('--latestReleaseBox', '#100e1c');
    document.documentElement.style.setProperty('--vibeVault', 'rgba(27, 12, 52, 0.5)');
    document.documentElement.style.setProperty('--popupScreenBg', 'linear-gradient(0deg, rgb(57, 29, 107), rgba(0, 0, 0))');
    document.documentElement.style.setProperty('--footerBg', 'rgba(35, 29, 46, 0.7)');

    document.getElementsByName("accountPhoto").forEach((photo) => {
        photo.style.filter = "invert(0) brightness(1)";
    })

    accountTheme = "Dark";
}

function setLightTheme(){

    let lightThemeInput = document.getElementById("lightThemeInput");
    let lightThemeInput2 = document.getElementById("lightThemeInput2");
    let darkThemeInput = document.getElementById("darkThemeInput");
    let darkThemeInput2 = document.getElementById("darkThemeInput2");

    lightThemeInput2.checked = true;
    darkThemeInput2.checked = false;

    document.documentElement.style.setProperty('--bodyBg', '#ece8ff');
    document.documentElement.style.setProperty('--playerColor', '#c1bbc6');
    document.documentElement.style.setProperty('--offWhite', '#100e1c');
    document.documentElement.style.setProperty('--offWhiteDark', '#100e1c');
    document.documentElement.style.setProperty('--darken', '#ede7ff');
    document.documentElement.style.setProperty('--allChColor', 'rgba(0, 0, 0, 0.2)');
    document.documentElement.style.setProperty('--yoursBubbleColor', 'rgba(134, 69, 255, 0.25)');
    document.documentElement.style.setProperty('--pageBarColor', 'rgba(222, 213, 255, 0.6)');
    document.documentElement.style.setProperty('--sidePageback', 'linear-gradient(0deg, #ece8ff, rgba(134, 69, 255, 0.25))');
    document.documentElement.style.setProperty('--mainColor', 'rgba(220,220,220, 0.9)');
    document.documentElement.style.setProperty('--mainColorLighter', 'rgba(255, 255, 255, 0.5)');
    document.documentElement.style.setProperty('--latestReleaseBox', 'rgb(0,0,0,0.2)');
    document.documentElement.style.setProperty('--vibeVault', 'rgba(169, 141, 215, 0.3)');
    document.documentElement.style.setProperty('--popupScreenBg', 'linear-gradient(0deg, rgb(225, 185, 255), rgb(255, 255, 255))');
    document.documentElement.style.setProperty('--secondaryColor', 'rgba(230, 230, 230, 0.45)');
    document.documentElement.style.setProperty('--footerBg', 'rgba(192, 179, 219, 0.7)');

    document.getElementsByName("accountPhoto").forEach((photo) => {
        photo.style.filter = "invert(1) brightness(0)";
    })

    accountTheme = "Light";
}

// ----- PLAYER OPEN / CLOSE

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
    let opa = ((e.touches[0].clientY - offsetY) / window.outerWidth - 0.1);

    // Setting the transition to none on main and header
    document.getElementsByClassName(currentScreen)[0].classList.add("playerMovable");
    document.querySelector('header').classList.add("playerMovable");

    // Setting the opacity of main and header
    document.getElementsByClassName(currentScreen)[0].style.opacity = opa;
    document.querySelector('header').style.opacity = opa;
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

let isLyricsOn = false;

playerOpenDiv.addEventListener("touchstart", (e) => {
    // console.log("touched");
    movablePlayer.classList.add("playerOpen");
    document.getElementsByTagName("nav")[0].classList.add("navClosed");
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
})

// ----- playerDiv 2

const move2 = (e) => {
    currentTouchPos = (e.touches[0].clientY - offsetY);
    moveStarted = true;
    // console.log(currentTouchPos);
    // Update div pos based on new cursor pos
    if(currentTouchPos > -50){
        movablePlayer.classList.add("playerMovable");
        movablePlayer.style.top = `${e.touches[0].clientY - offsetY}px`;

        let opa = ((e.touches[0].clientY - offsetY) / window.outerWidth - 0.1);

        // Setting the transition to none on main and header
        document.getElementsByClassName(currentScreen)[0].classList.add("playerMovable");
        document.querySelector('header').classList.add("playerMovable");

        // Setting the opacity of main and header
        document.getElementsByClassName(currentScreen)[0].style.opacity = opa;
        document.querySelector('header').style.opacity = opa;
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

playerOpenDiv2.addEventListener("touchstart", (e) => {
    // console.log("touched");
    movablePlayer.classList.add("playerOpen");
    // Calc the initial offset Values
    offsetY = e.touches[0].clientY - movablePlayer.offsetTop;
    movablePlayer.style.top = `${e.touches[0].clientY - offsetY}px`;
    movablePlayer.classList.add("playerMovable");
    document.addEventListener("touchmove", move2);
    playerTouchStarted2 = true;
    moveStarted = false;
})

// ----- SIDE PAGES CLOSE

let offsetX;
const loginScreen = document.getElementsByClassName("loginScreen")[0];
const closeLoginScreenBtn = document.getElementById("closeLoginScreen");
let touchSideStarted = false;

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
const playlistScreen = document.getElementsByClassName("playlistScreen")[0];
const artistScreen = document.getElementsByClassName("artistScreen")[0];
const categoryScreen = document.getElementsByClassName("categoryScreen")[0];
const makePlaylistScreen = document.getElementsByClassName("makePlaylistScreen")[0];

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
    // console.log("touched");
    // Calc the initial offset Values
    offsetY = e.touches[0].clientY - popupScreen.offsetTop;
    popupScreen.style.top = `${e.touches[0].clientY - offsetY}px`;
    popupScreen.classList.add("playerMovable");
    document.addEventListener("touchmove", move3);
    playerTouchStarted3 = true;
    moveStarted = false;
})

// ----- TOUCH END

document.addEventListener("touchend", () => {
    if(playerTouchStarted){
        document.removeEventListener("touchmove", move);
        movablePlayer.classList.remove("playerMovable");
        document.getElementsByClassName(currentScreen)[0].classList.remove("playerMovable");
        document.querySelector('header').classList.remove("playerMovable");
        if(currentTouchPos < playerNormalPos - 125){
            movablePlayer.style.top = `calc(env(safe-area-inset-top) - 50px)`;
            document.getElementsByClassName(currentScreen)[0].style.opacity = '0';
            document.querySelector('header').style.opacity = '0';
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            isPlayerOpen = true;
            // console.log("less than 350!");
        }else{
            movablePlayer.style.top = `calc(${playerNormalPos}px + env(safe-area-inset-top) - env(safe-area-inset-bottom) * 0.6)`;
            movablePlayer.classList.remove("playerOpen");
            document.getElementsByTagName("nav")[0].classList.remove("navClosed");
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
            isPlayerOpen = false;
        }
        // console.log("touch ended");
        playerTouchStarted = false;
        if(!moveStarted){
            movablePlayer.classList.add("playerOpen");
            movablePlayer.style.top = `calc(env(safe-area-inset-top) - 50px)`;
            document.getElementsByTagName("nav")[0].classList.add("navClosed");
            document.getElementsByClassName(currentScreen)[0].style.opacity = '0';
            document.querySelector('header').style.opacity = '0';
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            isPlayerOpen = true;
        }
    }
    if(touchSideStarted && moveStarted){
        if(currentTouchPos < sidePageNormalPos + 75){
            document.removeEventListener("touchmove", moveSide);
            document.removeEventListener("touchmove", moveSide2);
            document.removeEventListener("touchmove", moveSide3);
            document.removeEventListener("touchmove", moveSide4);
            document.removeEventListener("touchmove", moveSide5);
            loginScreen.classList.remove("playerMovable");
            playlistScreen.classList.remove("playerMovable");
            artistScreen.classList.remove("playerMovable");
            categoryScreen.classList.remove("playerMovable");
            makePlaylistScreen.classList.remove("playerMovable");
            playlistScreen.style.left = '0';
            artistScreen.style.left = '0';
            categoryScreen.style.left = '0';
            loginScreen.style.left = '0';
            makePlaylistScreen.style.left = '0';
        }else{
            document.removeEventListener("touchmove", moveSide);
            document.removeEventListener("touchmove", moveSide2);
            document.removeEventListener("touchmove", moveSide3);
            document.removeEventListener("touchmove", moveSide4);
            document.removeEventListener("touchmove", moveSide5);
            loginScreen.classList.remove("playerMovable");
            playerTouchStarted2 = false;
            playlistScreen.classList.remove("playerMovable");
            artistScreen.classList.remove("playerMovable");
            categoryScreen.classList.remove("playerMovable");
            makePlaylistScreen.classList.remove("playerMovable");
            playlistScreen.style.left = '0';
            artistScreen.style.left = '0';
            categoryScreen.style.left = '0';
            loginScreen.style.left = '0';
            makePlaylistScreen.style.left = '0';
            closePlaylistPage();
            closeArtistPage();
            closeCategoryPage();
            closeLoginScreen();
            CloseMakePlaylistScreen();
            touchSideStarted = false;
            moveStarted = false;
        }
    }
    if(playerTouchStarted2 && moveStarted){
        if(currentTouchPos > 100){
            movablePlayer.classList.remove("playerMovable");
            movablePlayer.classList.remove("playerOpen");
            movablePlayer.style.top = `calc(${playerNormalPos}px + env(safe-area-inset-top) - env(safe-area-inset-bottom) * 0.6)`;
            document.removeEventListener("touchmove", move2);
            document.getElementsByTagName("nav")[0].classList.remove("navClosed");
            document.getElementsByClassName(currentScreen)[0].classList.remove("playerMovable");
            document.querySelector('header').classList.remove("playerMovable");
            document.getElementsByClassName(currentScreen)[0].style.opacity = '1';
            document.querySelector('header').style.opacity = '1';
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
    playerTouchStarted3 = false;
    playerTouchStarted2 = false;
    playerTouchStarted = false;
})

// ----- CLOSE THE POPUP ADD TO PLAYLIST UL

const closePopupPlBtn = document.querySelector('#closePopupPlBtn');
closePopupPlBtn.addEventListener('click', () => {
    popupScreen.classList.remove("popupPl");
    popupScreen.style.top = "calc(" + startPopupOffsetTop + "px + env(safe-area-inset-top)";
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