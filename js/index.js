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

function openBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.add("playerOpen");
}

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpen");
}