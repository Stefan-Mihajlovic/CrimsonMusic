/* ----- GET THE TIME ----- */

window.onload = getTime();
function getTime(){
    var d = new Date();
    var time = d.getHours();

    todEl = document.getElementById('timeOfDay');
    todImg = document.getElementsByClassName("moodImage")[0];

    if (time < 12) {
        todEl.innerHTML = 'Good Morning';
        todImg.src = "images/AfternoonImg.svg";
    }
    if (time >= 12 && time < 18) {
        todEl.innerHTML = 'Good Afternoon';
        todImg.src = "images/AfternoonImg.svg";
    }
    if (time >= 18) {
        todEl.innerHTML = 'Good Evening';
        todImg.src = "images/AfternoonImg.svg";
    }
}



if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.querySelector('main').style.height = "calc(100vh - 195px)";
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