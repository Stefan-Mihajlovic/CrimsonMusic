setHomeScreen();

/* ----- GET THE TIME ----- */

window.onload = getTime();
function getTime(){
    var d = new Date();
    var time = d.getHours();

    todEl = document.getElementById('timeOfDay');
    todEl2 = document.getElementById('timeOfDayNav');

    if (time < 12) {
        todEl.innerHTML = 'Good Morning';
        todEl2.innerHTML = 'Good Morning';
    }
    if (time >= 12 && time < 18) {
        todEl.innerHTML = 'Good Afternoon';
        todEl2.innerHTML = 'Good Afternoon';
    }
    if (time >= 18) {
        todEl.innerHTML = 'Good Evening';
        todEl2.innerHTML = 'Good Evening';
    }
}

/* ----- HIDE / SHOW HEADER ----- */

let header = document.getElementsByTagName("header")[0];

let main = document.getElementsByClassName("homeScreen")[0];
main.addEventListener('scroll', () => {
    if(main.scrollTop <= 50){
        header.classList.remove("headerHidden");
    }else{
        header.classList.add("headerHidden");
    }
})

let main2 = document.getElementsByClassName("searchScreen")[0];
main2.addEventListener('scroll', () => {
    if(main2.scrollTop <= 50){
        header.classList.remove("headerHidden");
    }else{
        header.classList.add("headerHidden");
    }
})

let main3 = document.getElementsByClassName("yoursScreen")[0];
main3.addEventListener('scroll', () => {
    if(main3.scrollTop <= 50){
        header.classList.remove("headerHidden");
    }else{
        header.classList.add("headerHidden");
    }
})

function showHeader(){
    header.classList.remove("headerHidden");
}

/* ----- SET SCREEN ----- */

let currentScreen = "Home";

function setScreen(screenToSet, clickedBtn, activeScreen){

    closePlaylistPage();
    closeArtistPage();
    closeCategoryPage();
    showHeader();

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
    }, 600);
    document.getElementsByTagName("nav")[0].classList.add("navClosed");
}

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpenTop");
    player.classList.remove("playerOpen");
    document.getElementsByTagName("nav")[0].classList.remove("navClosed");
}

const currentSongAudio = document.getElementById("currentSong");
let playingFrom = document.getElementById("playingFromSpan");

// PLAY THE SELECTED SONG

let isTheVaultOn = false;

function playerSelectedSong(songURL,songTitle,songCreator,imageURL,playedFrom){
    openMiniPlayer();

    currentSongAudio.src = songURL;

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

    currentSongAudio.currentTime = 0;
    currentSongAudio.play();

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

function setTheVault(){
    isTheVaultOn = true;
}

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
let sideBanner3 = document.getElementsByName("catBanner")[0];

screenScrollables.forEach((screen) => {
    screen.addEventListener("scroll", ()=>{
        if(screen.scrollTop > 175){
            screen.children[0].classList.add("pageBarOn");
        }else{
            screen.children[0].classList.remove("pageBarOn");
        }

        sideBanner1.style.transform = "translateY(-"+ screen.scrollTop / 5 +"px)";
        sideBanner2.style.transform = "translateY(-"+ screen.scrollTop / 5 +"px)";
        sideBanner3.style.transform = "translateY(-"+ screen.scrollTop / 5 +"px)";
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
}

function CloseMakePlaylistScreen(){
    makePlScreen.classList.remove("makePlaylistScreenOpen");
}

function changeMakePlaylistName(text){
    if(text != ""){
        document.getElementsByClassName("currentMakePlaylistName")[0].innerHTML = text;
    }else{
        document.getElementsByClassName("currentMakePlaylistName")[0].innerHTML = "My Playlist";
    }
}