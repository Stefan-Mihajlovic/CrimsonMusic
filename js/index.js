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

/* ----- SET SCREEN ----- */

function setScreen(screenToSet, clickedBtn){
    let buttons = document.querySelectorAll("nav > button");
    buttons.forEach((button) => {
        button.classList.remove("activeScreen");
    });
    clickedBtn.classList.add("activeScreen");
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
    }, 100);
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
let isSongPaused = false;

function openBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.add("playerOpen");
    setTimeout(() => {
        player.classList.add("playerOpenTop");
    }, 400);
}

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpenTop");
    player.classList.remove("playerOpen");
}

const currentSongAudio = document.getElementById("currentSong");

// PLAY THE SELECTED SONG
function playerSelectedSong(songURL,songTitle,songCreator,imageURL){
    openMiniPlayer();

    currentSongAudio.src = songURL;
    currentSongAudio.play();

    let songBanners = document.getElementsByName("songBanner");
    let songTitles = document.getElementsByName("songTitle");
    let songArtists = document.getElementsByName("songArtist");

    songBanners.forEach((banner) => {
        banner.src = imageURL;
    });
    songTitles.forEach((title) => {
        title.innerHTML = songTitle;
    });
    songArtists.forEach((artist) => {
        artist.innerHTML = songCreator;
    });

}

// Open MINI PLAYER
function openMiniPlayer(){
    if(!isPlayerOpen){
        let player = document.getElementsByClassName("player")[0];
        player.style.opacity = "1";
        player.style.pointerEvents = "all";
    }
}

// PAUSE / PLAY THE CURRENT SONG
function pausePlayCurrentSong(){

    let songPlayBtns = document.getElementsByName("songPlayButton");

    if(isSongPaused){
        currentSongAudio.play();

        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-play");
            button.children[0].classList.add("fa-circle-pause");
        });

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

let songTime = document.getElementById("currentSongInput");

currentSongAudio.addEventListener('ended', () => {
    let songPlayBtns = document.getElementsByName("songPlayButton");

    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-pause");
        button.children[0].classList.add("fa-circle-play");
    });
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