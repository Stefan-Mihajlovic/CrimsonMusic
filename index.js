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

/* ----- SET SCREEN HEIGHT ON IPHONES/IPADS/IPODS ----- */

if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.querySelector('main').style.height = "calc(100vh - 265px)";
  }else{
    document.querySelector('main').style.height = "calc(100vh - 135px)";
  }

/* ----- SET SCREEN ----- */

function setScreen(screenToSet, clickedBtn){
    let buttons = document.querySelectorAll("nav > button");
    buttons.forEach((button) => {
        button.classList.remove("activeScreen");
    });
    clickedBtn.classList.add("activeScreen");
}

/* ----- SET ACCOUNT INFO ----- */

let loggedIn = false;

let accountNames = document.getElementsByName("accountName");
accountNames.forEach((accountName) => {
    if(!loggedIn){
        accountName.innerHTML = "Guest";
    }else{
        accountName.innerHTML = "Guest";
    }
})