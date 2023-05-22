setHomeScreen();

/* ----- GET THE TIME ----- */

window.onload = getTime();
function getTime(){
    var d = new Date();
    var time = d.getHours();

    todEl = document.getElementById('timeOfDay');
    todImg = document.getElementsByClassName("moodImage")[0];

    if (time < 12) {
        todEl.innerHTML = 'Good Morning';
        todImg.classList.remove("fa-sun");
        todImg.classList.remove("fa-moon");
        todImg.classList.remove("rotatingII");
        todImg.classList.remove("rotatingI");
        todImg.classList.add("fa-spa");
    }
    if (time >= 12 && time < 18) {
        todEl.innerHTML = 'Good Afternoon';
        todImg.classList.remove("fa-spa");
        todImg.classList.remove("fa-moon");
        todImg.classList.remove("rotatingII");
        todImg.classList.add("rotatingI");
        todImg.classList.add("fa-sun");
    }
    if (time >= 18) {
        todEl.innerHTML = 'Good Evening';
        todImg.classList.remove("fa-sun");
        todImg.classList.remove("fa-spa");
        todImg.classList.remove("rotatingI");
        todImg.classList.add("rotatingII");
        todImg.classList.add("fa-moon");
    }
}

/* ----- HIDE / SHOW HEADER ----- */

let header = document.getElementsByTagName("header")[0];
let currentScrollMain = 0;

let main = document.getElementsByClassName("homeScreen")[0];
main.addEventListener('scroll', () => {
    if(currentScrollMain > main.scrollTop){
        header.classList.remove("headerHidden");
    }else{
        header.classList.add("headerHidden");
    }
    currentScrollMain = main.scrollTop;
})

function showHideHeader(){
    header.classList.add("headerHidden");
}

/* ----- SET SCREEN ----- */

let currentScreen = "Home";

function setScreen(screenToSet, clickedBtn, activeScreen){

    closePlaylistPage();
    closeArtistPage();

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
        navigator.vibrate(50);
    });
});

function buttonClickAnim(button){
    button.classList.add("buttonClicked");
    setTimeout(() => {
        button.classList.remove("buttonClicked");
    }, 100);
}

function clickEffect(button){
    if(button !== undefined){
        button.classList.add("buttonClicked");
        navigator.vibrate(50);
        setTimeout(() => {
            button.classList.remove("buttonClicked");
        }, 100);
    }
}

/* ----- LOGIN SCREEN ----- */

function openLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];

    loginScreen.classList.add("loginScreenOpen");
}

function closeLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];

    loginScreen.classList.remove("loginScreenOpen");
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

function openBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.add("playerOpen");
    setTimeout(() => {
        player.classList.add("playerOpenTop");
    }, 380);
}

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpenTop");
    player.classList.remove("playerOpen");
}

const currentSongAudio = document.getElementById("currentSong");
let playingFrom = document.getElementById("playingFromSpan");

// PLAY THE SELECTED SONG

let isTheVaultOn = false;

function playerSelectedSong(songURL,songTitle,songCreator,imageURL,playedFrom){
    openMiniPlayer();

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

    if(playedFrom === "TheVault"){
        isTheVaultOn = true;
    }else{
        isTheVaultOn = false;
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

currentSongAudio.addEventListener('ended', () => {
    if(isRepeatOn){
        currentSongAudio.currentTime = 0;
        currentSongAudio.play();
    }else{
        if(playingFrom.innerHTML === "Playlist"){

        }
        if(isTheVaultOn){
            playRandomSongForTheVault();
        }
        else{
            let songPlayBtns = document.getElementsByName("songPlayButton");
    
            songPlayBtns.forEach((button) => {
                button.children[0].classList.remove("fa-circle-pause");
                button.children[0].classList.add("fa-circle-play");
            });
    
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

screenScrollables.forEach((screen) => {
    screen.addEventListener("scroll", ()=>{
        if(screen.scrollTop > 175){
            screen.children[0].classList.add("pageBarOn");
        }else{
            screen.children[0].classList.remove("pageBarOn");
        }

        sideBanner1.style.transform = "translateY(-"+ screen.scrollTop / 5 +"px)";
        sideBanner2.style.transform = "translateY(-"+ screen.scrollTop / 5 +"px)";
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