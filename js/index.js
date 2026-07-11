setHomeScreen();

// Checking if the user is accessing from mobile
let regexp = /android|iphone|kindle|ipad/i;
let isMobileDevice = regexp.test(navigator.userAgent);

if (!isMobileDevice && window.innerWidth > 760 && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    window.location.href = `https://crimsonmusicpc.netlify.app/`;
}

let brojPesama;
let brojArtista;
let brojPlejlista;
let brojKategorija = 14;

let isPerformanceModeOn = false;

const crimsonViewHideTimers = new WeakMap();

function showCrimsonView(view){
    if(!view){
        return;
    }

    clearTimeout(crimsonViewHideTimers.get(view));
    crimsonViewHideTimers.delete(view);
    const wasHidden = view.classList.contains("crimsonDisplayNone");
    view.classList.remove("crimsonDisplayNone");
    if(wasHidden){
        void view.offsetWidth;
    }
}

function hideCrimsonView(view, activeClass, delay = 450){
    if(!view){
        return;
    }

    clearTimeout(crimsonViewHideTimers.get(view));
    const timer = setTimeout(() => {
        if(!activeClass || !view.classList.contains(activeClass)){
            view.classList.add("crimsonDisplayNone");
        }
        crimsonViewHideTimers.delete(view);
    }, reduceAnimations ? 0 : delay);
    crimsonViewHideTimers.set(view, timer);
}

function initializeInactiveCrimsonViews(){
    const inactiveViews = [
        [".artistScreen", "artistScreenOpen"],
        [".playlistScreen", "playlistScreenOpen"],
        [".categoryScreen", "categoryPageOpen"],
        [".makePlaylistScreen", "makePlaylistScreenOpen"],
        [".bugReportScreen", "bugReportScreenOpen"],
        [".loginScreen", "loginScreenOpen"],
        [".LicenseAndProfileScreen", "LicenseAndProfileScreenOpen"],
        ["#popupWrapper", "popupOpen"],
        [".sortPopupWrapper", "sortPopupOpen"],
        [".queuePanel", "queuePanelOpen"],
        [".playerPopupBackdrop", "playerPopupBackdropOpen"],
        [".loginPopup", "loginPopupOn"]
    ];

    inactiveViews.forEach(([selector, activeClass]) => {
        const view = document.querySelector(selector);
        if(view && !view.classList.contains(activeClass)){
            view.classList.add("crimsonDisplayNone");
        }
    });
}

window.crimsonShowView = showCrimsonView;
window.crimsonHideView = hideCrimsonView;

const crimsonDefaultImages = {
    song: "images/defaultSong.webp",
    artist: "images/defaultArtist.webp",
    playlist: "images/defaultPlaylist.webp"
};

function isMissingImageSrc(src){
    const normalized = String(src || "").trim().toLowerCase();
    return !normalized || normalized === "undefined" || normalized === "null" || normalized.endsWith("/undefined") || normalized.endsWith("/null");
}

function getCrimsonImageType(element, preferredType){
    if(preferredType && crimsonDefaultImages[preferredType]){
        return preferredType;
    }

    const imageContext = [
        element?.getAttribute?.("alt"),
        element?.getAttribute?.("name"),
        element?.className,
        element?.id,
        element?.closest?.(".artistItem, .artistItemSearch") ? "artist" : "",
        element?.closest?.(".playlistItem, .playlistItemSearch, .favoritesItem") ? "playlist" : ""
    ].join(" ").toLowerCase();

    if(imageContext.includes("artist")){
        return "artist";
    }
    if(imageContext.includes("playlist") || imageContext.includes("vault")){
        return "playlist";
    }

    return "song";
}

function getCrimsonImageSrc(src, type = "song"){
    if(isMissingImageSrc(src)){
        return crimsonDefaultImages[type] || crimsonDefaultImages.song;
    }

    return src;
}

function applyCrimsonImageFallback(image, preferredType){
    if(!image || image.tagName !== "IMG"){
        return;
    }

    const imageType = getCrimsonImageType(image, preferredType);
    image.dataset.crimsonFallbackType = imageType;
    if(isMissingImageSrc(image.getAttribute("src"))){
        image.src = crimsonDefaultImages[imageType];
    }
}

function setupCrimsonImageFallbacks(){
    document.querySelectorAll("img").forEach((image) => applyCrimsonImageFallback(image));

    document.addEventListener("error", (event) => {
        const image = event.target;
        if(!image || image.tagName !== "IMG"){
            return;
        }

        const imageType = image.dataset.crimsonFallbackType || getCrimsonImageType(image);
        if(image.getAttribute("src") !== crimsonDefaultImages[imageType]){
            image.src = crimsonDefaultImages[imageType];
        }
    }, true);

    const imageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if(mutation.type === "attributes"){
                applyCrimsonImageFallback(mutation.target);
                return;
            }

            mutation.addedNodes.forEach((node) => {
                if(node.tagName === "IMG"){
                    applyCrimsonImageFallback(node);
                }
                node.querySelectorAll?.("img").forEach((image) => applyCrimsonImageFallback(image));
            });
        });
    });

    imageObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"]
    });
}

setupCrimsonImageFallbacks();
window.getCrimsonImageSrc = getCrimsonImageSrc;

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

const crimsonSearchHistoryLimit = 6;
const crimsonSearchHistoryScopes = {
    search: {
        key: "crimsonSearchHistory:search",
        inputId: "searchInput",
        submitId: "submitSearch",
        containerId: "searchHistorySearch"
    },
    yours: {
        key: "crimsonSearchHistory:yours",
        inputId: "searchYoursInput",
        submitId: "submitYoursSearch",
        containerId: "searchHistoryYours"
    }
};

function getCrimsonSearchHistory(scope){
    try {
        const scopeConfig = crimsonSearchHistoryScopes[scope];
        if(!scopeConfig){
            return [];
        }
        const parsedHistory = JSON.parse(localStorage.getItem(scopeConfig.key) || "[]");
        return Array.isArray(parsedHistory) ? parsedHistory.filter(Boolean).slice(0, crimsonSearchHistoryLimit) : [];
    } catch (error) {
        return [];
    }
}

function setCrimsonSearchHistory(scope, terms){
    const scopeConfig = crimsonSearchHistoryScopes[scope];
    if(!scopeConfig){
        return;
    }

    try {
        localStorage.setItem(scopeConfig.key, JSON.stringify(terms.slice(0, crimsonSearchHistoryLimit)));
    } catch (error) {
    }
}

function renderCrimsonSearchHistory(scope){
    const scopeConfig = crimsonSearchHistoryScopes[scope];
    if(!scopeConfig){
        return;
    }

    const historyContainer = document.getElementById(scopeConfig.containerId);
    if(!historyContainer){
        return;
    }

    const terms = getCrimsonSearchHistory(scope);
    historyContainer.innerHTML = "";
    historyContainer.classList.toggle("searchHistoryOpen", terms.length > 0);

    terms.forEach((term) => {
        const historyBtn = document.createElement("button");
        historyBtn.type = "button";
        historyBtn.textContent = term;
        historyBtn.addEventListener("click", () => {
            const input = document.getElementById(scopeConfig.inputId);
            const submit = document.getElementById(scopeConfig.submitId);
            if(input && submit){
                input.value = term;
                input.focus();
                submit.click();
            }
        });
        historyContainer.appendChild(historyBtn);
    });
}

function saveCrimsonSearchHistory(scope, term){
    const cleanTerm = (term || "").trim();
    if(cleanTerm.length === 0){
        return;
    }

    const terms = getCrimsonSearchHistory(scope).filter((savedTerm) => savedTerm.toLowerCase() !== cleanTerm.toLowerCase());
    terms.unshift(cleanTerm);
    setCrimsonSearchHistory(scope, terms);
    renderCrimsonSearchHistory(scope);
}

function initializeCrimsonSearchHistory(){
    renderCrimsonSearchHistory("search");
    renderCrimsonSearchHistory("yours");
}

function animateSearchCategories(){
    const categories = document.querySelector(".categories");
    if(!categories){
        return;
    }

    categories.classList.remove("categoriesStagger");
    void categories.offsetWidth;
    categories.classList.add("categoriesStagger");
    requestAnimationFrame(updateSearchCategoryParallax);
}

let searchCategoryParallaxFrame = null;
function updateSearchCategoryParallax(){
    const searchScreen = document.querySelector(".searchScreen.activeMain");
    if(!searchScreen || reduceAnimations){
        return;
    }

    const searchViewport = searchScreen.getBoundingClientRect();
    const viewportCenter = searchViewport.top + searchViewport.height * 0.5;
    searchScreen.querySelectorAll(".categoryArtwork").forEach((artwork) => {
        const cardRect = artwork.closest(".catItem")?.getBoundingClientRect();
        if(!cardRect){
            return;
        }
        const cardCenter = cardRect.top + cardRect.height * 0.5;
        const offset = Math.max(-18, Math.min(18, (viewportCenter - cardCenter) * 0.07));
        artwork.style.setProperty("--category-parallax", `${offset.toFixed(2)}px`);
    });
}

const searchParallaxContainer = document.querySelector(".searchScreen");
searchParallaxContainer?.addEventListener("scroll", () => {
    if(searchCategoryParallaxFrame || reduceAnimations){
        return;
    }
    searchCategoryParallaxFrame = requestAnimationFrame(() => {
        updateSearchCategoryParallax();
        searchCategoryParallaxFrame = null;
    });
}, { passive: true });

window.crimsonSaveSearchHistory = saveCrimsonSearchHistory;
window.crimsonRenderSearchHistory = renderCrimsonSearchHistory;
window.crimsonAnimateSearchCategories = animateSearchCategories;

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
        renderCrimsonSearchHistory("search");
        requestAnimationFrame(animateSearchCategories);
    }else{
        let header = document.querySelector('header');
        
        header.style.display = 'flex';
    }
}

function setHomeScreen(){
    document.getElementsByClassName("homeScreen")[0].classList.add("activeMain");
}

initializeCrimsonSearchHistory();

function crimsonPlayfulBurst(target, variant = "play"){
    if(!target || reduceAnimations){
        return;
    }

    const colorsByVariant = {
        like: ["#ff315f", "#ff6b8a", "#ff174f", "#ffd4df"],
        unlike: ["#ff6b8a", "#dcd6f7", "#8a85a1"],
        play: ["#ffffff", "#dcd6f7", "#f6f1ff", "#bca7ff"],
        playlist: ["#ffffff", "#f5edff", "#dcd6f7", "#ff6b8a"],
        follow: ["#ffffff", "#dcd6f7", "#bca7ff", "#ff6b8a"],
        unfollow: ["#8a85a1", "#dcd6f7", "#5f5a72"]
    };
    const colors = colorsByVariant[variant] || colorsByVariant.play;
    const rect = target.getBoundingClientRect();
    const burst = document.createElement("span");
    const particleCount = variant === "unlike" ? 2 : (variant === "play" || variant === "playlist" ? 8 : 10);

    burst.className = `playfulBurst playfulBurst-${variant}`;
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${rect.top + rect.height / 2}px`;

    if(variant === "unlike"){
        ["left", "right"].forEach((side) => {
            const half = document.createElement("span");
            half.className = `playfulHeartBreak playfulHeartBreak-${side}`;
            half.textContent = "♥";
            burst.appendChild(half);
        });
    }

    for(let i = 0; i < particleCount; i++){
        const particle = document.createElement("span");
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.55 - 0.275);
        const distance = 14 + Math.random() * (variant === "like" ? 22 : 18);
        const size = 2.5 + Math.random() * 3.5;

        particle.className = "playfulParticle";
        particle.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--burst-y", `${Math.sin(angle) * distance}px`);
        particle.style.setProperty("--burst-size", `${size}px`);
        particle.style.setProperty("--burst-color", colors[i % colors.length]);
        particle.style.setProperty("--burst-delay", `${Math.random() * 70}ms`);
        burst.appendChild(particle);
    }

    document.body.appendChild(burst);
    target.classList.remove("playfulButtonPop", "playfulButtonPopLike", "playfulButtonPopPlay");
    void target.offsetWidth;
    target.classList.add("playfulButtonPop", variant === "like" || variant === "unlike" ? "playfulButtonPopLike" : "playfulButtonPopPlay");

    window.setTimeout(() => {
        burst.remove();
        target.classList.remove("playfulButtonPop", "playfulButtonPopLike", "playfulButtonPopPlay");
    }, 900);
}

window.crimsonPlayfulBurst = crimsonPlayfulBurst;

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
    pmToggle.checked = true;
    isPerformanceModeOn = true;
    redrawAppTheme();
}

function turnPerformanceModeOff(){
    document.documentElement.style.setProperty("--gmBackdrop", "blur(20px) brightness(1.2)");
    document.documentElement.style.setProperty("--gmBackdropPlayer", "none");
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
function performSongChange(direction){
    if(direction === "previous"){
        if(prevSongBtn != 0){
            prevSongBtn.children[1].click();
        }else if(songQueue.history.length > 0){
            playQueueSong(songQueue.history[songQueue.history.length - 1]);
        }
        return;
    }

    if(isShuffleOn){
        PlayRandomSongShuffle();
    }else{
        playNextQueuedSong();
    }
}

function requestSongChange(direction){
    const canAnimate = movablePlayer?.classList.contains("playerOpen") && songSwipeViewport && !songSwipeState.isCommitting;
    if(canAnimate && getSongSwipePreview(direction)){
        prepareSongSwipeCards();
        completeSongSwipe(direction);
        return;
    }

    if(!songSwipeState.isCommitting){
        performSongChange(direction);
    }
}

backwardBtn.addEventListener('click', () => {
    requestSongChange("previous");
})

const forwardBtn = document.querySelector('#forward');
forwardBtn.addEventListener('click', () => {
    requestSongChange("next");
})

const addToPlBtn = document.querySelector('#addToPlBtn');
addToPlBtn.onclick = addToPlFunc;

function addToPlFunc(){
    if(UserSignedIn()){
        popupScreen.classList.add("popupPl");
        document.querySelector('.popupMyPlaylists').innerHTML = `<li class="popupPlaylistLoading">Loading playlists...</li>`;
        LoadUserPlaylistsPopup(addToPlBtn.getAttribute('name'));
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

const queuePanel = document.getElementById("queuePanel");
const queueList = document.getElementById("queueList");
const queueSourceName = document.getElementById("queueSourceName");
const playerPopupBackdrop = document.getElementById("playerPopupBackdrop");
const queuePlayingFrom = document.getElementById("queuePlayingFrom");
const queueTabs = document.querySelector(".queueTabs");
const queueLyricsBody = document.getElementById("queueLyricsBody");
const queueRelatedBody = document.getElementById("queueRelatedBody");
let isQueueOpen = false;
let currentPlayerPopupTab = "queue";
let currentPlayerSongId = null;
let currentPlayerSongPopup = null;
let songQueue = {
    sourceName: "Your queue",
    current: null,
    history: [],
    upcoming: []
};

function resetPlayerPopupScroll(){
    queueList?.scrollTo(0, 0);
    queueLyricsBody?.scrollTo(0, 0);
    queueRelatedBody?.scrollTo(0, 0);
}

function setPlayerPopupTab(tabName){
    currentPlayerPopupTab = tabName || "queue";
    queueTabs?.setAttribute("data-active-tab", currentPlayerPopupTab);
    document.querySelectorAll("[data-player-tab]").forEach((button) => {
        button.classList.toggle("queueTabActive", button.getAttribute("data-player-tab") === currentPlayerPopupTab);
    });
    document.querySelectorAll(".playerPopupContent").forEach((content) => {
        content.classList.remove("playerPopupContentActive");
    });

    if(queuePlayingFrom){
        queuePlayingFrom.style.display = currentPlayerPopupTab === "queue" ? "flex" : "none";
    }

    if(currentPlayerPopupTab === "lyrics"){
        queueLyricsBody?.classList.add("playerPopupContentActive");
        if(currentPlayerSongId != null && typeof window.crimsonLoadLyricsIntoPlayerPopup === "function"){
            window.crimsonLoadLyricsIntoPlayerPopup(currentPlayerSongId);
        }
    }else if(currentPlayerPopupTab === "related"){
        queueRelatedBody?.classList.add("playerPopupContentActive");
        loadRelatedSongs();
    }else{
        queueList?.classList.add("playerPopupContentActive");
        renderSongQueue();
    }

    resetPlayerPopupScroll();
}

function openPlayerPopup(tabName = "queue"){
    if(!queuePanel){
        return;
    }

    showCrimsonView(queuePanel);
    showCrimsonView(playerPopupBackdrop);
    queuePanel.style.setProperty("--player-popup-full-top", `${getPlayerPopupFullscreenTop()}px`);
    isQueueOpen = true;
    queuePanel.classList.add("queuePanelOpen");
    queuePanel.setAttribute("aria-hidden", "false");
    playerPopupBackdrop?.classList.add("playerPopupBackdropOpen");
    setPlayerPopupTab(tabName);
}

function closePlayerPopup(){
    if(!queuePanel){
        return;
    }

    isQueueOpen = false;
    queuePanel.classList.remove("queuePanelOpen");
    queuePanel.classList.remove("playerPopupFull");
    queuePanel.classList.remove("queuePanelDragging");
    queuePanel.classList.remove("playerMovable");
    queuePanel.setAttribute("aria-hidden", "true");
    queuePanel.style.transform = "";
    queuePanel.style.removeProperty("--player-popup-full-top");
    queuePanel.style.top = "";
    queuePanel.style.height = "";
    playerPopupBackdrop?.classList.remove("playerPopupBackdropOpen");
    hideCrimsonView(queuePanel, "queuePanelOpen");
    hideCrimsonView(playerPopupBackdrop, "playerPopupBackdropOpen", 220);
    setInteractionActive(false);
}

window.openPlayerPopup = openPlayerPopup;
window.closePlayerPopup = closePlayerPopup;

function getCurrentPlayerSourceElement(){
    if(songQueue.current?.element?.isConnected){
        return songQueue.current.element;
    }

    if(LastPlayedFromBtn?.isConnected){
        return LastPlayedFromBtn;
    }

    return null;
}

function setMainSourceScreen(screenClass){
    const screenNavMap = {
        homeScreen: {
            title: "Home",
            button: ".HomeBtnNav"
        },
        searchScreen: {
            title: "Search",
            button: ".SearchBtnNav"
        },
        yoursScreen: {
            title: "Playlists",
            button: ".LibraryBtnNav"
        }
    };
    const screenConfig = screenNavMap[screenClass];
    const navButton = screenConfig ? document.querySelector(screenConfig.button) : null;

    if(screenConfig && navButton && typeof setScreen === "function"){
        setScreen(screenConfig.title, navButton, screenClass);
        return;
    }

    document.querySelectorAll("main").forEach((main) => {
        main.classList.remove("activeMain");
    });
    document.querySelector(`.${screenClass}`)?.classList.add("activeMain");
    currentScreen = screenClass;
}

function revealSideSourceScreen(sourceScreen){
    if(!sourceScreen){
        return;
    }

    showCrimsonView(sourceScreen);
    document.getElementsByClassName(currentScreen)[0]?.classList.add("mainToSide");
    sourceScreen.classList.add("screenOpenOnTop");
    if(lastOpenSideScreen && lastOpenSideScreen !== sourceScreen){
        lastOpenSideScreen.classList.remove("screenOpenOnTop");
    }
    lastOpenSideScreen = sourceScreen;

    if(sourceScreen.classList.contains("artistScreen")){
        sourceScreen.classList.add("artistScreenOpen");
    }else if(sourceScreen.classList.contains("playlistScreen")){
        sourceScreen.classList.add("playlistScreenOpen");
    }else if(sourceScreen.classList.contains("categoryScreen")){
        sourceScreen.classList.add("categoryPageOpen");
    }
}

function revealMainSourceScreen(sourceScreen){
    if(!sourceScreen){
        return;
    }

    if(sourceScreen.classList.contains("homeScreen")){
        setMainSourceScreen("homeScreen");
    }else if(sourceScreen.classList.contains("searchScreen")){
        setMainSourceScreen("searchScreen");
    }else if(sourceScreen.classList.contains("yoursScreen")){
        setMainSourceScreen("yoursScreen");
    }
}

function scrollSourceElementIntoView(sourceElement){
    requestAnimationFrame(() => {
        sourceElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    });
}

function openCurrentPlayerSource(){
    const sourceElement = getCurrentPlayerSourceElement();
    const sourceName = songQueue.sourceName || document.getElementById("playingFromSpan")?.textContent || "";

    closeBigPlayer();

    if(sourceElement){
        const sourceScreen = sourceElement.closest(".artistScreen, .playlistScreen, .categoryScreen, .homeScreen, .searchScreen, .yoursScreen");
        if(sourceScreen?.matches(".artistScreen, .playlistScreen, .categoryScreen")){
            revealSideSourceScreen(sourceScreen);
        }else{
            revealMainSourceScreen(sourceScreen);
        }
        scrollSourceElementIntoView(sourceElement);
        return;
    }

    if(sourceName === "Home"){
        setMainSourceScreen("homeScreen");
    }else if(sourceName === "Search"){
        setMainSourceScreen("searchScreen");
    }else if(sourceName === "Playlists" || sourceName === "Library"){
        setMainSourceScreen("yoursScreen");
    }else if(sourceName && sourceName !== "Your queue" && sourceName !== "Autoplay" && typeof openArtistPageByName === "function"){
        openArtistPageByName(sourceName);
    }
}

function updateQueueSourceAction(){
    if(!queuePlayingFrom){
        return;
    }

    const hasSourceTarget = !!getCurrentPlayerSourceElement() || !["", "Your queue", "Autoplay"].includes(songQueue.sourceName || "");
    queuePlayingFrom.classList.toggle("queuePlayingFromClickable", hasSourceTarget);
    queuePlayingFrom.setAttribute("role", "button");
    queuePlayingFrom.setAttribute("tabindex", hasSourceTarget ? "0" : "-1");
    queuePlayingFrom.setAttribute("aria-label", hasSourceTarget ? `Open ${songQueue.sourceName || "song source"}` : "Song source");
}

function getSongDurationText(){
    if(!Number.isFinite(currentSongAudio.duration)){
        return "";
    }

    let min = Math.floor(currentSongAudio.duration / 60);
    let sec = Math.floor(currentSongAudio.duration % 60);
    if(sec < 10){
        sec = `0${sec}`;
    }
    return `${min}:${sec}`;
}

function parseSongItem(songLi, fallbackSource){
    if(!songLi || !songLi.querySelector){
        return null;
    }

    const clickDiv = songLi.querySelector(".songClickDiv");
    const clickHandler = clickDiv ? clickDiv.getAttribute("onclick") : "";
    const args = [...clickHandler.matchAll(/'([^']*)'/g)].map((match) => match[1]);

    if(args.length < 7){
        return null;
    }

    const title = songLi.querySelector(".songText h2")?.textContent || args[1];
    const creator = songLi.querySelector(".songText h3")?.textContent || args[2];
    const image = args[3];
    const imageSmall = songLi.querySelector(".songInfo img")?.src || image;

    return {
        url: args[0],
        title: title,
        creator: creator,
        image: image,
        imageSmall: imageSmall,
        color: args[4],
        source: args[5] || fallbackSource || "Your queue",
        id: args[6],
        element: songLi
    };
}

function getCurrentSongItem(songURL,songTitle,songCreator,imageURL,songColor,playedFrom,playedFromBtn,id){
    const imageSmall = playedFromBtn?.querySelector?.(".songInfo img")?.src || imageURL;
    return {
        url: songURL,
        title: songTitle,
        creator: songCreator,
        image: imageURL,
        imageSmall: imageSmall,
        color: songColor,
        source: getPlayedFromName(playedFrom, playedFromBtn),
        id: id,
        element: playedFromBtn && playedFromBtn.querySelector ? playedFromBtn : null
    };
}

function getPlayedFromName(playedFrom, playedFromBtn){
    if(playedFrom && playedFrom !== "undefined"){
        return playedFrom;
    }

    const parentList = playedFromBtn && playedFromBtn.parentElement ? playedFromBtn.parentElement : null;
    const parentSource = parentList ? parentList.getAttribute("name") : "";
    return parentSource || "Your queue";
}

function buildQueueFromSongList(currentItem, playedFromBtn, playedFrom){
    let history = [];
    let upcoming = [];

    if(playedFromBtn && playedFromBtn.parentElement){
        const songList = Array.from(playedFromBtn.parentElement.children);
        const currentIndex = songList.indexOf(playedFromBtn);

        history = songList.slice(0, currentIndex).map((item) => parseSongItem(item, playedFrom)).filter(Boolean);
        upcoming = songList.slice(currentIndex + 1).map((item) => parseSongItem(item, playedFrom)).filter(Boolean);
    }

    songQueue = {
        sourceName: playedFrom || currentItem.source || "Your queue",
        current: currentItem,
        history: history,
        upcoming: upcoming
    };

    fillQueueWithRandomSongs();
    renderSongQueue();
}

function randomSongId(excludedIds = []){
    const songCount = window.crimsonSongCount || 0;
    if(songCount < 1){
        return null;
    }

    let attempts = 0;
    while(attempts < 40){
        const id = String(Math.floor(Math.random() * songCount) + 1);
        if(!excludedIds.includes(id)){
            return id;
        }
        attempts++;
    }

    return String(Math.floor(Math.random() * songCount) + 1);
}

async function fillQueueWithRandomSongs(){
    if(typeof window.crimsonGetSongById !== "function"){
        renderSongQueue();
        return;
    }

    const excludedIds = [
        ...songQueue.history.map((song) => String(song.id)),
        songQueue.current ? String(songQueue.current.id) : "",
        ...songQueue.upcoming.map((song) => String(song.id))
    ];

    while(songQueue.upcoming.length < 12){
        const id = randomSongId(excludedIds);
        if(!id){
            break;
        }

        excludedIds.push(id);
        const song = await window.crimsonGetSongById(id);
        if(song){
            songQueue.upcoming.push({
                url: song.songURL,
                title: song.title,
                creator: song.creator,
                image: song.image,
                imageSmall: song.imageSmall || song.image,
                color: song.color,
                source: "Autoplay",
                id: id,
                element: null
            });
            renderSongQueue();
        }
    }
}

function renderSongQueue(){
    if(!queuePanel || !queueList){
        return;
    }

    queueSourceName.textContent = songQueue.sourceName || "Your queue";
    updateQueueSourceAction();
    queueList.innerHTML = "";

    const queueRows = [
        ...songQueue.history.map((song) => ({...song, state: "played"})),
        ...(songQueue.current ? [{...songQueue.current, state: "current"}] : []),
        ...songQueue.upcoming.map((song) => ({...song, state: "upcoming"}))
    ];

    if(queueRows.length === 0){
        queueList.innerHTML = `<li class="queueEmpty">Your queue is empty.</li>`;
        return;
    }

    queueRows.forEach((song) => {
        const row = document.createElement("li");
        row.className = `queueSong queueSong-${song.state} playerPopupStaggerItem`;
        row._crimsonContext = {
            type: "song",
            id: song.id,
            name: song.title,
            image: song.image,
            creator: song.creator
        };
        row.style.setProperty("--player-popup-item-index", queueList.children.length);
        row.innerHTML = `
            <div class="queueSongBanner">
                <div class="songVisualizer">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <img src="${song.imageSmall || song.image}" alt="songBanner">
            </div>
            <div class="queueSongText">
                <h3>${song.title}</h3>
                <p>${song.creator}</p>
            </div>
            <span>${song.state === "current" ? getSongDurationText() : ""}</span>
        `;
        row.onclick = () => {
            playQueueSong(song);
        }
        queueList.appendChild(row);
    });
}

async function loadRelatedSongs(){
    if(!queueRelatedBody || !currentPlayerSongPopup){
        return;
    }

    const requestedSongId = String(currentPlayerSongPopup.id || "");
    if(!requestedSongId){
        queueRelatedBody.innerHTML = `<p class="playerPopupLoading">No related songs yet.</p>`;
        return;
    }
    if(queueRelatedBody.dataset.relatedSongId === requestedSongId && queueRelatedBody.dataset.relatedState === "ready"){
        return;
    }

    queueRelatedBody.dataset.relatedSongId = requestedSongId;
    queueRelatedBody.dataset.relatedState = "loading";
    queueRelatedBody.innerHTML = `<p class="playerPopupLoading">Finding similar songs...</p>`;

    if(typeof window.crimsonGetRelatedSongs !== "function"){
        queueRelatedBody.innerHTML = `<p class="playerPopupLoading">Related songs are unavailable right now.</p>`;
        return;
    }

    try{
        const relatedSongs = await window.crimsonGetRelatedSongs(currentPlayerSongPopup);
        if(queueRelatedBody.dataset.relatedSongId !== requestedSongId){
            return;
        }

        queueRelatedBody.replaceChildren();
        if(!relatedSongs.length){
            queueRelatedBody.innerHTML = `<p class="playerPopupLoading">No related songs found yet.</p>`;
            queueRelatedBody.dataset.relatedState = "ready";
            return;
        }

        const relatedFragment = document.createDocumentFragment();
        relatedSongs.forEach((song, index) => {
            const row = document.createElement("article");
            row.className = "queueSong relatedSong playerPopupStaggerItem";
            row._crimsonContext = {
                type: "song",
                id: song.id,
                name: song.title,
                image: song.image,
                creator: song.creator
            };
            row.style.setProperty("--player-popup-item-index", index);
            row.innerHTML = `
                <div class="queueSongBanner">
                    <img src="${song.imageSmall || song.image}" alt="${song.title} cover">
                </div>
                <div class="queueSongText">
                    <h3>${song.title}</h3>
                    <p>${song.creator}</p>
                </div>
                <span class="relatedSongReason">${song.reason}</span>
            `;
            row.addEventListener("click", () => {
                playerSelectedSong(song.url, song.title, song.creator, song.image, song.color, "Related", 0, song.id, {
                    sourceName: "Related",
                    preserveQueue: true
                });
            });
            relatedFragment.appendChild(row);
        });
        queueRelatedBody.appendChild(relatedFragment);
        queueRelatedBody.dataset.relatedState = "ready";
    }catch(error){
        if(queueRelatedBody.dataset.relatedSongId === requestedSongId){
            queueRelatedBody.innerHTML = `<p class="playerPopupLoading">Could not load related songs.</p>`;
            queueRelatedBody.dataset.relatedState = "error";
        }
    }
}

const queuePopupBtn = document.getElementById("queuePopupBtn");
if(queuePopupBtn){
    queuePopupBtn.onclick = () => {
        openPlayerPopup("queue");
    };
}

function toggleQueuePanel(tabName = "queue"){
    if(isQueueOpen && currentPlayerPopupTab === tabName){
        closePlayerPopup();
    }else{
        openPlayerPopup(tabName);
    }
}

function openCurrentSongOptionsPopup(){
    if(!currentPlayerSongPopup){
        return;
    }

    openPopup(
        "song",
        currentPlayerSongPopup.image,
        currentPlayerSongPopup.creator,
        currentPlayerSongPopup.title,
        currentPlayerSongPopup.id
    );
}

function playQueueSong(song){
    if(!song){
        return;
    }

    if(song.element){
        song.element.querySelector(".songClickDiv")?.click();
        return;
    }

    const sourceName = songQueue.sourceName || song.source || "Your queue";
    playerSelectedSong(song.url,song.title,song.creator,song.image,song.color,sourceName,0,song.id,{
        sourceName: sourceName,
        preserveQueue: true
    });
}

function playNextQueuedSong(){
    if(nextSongBtn != 0){
        nextSongBtn.children[1].click();
        return;
    }

    if(songQueue.upcoming.length > 0){
        playQueueSong(songQueue.upcoming[0]);
        return;
    }

    fillQueueWithRandomSongs().then(() => {
        if(songQueue.upcoming.length > 0){
            playQueueSong(songQueue.upcoming[0]);
        }
    });
}

document.querySelectorAll("[data-player-tab]").forEach((button) => {
    button.addEventListener("click", () => {
        setPlayerPopupTab(button.getAttribute("data-player-tab"));
    });
});

if(queuePlayingFrom){
    queuePlayingFrom.addEventListener("click", () => {
        if(queuePlayingFrom.classList.contains("queuePlayingFromClickable")){
            openCurrentPlayerSource();
        }
    });

    queuePlayingFrom.addEventListener("keydown", (event) => {
        if((event.key === "Enter" || event.key === " ") && queuePlayingFrom.classList.contains("queuePlayingFromClickable")){
            event.preventDefault();
            openCurrentPlayerSource();
        }
    });
}

queueTabs?.setAttribute("data-active-tab", currentPlayerPopupTab);

/* ----- LOGIN SCREEN ----- */

function openLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    showCrimsonView(loginScreen);
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

    let buttons = document.querySelectorAll("nav > button");
    buttons.forEach((button) => {
        button.classList.remove("activeScreen");
    });
    const settingsNavBtn = document.querySelector('.settingsBtnNav');
    if(settingsNavBtn){
        settingsNavBtn.classList.add("activeScreen");
    }

    loginScreen.classList.add("loginScreenOpen");
}

function closeLoginScreen(){
    let loginScreen = document.getElementsByClassName("loginScreen")[0];
    document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");

    const settingsNavBtn = document.querySelector('.settingsBtnNav');
    if(settingsNavBtn){
        settingsNavBtn.classList.remove("activeScreen");
    }
    if(currentScreen == "homeScreen"){
        document.querySelector('.HomeBtnNav').classList.add("activeScreen");
    }else if(currentScreen == "searchScreen"){
        document.querySelector('.SearchBtnNav').classList.add("activeScreen");
    }else if(currentScreen == "yoursScreen"){
        document.querySelector('.LibraryBtnNav').classList.add("activeScreen");
    }

    loginScreen.classList.remove("playerMovable");

    loginScreen.classList.remove("loginScreenOpen");
    hideCrimsonView(loginScreen, "loginScreenOpen", 350);
    setTimeout(() => {
        loginScreen.style.left = 'auto';
    }, 350);
}

/* ----- LicenseS SCREEN ----- */

function openLicenseAndProfileScreen(isLicenseScreen){
    let LicenseAndProfileScreen = document.getElementsByClassName("LicenseAndProfileScreen")[0];
    showCrimsonView(LicenseAndProfileScreen);
    document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");

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
    hideCrimsonView(LicenseAndProfileScreen, "LicenseAndProfileScreenOpen", 350);
    setTimeout(() => {
        LicenseAndProfileScreen.style.left = 'auto';
    }, 350);
}

function openPhotoPicker(){
    const photoPicker = document.querySelector('.photoPicker');
    const presetGrid = document.querySelector('.presetPhotoGrid');
    const pickerIcon = document.querySelector('.accPhotoWrapper i');
    const shouldOpen = photoPicker.classList.contains('displayNone');

    photoPicker.classList.toggle('displayNone', !shouldOpen);
    presetGrid.classList.add('displayNone');

    pickerIcon.classList.toggle('fa-pen', !shouldOpen);
    pickerIcon.classList.toggle('fa-xmark', shouldOpen);
}

function showPresetPhotoPicker(){
    document.querySelector('.presetPhotoGrid').classList.toggle('displayNone');
}

function setPPSS(src){
    const accountPhoto = document.querySelector('.accPhotoWrapper').children[0];
    accountPhoto.src = src;
    let photoId = src.split('.png')[0].slice(-1);

    accountPhoto.setAttribute('data-photo-id', photoId);
    accountPhoto.removeAttribute('data-photo-url');
    accountPhoto.removeAttribute('data-photo-upload');

    window.dispatchEvent(new CustomEvent('profilePresetSelected'));

    document.querySelector('.photoPicker').classList.add('displayNone');
    document.querySelector('.presetPhotoGrid').classList.add('displayNone');
    document.querySelector('.accPhotoWrapper i').classList.remove('fa-xmark');
    document.querySelector('.accPhotoWrapper i').classList.add('fa-pen');
}

window.addEventListener('profilePhotoPickerClosed', () => {
    document.querySelector('.photoPicker').classList.add('displayNone');
    document.querySelector('.presetPhotoGrid').classList.add('displayNone');
    document.querySelector('.accPhotoWrapper i').classList.remove('fa-xmark');
    document.querySelector('.accPhotoWrapper i').classList.add('fa-pen');
});

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
    emailInput.style.display = "none";
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
    emailInput.style.display = "block";
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
    if(typeof window.finishAuthGatewayForLoggedIn === "function"){
        window.finishAuthGatewayForLoggedIn();
    }else{
        window.setAuthGatewayVisible?.(false);
    }

}

function setLoggedOutScreen(){
    document.getElementsByClassName("loginForm")[0].style.display = "flex";
    document.getElementsByClassName("loggedInScreen")[0].style.display = "none";
    document.getElementsByName("regLogTitle")[0].innerHTML = "Register";
    window.setAuthSessionLoading?.(false);
    window.setAuthGatewayVisible?.(true, 'welcome');
}

/* ----- PLAYER ----- */

let isPlayerOpen = false;
let isSongPaused = true;

function triggerMiniPlayerBounce(){
    const miniPlayer = document.getElementsByClassName("miniPlayer")[0];
    if(!miniPlayer || reduceAnimations){
        return;
    }

    miniPlayer.classList.remove("playerMiniBounce");
    void miniPlayer.offsetWidth;
    miniPlayer.classList.add("playerMiniBounce");
    setTimeout(() => {
        miniPlayer.classList.remove("playerMiniBounce");
    }, 460);
}

function closeBigPlayer(){
    let player = document.getElementsByClassName("player")[0];
    player.classList.remove("playerOpenTop");
    player.classList.remove("playerMovable");
    player.classList.remove("playerOpen");
    player.style.transform = "";
    triggerMiniPlayerBounce();
    closePlayerPopup();
    setPlayerNavClosed(false);
    // Setting the opacity to 1 on main and header
    document.getElementsByClassName(currentScreen)[0].style.opacity = '1';
    document.querySelector('header').style.opacity = '1';
    document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
    isPlayerOpen = false;
}

const currentSongAudio = document.getElementById("currentSong");
let playingFrom = document.getElementById("playingFromSpan");
let currentMediaSessionSong = null;

function mediaSessionIsAvailable(){
    return "mediaSession" in navigator;
}

function setMediaSessionAction(action, handler){
    if(!mediaSessionIsAvailable()){
        return;
    }

    try{
        navigator.mediaSession.setActionHandler(action, handler);
    }catch(error){
        // Some browsers expose Media Session but not every action.
    }
}

function setMediaSessionPosition(){
    if(!mediaSessionIsAvailable() || typeof navigator.mediaSession.setPositionState !== "function"){
        return;
    }

    const duration = currentSongAudio.duration;
    const position = currentSongAudio.currentTime;
    if(!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position)){
        return;
    }

    navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: currentSongAudio.playbackRate || 1,
        position: Math.min(position, duration)
    });
}

function updateMediaSessionPlaybackState(){
    if(!mediaSessionIsAvailable()){
        return;
    }

    navigator.mediaSession.playbackState = currentSongAudio.paused ? "paused" : "playing";
    setMediaSessionPosition();
}

function updateMediaSessionMetadata(songTitle, songCreator, imageURL, playedFrom){
    if(!mediaSessionIsAvailable() || typeof MediaMetadata === "undefined"){
        return;
    }

    const artworkURL = imageURL ? new URL(imageURL, document.baseURI).href : new URL("images/CrimsonLogo.png", document.baseURI).href;
    currentMediaSessionSong = {
        title: songTitle || "Crimson Music",
        artist: songCreator || "",
        album: playedFrom || "Crimson Music",
        artwork: artworkURL
    };

    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentMediaSessionSong.title,
        artist: currentMediaSessionSong.artist,
        album: currentMediaSessionSong.album,
        artwork: [
            { src: currentMediaSessionSong.artwork, sizes: "96x96" },
            { src: currentMediaSessionSong.artwork, sizes: "128x128" },
            { src: currentMediaSessionSong.artwork, sizes: "192x192" },
            { src: currentMediaSessionSong.artwork, sizes: "256x256" },
            { src: currentMediaSessionSong.artwork, sizes: "512x512" }
        ]
    });

    updateMediaSessionPlaybackState();
}

function setupMediaSessionControls(){
    if(!mediaSessionIsAvailable()){
        return;
    }

    setMediaSessionAction("play", () => {
        if(isSongPaused){
            pausePlayCurrentSong();
        }else{
            currentSongAudio.play();
        }
    });
    setMediaSessionAction("pause", () => {
        if(!isSongPaused){
            pausePlayCurrentSong();
        }else{
            currentSongAudio.pause();
        }
    });
    setMediaSessionAction("previoustrack", () => {
        backwardBtn.click();
    });
    setMediaSessionAction("nexttrack", () => {
        forwardBtn.click();
    });
    setMediaSessionAction("seekbackward", null);
    setMediaSessionAction("seekforward", null);
    setMediaSessionAction("seekto", (details = {}) => {
        if(!Number.isFinite(details.seekTime)){
            return;
        }
        if(details.fastSeek && typeof currentSongAudio.fastSeek === "function"){
            currentSongAudio.fastSeek(details.seekTime);
            return;
        }
        currentSongAudio.currentTime = details.seekTime;
        setMediaSessionPosition();
    });
    setMediaSessionAction("stop", () => {
        currentSongAudio.pause();
        currentSongAudio.currentTime = 0;
        updateMediaSessionPlaybackState();
    });
}

setupMediaSessionControls();

// PLAY THE SELECTED SONG

let isTheVaultOn = false;
let LastPlayedFromBtn;
const playerGradientLayers = Array.from(document.querySelectorAll(".playerGradientLayer"));
let playerGradientRequest = 0;

function clampColorChannel(value){
    return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(color){
    const fallback = { r: 28, g: 22, b: 37 };
    if(!color || typeof color !== "string"){
        return fallback;
    }

    const normalized = color.trim();
    if(normalized.startsWith("#")){
        const hex = normalized.slice(1);
        const fullHex = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
        const number = Number.parseInt(fullHex.slice(0, 6), 16);
        if(Number.isNaN(number)){
            return fallback;
        }

        return {
            r: (number >> 16) & 255,
            g: (number >> 8) & 255,
            b: number & 255
        };
    }

    const rgbMatch = normalized.match(/rgba?\(([^)]+)\)/i);
    if(rgbMatch){
        const channels = rgbMatch[1].split(",").map((part) => Number.parseFloat(part));
        if(channels.length >= 3 && channels.every((channel) => !Number.isNaN(channel))){
            return {
                r: clampColorChannel(channels[0]),
                g: clampColorChannel(channels[1]),
                b: clampColorChannel(channels[2])
            };
        }
    }

    return fallback;
}

function rgbToCss(color){
    return `rgb(${clampColorChannel(color.r)}, ${clampColorChannel(color.g)}, ${clampColorChannel(color.b)})`;
}

function mixRgb(color, target, amount){
    return {
        r: color.r + (target.r - color.r) * amount,
        g: color.g + (target.g - color.g) * amount,
        b: color.b + (target.b - color.b) * amount
    };
}

function getColorStats(color){
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    return {
        brightness: (color.r + color.g + color.b) / 3,
        saturation: max - min
    };
}

function buildPlayerGradient(colors){
    const primary = colors[0] || { r: 28, g: 22, b: 37 };
    const secondary = colors[1] || mixRgb(primary, { r: 180, g: 180, b: 180 }, 0.28);
    const tertiary = colors[2] || mixRgb(primary, { r: 255, g: 255, b: 255 }, 0.14);
    const base = mixRgb(primary, { r: 18, g: 12, b: 22 }, 0.34);
    const softBase = mixRgb(base, secondary, 0.12);

    return {
        primary: rgbToCss(primary),
        secondary: rgbToCss(secondary),
        softBase: rgbToCss(softBase),
        glowOne: rgbToCss(mixRgb(primary, { r: 255, g: 255, b: 255 }, 0.08)),
        glowTwo: rgbToCss(mixRgb(secondary, tertiary, 0.18))
    };
}

function applyPlayerGradient(gradient, songColor, requestId = playerGradientRequest){
    if(requestId !== playerGradientRequest){
        return;
    }

    const gradientLayer = playerGradientLayers[0];
    if(!gradientLayer){
        return;
    }
    gradientLayer.style.setProperty("--playerGradientPrimary", gradient.primary || songColor);
    gradientLayer.style.setProperty("--playerGradientSecondary", gradient.secondary || songColor);
    gradientLayer.style.setProperty("--playerGradientSoftBase", gradient.softBase || songColor);
    gradientLayer.style.setProperty("--playerGradientGlowOne", gradient.glowOne || songColor);
    gradientLayer.style.setProperty("--playerGradientGlowTwo", gradient.glowTwo || songColor);
}

function setFallbackPlayerGradient(songColor, requestId = playerGradientRequest){
    const base = hexToRgb(songColor);
    applyPlayerGradient(buildPlayerGradient([
        mixRgb(base, { r: 255, g: 255, b: 255 }, 0.08),
        mixRgb(base, { r: 0, g: 0, b: 0 }, 0.22),
        mixRgb(base, { r: 160, g: 95, b: 255 }, 0.18)
    ]), songColor, requestId);
}

function getDominantImageColors(imageURL, fallbackColor){
    const requestId = ++playerGradientRequest;
    setFallbackPlayerGradient(fallbackColor, requestId);
    if(!imageURL){
        return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
        if(requestId !== playerGradientRequest){
            return;
        }
        try{
            const canvas = document.createElement("canvas");
            const size = 32;
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(image, 0, 0, size, size);
            const data = context.getImageData(0, 0, size, size).data;
            const buckets = new Map();

            for(let i = 0; i < data.length; i += 4){
                const alpha = data[i + 3];
                if(alpha < 180){
                    continue;
                }

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const stats = getColorStats({ r, g, b });
                if(stats.brightness < 18 || stats.brightness > 245){
                    continue;
                }

                const key = `${Math.round(r / 28) * 28},${Math.round(g / 28) * 28},${Math.round(b / 28) * 28}`;
                const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, score: 0, count: 0, vibrantScore: 0, neutralScore: 0, darkScore: 0 };
                const weight = 1 + stats.saturation / 110;
                bucket.r += r * weight;
                bucket.g += g * weight;
                bucket.b += b * weight;
                bucket.score += weight;
                bucket.count += 1;
                bucket.vibrantScore += Math.max(0, stats.saturation - 24) * weight * (stats.brightness > 52 ? 1.3 : 0.8);
                bucket.neutralScore += Math.max(0, 72 - stats.saturation) * weight * (stats.brightness > 70 && stats.brightness < 210 ? 1.2 : 0.55);
                bucket.darkScore += Math.max(0, 150 - stats.brightness) * weight;
                buckets.set(key, bucket);
            }

            const colors = Array.from(buckets.values()).map((bucket) => ({
                    r: bucket.r / bucket.score,
                    g: bucket.g / bucket.score,
                    b: bucket.b / bucket.score,
                    count: bucket.count,
                    score: bucket.score,
                    vibrantScore: bucket.vibrantScore,
                    neutralScore: bucket.neutralScore,
                    darkScore: bucket.darkScore
                }));

            const primary = colors
                .filter((color) => getColorStats(color).saturation > 34)
                .sort((a, b) => b.vibrantScore - a.vibrantScore)[0] || colors.sort((a, b) => b.score - a.score)[0];
            const neutral = colors
                .filter((color) => color !== primary && getColorStats(color).brightness > 58)
                .sort((a, b) => b.neutralScore - a.neutralScore)[0];
            const dark = colors
                .filter((color) => color !== primary && color !== neutral)
                .sort((a, b) => b.darkScore - a.darkScore)[0];

            const gradientColors = [
                primary,
                neutral || mixRgb(primary, { r: 170, g: 170, b: 170 }, 0.22),
                dark || mixRgb(primary, { r: 18, g: 12, b: 22 }, 0.4)
            ].filter(Boolean);

            if(gradientColors.length){
                applyPlayerGradient(buildPlayerGradient(gradientColors), fallbackColor, requestId);
            }
        }catch(error){
            setFallbackPlayerGradient(fallbackColor, requestId);
        }
    };
    image.onerror = () => setFallbackPlayerGradient(fallbackColor, requestId);
    image.src = imageURL;
}

function playerSelectedSong(songURL,songTitle,songCreator,imageURL,songColor,playedFrom,playedFromBtn,id,queueOptions = {}){
    currentPlayerSongId = id;
    imageURL = getCrimsonImageSrc(imageURL, "song");
    currentPlayerSongPopup = {
        id,
        image: imageURL,
        creator: songCreator,
        title: songTitle
    };

    document.documentElement.style.setProperty("--currentSongColor", songColor);
    document.documentElement.style.setProperty("--currentSongColorBig", songColor);
    getDominantImageColors(imageURL, songColor);

    openMiniPlayer();

    if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
        LastPlayedFromBtn.classList.remove("songPlayingLi");
        LastPlayedFromBtn.classList.remove("songPlayingLiPaused");
    }

    currentSongAudio.autoplay = true;
    setPlayerProgressLoadingState();
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
        if(banner !== bigSongBanner){
            banner.src = imageURL;
        }
    });
    songTitles.forEach((title) => {
        title.innerHTML = songTitle;
    });
    songArtists.forEach((artist) => {
        artist.innerHTML = songCreator;
    });

    playedFrom = getPlayedFromName(playedFrom, playedFromBtn);
    playingFrom = document.getElementById("playingFromSpan");
    playingFrom.innerHTML = playedFrom;

    updateMediaSessionMetadata(songTitle, songCreator, imageURL, playedFrom);

    LastPlayedFromBtn = playedFromBtn;
    const currentQueueItem = getCurrentSongItem(songURL,songTitle,songCreator,imageURL,songColor,playedFrom,playedFromBtn,id);

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
        buildQueueFromSongList(currentQueueItem, playedFromBtn, playedFrom);
    }else if(queueOptions.preserveQueue){
        if(songQueue.current){
            songQueue.history.push(songQueue.current);
        }
        songQueue.upcoming = songQueue.upcoming.filter((song) => String(song.id) !== String(id) || song.url !== songURL);
        songQueue.current = currentQueueItem;
        songQueue.sourceName = queueOptions.sourceName || playedFrom || songQueue.sourceName || "Your queue";
        nextSongBtn = 0;
        prevSongBtn = 0;
        currentSongBtn = 0;
        fillQueueWithRandomSongs();
        renderSongQueue();
    }else{
        songQueue = {
            sourceName: playedFrom || "Your queue",
            current: currentQueueItem,
            history: [],
            upcoming: []
        };
        nextSongBtn = 0;
        prevSongBtn = 0;
        currentSongBtn = 0;
        fillQueueWithRandomSongs();
        renderSongQueue();
    }

    if(queueRelatedBody){
        queueRelatedBody.dataset.relatedSongId = "";
        queueRelatedBody.dataset.relatedState = "";
    }
    if(isQueueOpen && currentPlayerPopupTab === "related"){
        loadRelatedSongs();
    }

    if(songSwipeState.isCommitting){
        songSwipeState.pendingCurrent = currentPlayerSongPopup;
    }else{
        prepareSongSwipeCards(currentPlayerSongPopup);
    }

    syncContextPlaybackButtons();

    seeIfSongIsLiked(id);
    const checkLyrics = document.getElementById('checkLyrics');
    checkLyrics.setAttribute('onclick', `doesSongHaveLyrics(${id},'${playedFrom}')`);
    checkLyrics.click();

    const playerLyricsBtn = document.getElementById("playerLyricsBtn");
    playerLyricsBtn.onclick = () => {
        openPlayerPopup("lyrics");
    }

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
        openCurrentSongOptionsPopup();
    }

    const playingFromBtn = document.getElementById("playingFromBtn");
    playingFromBtn.onclick = () => {
        openPlayerPopup("queue");
    }
}

// PLAY PLAYLIST FROM PLAY BUTTON

function playPlaylist(){
    toggleContextPlayback("playlist");
}

function playFirstSongFromList(selector){
    const songList = document.querySelector(selector);
    const firstSong = songList ? songList.querySelector(".songItem .songClickDiv") : null;

    if(firstSong){
        firstSong.click();
        return true;
    }

    return false;
}

// Open MINI PLAYER
function openMiniPlayer(){
    document.querySelector('#mobileNav').classList.remove('navNoPlayer');
    if(!isPlayerOpen){
        let player = document.getElementsByClassName("player")[0];
        player.style.opacity = "1";
        player.style.pointerEvents = "all";
        player.style.transform = "";
        isPlayerOpen = true;
    }
}

// PAUSE / PLAY THE CURRENT SONG

let songPlayBtns = document.getElementsByName("songPlayButton");
let playPlaylistBtn = document.getElementById("playPlaylistBtn");
let playArtistBtn = document.getElementById("playArtistBtn");

function getCurrentContextPlaybackSource(){
    const sourceElement = LastPlayedFromBtn && LastPlayedFromBtn !== 0 && LastPlayedFromBtn.isConnected
        ? LastPlayedFromBtn
        : songQueue.current?.element;
    const sourceList = sourceElement?.parentElement;

    if(sourceList?.classList.contains("playlistSongsList")){
        return "playlist";
    }
    if(sourceList?.classList.contains("artistSongs")){
        return "artist";
    }
    return "";
}

function setContextPlaybackButton(button, isPlaying){
    if(!button){
        return;
    }
    button.innerHTML = isPlaying
        ? `<i class="fa-solid fa-pause"></i> Pause`
        : `<i class="fa-solid fa-play"></i> Play`;
}

function syncContextPlaybackButtons(){
    const activeSource = isSongPaused ? "" : getCurrentContextPlaybackSource();
    setContextPlaybackButton(playPlaylistBtn, activeSource === "playlist");
    setContextPlaybackButton(playArtistBtn, activeSource === "artist");
}

function toggleContextPlayback(source){
    if(getCurrentContextPlaybackSource() === source){
        pausePlayCurrentSong();
        return;
    }

    const isPlaylist = source === "playlist";
    const button = isPlaylist ? playPlaylistBtn : playArtistBtn;
    crimsonPlayfulBurst(button, isPlaylist ? "playlist" : "play");
    playFirstSongFromList(isPlaylist ? ".playlistSongsList" : ".artistSongs");
}

function pausePlayCurrentSong(from){
    if(from === "Playlist"){
        document.querySelector(".playlistSongsList .songItem")?.classList.add("songPlayingLi");
    }

    if(isSongPaused){
        songPlayBtns.forEach((button) => {
            button.children[0].classList.remove("fa-circle-play");
            button.children[0].classList.add("fa-circle-pause");
        });

        if(from === "Playlist"){
            playPlaylistBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause`;
            if(currentSongAudio.currentTime === 0){
                document.querySelector(".playlistSongsList .songItem .songClickDiv")?.click();
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

        if(LastPlayedFromBtn != undefined && LastPlayedFromBtn != null && LastPlayedFromBtn != 0){
            LastPlayedFromBtn.classList.remove("songPlayingLi");
            LastPlayedFromBtn.classList.add("songPlayingLiPaused");
        }

        isSongPaused = true;
    }

    syncContextPlaybackButtons();
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
            else{
                playNextQueuedSong();
            }
        }
        else{
            let songPlayBtns = document.getElementsByName("songPlayButton");
    
            songPlayBtns.forEach((button) => {
                button.children[0].classList.remove("fa-circle-pause");
                button.children[0].classList.add("fa-circle-play");
            });
            
            if(currentSongBtn != 0){
                currentSongBtn.classList.remove("songPlayingLi");
                currentSongBtn.classList.remove("songPlayingLiPaused");
            }

            isSongPaused = true;
            syncContextPlaybackButtons();
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

function formatPlayerTime(seconds){
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${remainder}`;
}

function setPlayerProgressLoadingState(){
    songTime.value = 0;
    document.getElementById("miniSeekBar").style.width = "0%";
    document.getElementById("currentSongTime").textContent = "0:00";
    document.getElementById("currentSongTimeLeft").textContent = "--:--";
}

function syncPlayerProgress(){
    const musicCurr = currentSongAudio.currentTime;
    const musicDur = currentSongAudio.duration;
    if(!Number.isFinite(musicDur) || musicDur <= 0 || !Number.isFinite(musicCurr)){
        setPlayerProgressLoadingState();
        return;
    }

    const progressBar = Math.max(0, Math.min(100, (musicCurr / musicDur) * 100));
    document.getElementById("currentSongTime").textContent = formatPlayerTime(musicCurr);
    document.getElementById("currentSongTimeLeft").textContent = formatPlayerTime(musicDur);
    songTime.value = progressBar;
    document.getElementById("miniSeekBar").style.width = `${progressBar}%`;
    setMediaSessionPosition();
}

// Set the seekbar and times relative to the song's current time.
currentSongAudio.addEventListener('timeupdate', syncPlayerProgress);

currentSongAudio.addEventListener('loadedmetadata', () => {
    syncPlayerProgress();
    renderSongQueue();
    setMediaSessionPosition();
});

songTime.addEventListener('change', ()=>{
    if(!Number.isFinite(currentSongAudio.duration) || currentSongAudio.duration <= 0){
        setPlayerProgressLoadingState();
        return;
    }
    var seekto = currentSongAudio.duration * (songTime.value / 100);
    currentSongAudio.currentTime = seekto;
    setMediaSessionPosition();
});

// Pausing the audio outside of the app
currentSongAudio.addEventListener('pause', () =>{
    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-pause");
        button.children[0].classList.add("fa-circle-play");
    });
    isSongPaused = true;
    syncContextPlaybackButtons();
    updateMediaSessionPlaybackState();
});

// Playing the audio outside of the app
currentSongAudio.addEventListener('play', () =>{
    songPlayBtns.forEach((button) => {
        button.children[0].classList.remove("fa-circle-play");
        button.children[0].classList.add("fa-circle-pause");
    });
    isSongPaused = false;
    syncContextPlaybackButtons();
    updateMediaSessionPlaybackState();
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
                const isPlaylistDetail = !!screen.closest(".playlistScreen");
                const baseHeroHeight = isPlaylistDetail ? 400 : 500;
                if(screen.scrollTop < 0){
                    screen.children[2].children[0].classList.add('noAnimTransitions');
                    let newHeight = Number(-screen.scrollTop) + (baseHeroHeight + Number(getComputedStyle(document.documentElement).getPropertyValue("--topInsetArea").split('p')[0]));
                    screen.children[2].children[0].style.height = `${newHeight}px`;
                    if(screen.scrollTop > -120){
                        screen.children[2].children[1].style.opacity = 1;
                    }else{
                        screen.children[2].children[1].style.opacity = 0;
                    }
                }else{
                    screen.children[2].children[1].style.opacity = 1;
                    screen.children[2].children[0].classList.remove('noAnimTransitions');
                    screen.children[2].children[0].style.height = `calc(env(safe-area-inset-top) + ${baseHeroHeight}px)`;
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
                const categoryHero = screen.querySelector(".categoryHero");
                const categoryHeroContent = screen.querySelector(".categoryHeroContent");
                const categoryBanner = screen.querySelector(".catBanner");
                const fadeProgress = Math.max(0, Math.min(1, (screen.scrollTop - 70) / 150));
                if(categoryHeroContent){
                    categoryHeroContent.style.opacity = 1 - fadeProgress;
                    categoryHeroContent.style.transform = `translateY(${-screen.scrollTop * .08}px)`;
                }
                if(categoryBanner){
                    categoryBanner.classList.add("noAnimTransitions");
                    categoryBanner.style.transform = `translateY(${screen.scrollTop * .24}px) scale(1.08)`;
                }
                categoryHero?.style.setProperty("--category-scroll", `${screen.scrollTop}px`);
            }
    
            const pageBarThreshold = screen.id === "screenScrollableCat" ? 145 : 268;
            if(screen.scrollTop > pageBarThreshold){
                screen.children[0].classList.add("pageBarOn");
                screen.children[1].classList.add("pageBarOn2");
            }else{
                screen.children[0].classList.remove("pageBarOn");
                screen.children[1].classList.remove("pageBarOn2");
            }
    
            if(screen.id != "screenScrollableCat"){
                screen.children[2].children[0].classList.add('noAnimTransitions');
                screen.children[2].children[0].style.transform = "translateY(-"+ screen.scrollTop / 3 +"px)";
            }
        }else{
            const pageBarThreshold = screen.id === "screenScrollableCat" ? 145 : 250;
            if(screen.scrollTop > pageBarThreshold){
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

    showCrimsonView(makePlScreen);

    document.getElementById('imageInput').value = "";
    document.querySelector('.formImageInput').classList.remove('displayNone');
    document.querySelector('.makePlaylistForm').classList.remove('makePlaylistSubmitting');
    document.getElementById('submitMakePlaylist').disabled = false;

    if(editing){
        makePlScreen.children[0].children[0].children[1].innerHTML = "Edit Playlist";

        document.getElementById('nameInput').value = playlistNameP;
        document.getElementById('submitMakePlaylist').value = "Save";

        document.getElementById('imageUploadView').style.backgroundImage = `url("${getCrimsonImageSrc(playlistBannerP, "playlist")}")`;
        document.querySelector('.currentMakePlaylistName').innerHTML = playlistNameP;
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-id', playlistIdP);
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-songs', playlistSongsP);
        document.querySelector('.currentMakePlaylistName').setAttribute('data-playlist-banner', getCrimsonImageSrc(playlistBannerP, "playlist"));
    }else{
        document.querySelector('.formImageInput').classList.remove('displayNone');

        makePlScreen.children[0].children[0].children[1].innerHTML = "Make Playlist";

        document.getElementById('nameInput').value = "";
        document.getElementById('submitMakePlaylist').value = "Create";

        document.getElementById('imageUploadView').style.backgroundImage = `url("images/defaultPlaylist.webp")`;
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
    hideCrimsonView(makePlScreen, "makePlaylistScreenOpen", 350);

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
let currentPopupContext = null;

function getCachedPopupLikeState(id){
    const likedSongs = window.crimsonLikedSongIds;
    if(!likedSongs || typeof likedSongs.has !== "function"){
        return null;
    }

    return likedSongs.has(String(id));
}

function setPopupLikeState(id, isLiked){
    const likeSongBtn = document.getElementById("likeSongBtn");
    if(!likeSongBtn){
        return;
    }

    likeSongBtn.setAttribute("data-song-id", id);
    if(isLiked === null){
        likeSongBtn.innerHTML = `<i class="fa-regular fa-heart"></i><h5>Checking favorites...</h5>`;
        likeSongBtn.classList.add("popupItemLoading");
        return;
    }

    likeSongBtn.classList.remove("popupItemLoading");
    likeSongBtn.innerHTML = isLiked
        ? `<i class="fa-solid fa-heart"></i><h5>Remove from favorites</h5>`
        : `<i class="fa-regular fa-heart"></i><h5>Add to favorites</h5>`;
}

function showPopupBody(activeBody){
    ["songPopupBody", "playlistPopupBody", "publicPlaylistPopupBody", "artistPopupBody"].forEach((className) => {
        const body = document.getElementsByClassName(className)[0];
        if(body){
            body.style.display = className === activeBody ? "block" : "none";
        }
    });
}

function setContextPlaylistLikeState(isLiked){
    const button = document.getElementById("likeContextPlaylistBtn");
    if(!button){
        return;
    }
    button.classList.toggle("popupItemLoading", isLiked === null);
    button.innerHTML = isLiked === null
        ? `<i class="fa-regular fa-heart"></i><h5>Checking library...</h5>`
        : isLiked
            ? `<i class="fa-solid fa-heart"></i><h5>Unlike playlist</h5>`
            : `<i class="fa-regular fa-heart"></i><h5>Like playlist</h5>`;
}

function setContextArtistFollowState(isFollowed){
    const button = document.getElementById("followContextArtistBtn");
    if(!button){
        return;
    }
    button.classList.toggle("popupItemLoading", isFollowed === null);
    button.innerHTML = isFollowed === null
        ? `<i class="fa-solid fa-user-plus"></i><h5>Checking follow status...</h5>`
        : isFollowed
            ? `<i class="fa-solid fa-user-minus"></i><h5>Unfollow artist</h5>`
            : `<i class="fa-solid fa-user-plus"></i><h5>Follow artist</h5>`;
}

function configurePlaylistContextPopup(context){
    const playButton = document.getElementById("playContextPlaylistBtn");
    const likeButton = document.getElementById("likeContextPlaylistBtn");
    const openButton = document.getElementById("openContextPlaylistBtn");

    playButton.innerHTML = context.vault
        ? `<i class="fa-solid fa-play"></i><h5>Play The Vault</h5>`
        : context.category
            ? `<i class="fa-solid fa-play"></i><h5>Play category</h5>`
            : `<i class="fa-solid fa-play"></i><h5>Play playlist</h5>`;
    openButton.innerHTML = context.vault
        ? `<i class="fa-solid fa-arrow-up-right-from-square"></i><h5>Open The Vault</h5>`
        : context.category
            ? `<i class="fa-solid fa-arrow-up-right-from-square"></i><h5>Open category</h5>`
            : `<i class="fa-solid fa-arrow-up-right-from-square"></i><h5>Open playlist</h5>`;
    playButton.onclick = () => {
        if(context.vault){
            window.vaultEmotionLoad?.(context.mood);
        }else if(context.category){
            window.crimsonPlayCategoryFromContext?.(context);
        }else{
            window.crimsonPlayPlaylistFromContext?.(context);
        }
        closePopup();
    };
    openButton.onclick = () => {
        closePopup();
        if(context.vault){
            window.openTheVault?.();
        }else if(context.category){
            window.openCategoryPage?.(context.name, context.color, context.image);
        }else if(context.favorites){
            if(window.UserSignedIn?.()){
                window.openLikedSongs?.();
            }else{
                openLoginPopup();
            }
        }else{
            window.openPlaylistPage?.(context.id, context.name, context.image, context.likes, context.songs || "");
        }
    };

    likeButton.style.display = context.favorites || context.vault || context.category ? "none" : "flex";
    if(!context.favorites && !context.vault && !context.category){
        setContextPlaylistLikeState(null);
        const requestedId = String(context.id);
        Promise.resolve(window.crimsonIsPlaylistLiked?.(context.id)).then((isLiked) => {
            if(currentPopupContext?.type === "publicPlaylist" && String(currentPopupContext.id) === requestedId){
                setContextPlaylistLikeState(isLiked);
            }
        });
        likeButton.onclick = () => {
            window.crimsonTogglePlaylistLike?.(context.id);
            closePopup();
        };
    }
}

function configureArtistContextPopup(context){
    const playButton = document.getElementById("playContextArtistBtn");
    const followButton = document.getElementById("followContextArtistBtn");
    const openButton = document.getElementById("openContextArtistBtn");

    playButton.onclick = () => {
        window.crimsonPlayArtistFromContext?.(context);
        closePopup();
    };
    openButton.onclick = () => {
        closePopup();
        window.openArtistPage?.(context.id, context.name, context.image, context.followers, context.listens, context.aboutImage);
    };
    followButton.onclick = () => {
        window.crimsonToggleArtistFollow?.(context.id);
        closePopup();
    };

    setContextArtistFollowState(null);
    const requestedId = String(context.id);
    Promise.resolve(window.crimsonIsArtistFollowed?.(context.id)).then((isFollowed) => {
        if(currentPopupContext?.type === "artist" && String(currentPopupContext.id) === requestedId){
            setContextArtistFollowState(isFollowed);
        }
    });
}

function openPopup(type,src,art,nam,id,isLikedPage,contextData){
    const isPlaylistContext = type === "playlist" || type === "publicPlaylist" || type === "libraryPlaylist" || type === "vaultPlaylist" || type === "category";
    src = getCrimsonImageSrc(src, isPlaylistContext ? "playlist" : type === "artist" ? "artist" : "song");
    const popupWrapper = document.getElementById("popupWrapper");
    showCrimsonView(popupWrapper);
    popupWrapper.classList.add("popupOpen");
    popupWrapper.classList.toggle("artistContextPopup", type === "artist");

    popupWrapper.focus();
    isPopupOpen = true;
    currentPopupContext = contextData || {type, id, name: nam, image: src, creator: art};

    if(type === "song"){
        getArtistId(art.split(',')[0]);
    }

    const likeSongBtn = document.getElementById("likeSongBtn");

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
    popupScreen.style.transform = "";

    addToPlBtn.setAttribute('name', id);
    addToPlBtn.onclick = addToPlFunc;
    document.querySelector('.popupMyPlaylists').innerHTML = "";

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
        showPopupBody("songPopupBody");
        setPopupLikeState(id, getCachedPopupLikeState(id));
        seeIfSongIsLiked(id);
    }else if(type === "playlist"){
        showPopupBody("playlistPopupBody");
    }else if(type === "artist"){
        showPopupBody("artistPopupBody");
        configureArtistContextPopup(currentPopupContext);
    }else{
        showPopupBody("publicPlaylistPopupBody");
        configurePlaylistContextPopup(currentPopupContext);
    }

    likeSongBtn.onclick = () => {
        if(UserSignedIn()){
            addSongToLiked(id, likeSongBtn);
            likeSongBtn.classList.add("likeBtnAnim2");
            setTimeout(() => {
                likeSongBtn.classList.remove("likeBtnAnim2");
            }, 500);
        }else{
            openLoginPopup();
        }
    }
}

function closePopup(){
    const popupWrapper = document.getElementById("popupWrapper");
    popupWrapper.classList.remove("popupOpen");
    popupWrapper.classList.remove("artistContextPopup");
    popupWrapper.classList.remove("popupAwaitingRelease");
    popupScreen.style.transform = "";
    hideCrimsonView(popupWrapper, "popupOpen");

    isPopupOpen = false;
    currentPopupContext = null;

    const popupMyPlaylists = document.querySelector('.popupMyPlaylists');
    popupScreen.classList.remove('popupPl');
    popupMyPlaylists.innerHTML = "";
    addToPlBtn.onclick = addToPlFunc;
}

function getItemContext(item){
    if(item?._crimsonContext){
        return item._crimsonContext;
    }

    const encodedContext = item?.getAttribute("data-crimson-context");
    if(!encodedContext){
        return null;
    }

    try{
        return JSON.parse(decodeURIComponent(encodedContext));
    }catch(error){
        return null;
    }
}

function openItemContextMenu(item){
    const context = getItemContext(item);
    if(context?.type === "song"){
        openPopup("song", context.image, context.creator, context.name, context.id, false, context);
        return true;
    }
    if(context?.type === "artist"){
        openPopup("artist", context.image, "Artist", context.name, context.id, false, context);
        return true;
    }
    if(context?.type === "publicPlaylist" || context?.type === "libraryPlaylist" || context?.type === "vaultPlaylist" || context?.type === "category"){
        openPopup(context.type, context.image, context.artists || "Playlist", context.name, context.id, false, context);
        return true;
    }

    const existingMenuButton = item?.querySelector(".songBtns button");
    if(existingMenuButton){
        existingMenuButton.click();
        return true;
    }
    return false;
}

const crimsonLongPress = {
    timer: null,
    item: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    openedPopup: false,
    suppressUntil: 0
};

const vaultContextItem = document.querySelector(".vaultPlItem");
if(vaultContextItem){
    vaultContextItem._crimsonContext = {
        type: "vaultPlaylist",
        id: "Party",
        name: "The Vault",
        image: "images/VaultBanner.gif",
        artists: "Mood mix",
        mood: "Party",
        vault: true
    };
}

function clearCrimsonLongPress(){
    clearTimeout(crimsonLongPress.timer);
    crimsonLongPress.timer = null;
    crimsonLongPress.item?.classList.remove("crimsonContextPressing");
}

function findContextItem(target){
    const item = target?.closest?.("[data-crimson-context], .songItem, .queueSong, .playlistItem");
    const interactiveTarget = target?.closest?.("button, a, input, textarea, select, label");
    if(!item || item.closest("#popupWrapper") || (interactiveTarget && interactiveTarget !== item)){
        return null;
    }
    if(!getItemContext(item) && !item.querySelector(".songBtns button")){
        return null;
    }
    return item;
}

document.addEventListener("pointerdown", (event) => {
    if(!event.isPrimary || event.button !== 0 || isPopupOpen){
        return;
    }

    const item = findContextItem(event.target);
    if(!item){
        return;
    }

    clearCrimsonLongPress();
    crimsonLongPress.item = item;
    crimsonLongPress.pointerId = event.pointerId;
    crimsonLongPress.startX = event.clientX;
    crimsonLongPress.startY = event.clientY;
    crimsonLongPress.openedPopup = false;
    item.classList.add("crimsonContextPressing");
    crimsonLongPress.timer = setTimeout(() => {
        if(openItemContextMenu(item)){
            crimsonLongPress.openedPopup = true;
            document.getElementById("popupWrapper")?.classList.add("popupAwaitingRelease");
            item.classList.remove("crimsonContextPressing");
            navigator.vibrate?.(24);
        }
    }, 520);
}, true);

document.addEventListener("pointermove", (event) => {
    if(event.pointerId !== crimsonLongPress.pointerId || !crimsonLongPress.timer){
        return;
    }
    if(Math.hypot(event.clientX - crimsonLongPress.startX, event.clientY - crimsonLongPress.startY) > 12){
        clearCrimsonLongPress();
    }
}, true);

["pointerup", "pointercancel"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
        if(event.pointerId === crimsonLongPress.pointerId){
            const openedPopup = crimsonLongPress.openedPopup;
            clearCrimsonLongPress();
            crimsonLongPress.pointerId = null;
            crimsonLongPress.openedPopup = false;

            if(openedPopup){
                crimsonLongPress.suppressUntil = performance.now() + 350;
                if(eventName === "pointerup"){
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
                setTimeout(() => {
                    document.getElementById("popupWrapper")?.classList.remove("popupAwaitingRelease");
                }, 80);
            }
        }
    }, true);
});

document.addEventListener("scroll", clearCrimsonLongPress, true);

document.addEventListener("click", (event) => {
    if(performance.now() < crimsonLongPress.suppressUntil){
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}, true);

document.addEventListener("contextmenu", (event) => {
    const item = findContextItem(event.target);
    if(item && openItemContextMenu(item)){
        event.preventDefault();
    }
});

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
        document.documentElement.style.setProperty('--footerBg', 'rgba(26, 21, 34, 0.7)');
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
let sidePageNormalPos = document.getElementsByClassName("loginScreen")[0].offsetLeft;
let playerMoveFrame = null;
let playerMoveTop = null;
let popupMoveFrame = null;
let popupMoveTop = null;
let playerNavHideTimer = null;

function setPlayerNavClosed(closed){
    const nav = document.getElementsByTagName("nav")[0];
    if(!nav){
        return;
    }

    if(playerNavHideTimer){
        clearTimeout(playerNavHideTimer);
        playerNavHideTimer = null;
    }

    if(closed){
        nav.classList.remove("navPlayerHidden");
        nav.classList.add("navClosed");
        playerNavHideTimer = window.setTimeout(() => {
            if(nav.classList.contains("navClosed")){
                nav.classList.add("navPlayerHidden");
            }
            playerNavHideTimer = null;
        }, reduceAnimations ? 0 : 420);
        return;
    }

    const wasHidden = nav.classList.contains("navPlayerHidden");
    nav.classList.remove("navPlayerHidden");
    if(wasHidden && !reduceAnimations){
        void nav.offsetWidth;
        requestAnimationFrame(() => nav.classList.remove("navClosed"));
    }else{
        nav.classList.remove("navClosed");
    }
}

function setInteractionActive(isActive){
    document.body.classList.toggle("playerInteractionActive", isActive);
}

function cancelScheduledMove(frame){
    if(frame){
        cancelAnimationFrame(frame);
    }
}

function getOpenPlayerTop(){
    return -50;
}

function applyPlayerDragTop(top){
    const dragTop = Math.max(getOpenPlayerTop(), top);
    movablePlayer.style.transform = `translate3d(0, ${dragTop - getOpenPlayerTop()}px, 0)`;
}

function settlePlayerPosition(open){
    movablePlayer.classList.remove("playerMovable");
    movablePlayer.classList.toggle("playerOpen", open);
    movablePlayer.style.transform = "";
}

function getGestureDirection(deltaX, deltaY, threshold = 10){
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if(absX < threshold && absY < threshold){
        return null;
    }
    if(absX > absY * 1.15){
        return "horizontal";
    }
    if(absY > absX * 1.15){
        return "vertical";
    }

    return null;
}

const move = (e) => {
    currentTouchPos = (e.touches[0].clientY - offsetY);
    if(currentTouchPos <= (-50)){
        return;
    }
    moveStarted = true;
    // Update div pos based on new cursor pos
    playerMoveTop = e.touches[0].clientY - offsetY;
    if(!playerMoveFrame){
        playerMoveFrame = requestAnimationFrame(() => {
            applyPlayerDragTop(playerMoveTop);
            playerMoveFrame = null;
        });
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

let isLyricsOn = false;

playerOpenDiv.addEventListener("touchstart", (e) => {
    // console.log("touched");
    if(window.innerWidth < window.innerHeight){
        const playerStartTop = movablePlayer.getBoundingClientRect().top;
        playerDragStartTop = playerStartTop;
        playerMovedDown = true;
        setPlayerNavClosed(true);
        movablePlayer.classList.add("playerOpen");
        if(reduceAnimations){
            document.querySelector('.bigControls').classList.add('noPointerEvents');
            setTimeout(() => {
                document.querySelector('.bigControls').classList.remove('noPointerEvents');
            }, 200);
        }

        // Calc the initial offset Values
        offsetY = e.touches[0].clientY - playerStartTop;
        applyPlayerDragTop(playerStartTop);
        movablePlayer.classList.add("playerMovable");
        setInteractionActive(true);

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
const songSwipeViewport = document.getElementById("songSwipeViewport");
const songSwipeTrack = document.getElementById("songSwipeTrack");
const songSwipeCards = {
    previous: document.querySelector('[data-swipe-card="previous"]'),
    current: document.querySelector('[data-swipe-card="current"]'),
    next: document.querySelector('[data-swipe-card="next"]')
};
const songSwipeState = {
    dragOffset: 0,
    isDragging: false,
    isCommitting: false,
    pendingCurrent: null,
    settleTimer: null,
    cardWidth: 0
};
let playerMovedDown = false;
let playerGestureStartX = 0;
let playerGestureStartY = 0;
let playerGestureDirection = null;
let playerDragStartTop = 0;

function getSongSwipePreview(direction){
    if(direction === "previous"){
        if(prevSongBtn != 0){
            return parseSongItem(prevSongBtn, songQueue.sourceName);
        }
        return songQueue.history[songQueue.history.length - 1] || null;
    }

    if(isShuffleOn){
        return null;
    }
    if(nextSongBtn != 0){
        return parseSongItem(nextSongBtn, songQueue.sourceName);
    }
    return songQueue.upcoming[0] || null;
}

function getSongSwipeSource(song){
    if(!song){
        return "";
    }
    return getCrimsonImageSrc(song.image || song.imageSmall || "", "song");
}

function setSongSwipeCard(card, song){
    if(!card){
        return;
    }

    const image = card.querySelector("img");
    const source = getSongSwipeSource(song);
    const key = song ? `${song.id || ""}|${source}` : "";
    card.setAttribute("aria-hidden", card === songSwipeCards.current ? "false" : "true");
    if(card.dataset.songSwipeKey === key){
        return;
    }

    card.dataset.songSwipeKey = key;
    card.dataset.songSwipeLoadToken = String(Number(card.dataset.songSwipeLoadToken || 0) + 1);
    const loadToken = card.dataset.songSwipeLoadToken;
    card.classList.remove("songSwipeCardLoaded");
    card.classList.toggle("songSwipeCardEmpty", !source);
    image.removeAttribute("src");

    if(!source){
        image.alt = "";
        return;
    }

    image.alt = song?.title ? `${song.title} cover` : "Song cover";
    const preload = new Image();
    preload.decoding = "async";
    preload.onload = () => {
        if(card.dataset.songSwipeLoadToken !== loadToken){
            return;
        }
        image.src = source;
        requestAnimationFrame(() => {
            if(card.dataset.songSwipeLoadToken === loadToken){
                card.classList.add("songSwipeCardLoaded");
            }
        });
    };
    preload.onerror = () => {
        if(card.dataset.songSwipeLoadToken === loadToken){
            card.classList.add("songSwipeCardEmpty");
        }
    };
    preload.src = source;
}

function setSongSwipeTrackPosition(offset = 0, animate = false){
    if(!songSwipeViewport || !songSwipeTrack){
        return;
    }
    const cardWidth = songSwipeState.cardWidth || songSwipeViewport.getBoundingClientRect().width;
    songSwipeTrack.classList.toggle("songSwipeTrackAnimating", animate && !reduceAnimations);
    if(cardWidth > 0){
        songSwipeTrack.style.transform = `translate3d(${-cardWidth + offset}px, 0, 0)`;
    }
}

function resetSongSwipeTrack(){
    songSwipeState.dragOffset = 0;
    songSwipeState.isDragging = false;
    setSongSwipeTrackPosition(0, false);
}

function prepareSongSwipeCards(currentSong = currentPlayerSongPopup){
    if(!songSwipeTrack){
        return;
    }
    songSwipeState.cardWidth = songSwipeViewport?.getBoundingClientRect().width || 0;
    setSongSwipeCard(songSwipeCards.previous, getSongSwipePreview("previous"));
    setSongSwipeCard(songSwipeCards.current, currentSong);
    setSongSwipeCard(songSwipeCards.next, getSongSwipePreview("next"));
    if(!songSwipeState.isDragging && !songSwipeState.isCommitting){
        resetSongSwipeTrack();
    }
}

function rotateSongSwipeCards(direction){
    if(!songSwipeTrack){
        return;
    }

    if(direction === "next"){
        songSwipeTrack.appendChild(songSwipeCards.previous);
    }else{
        songSwipeTrack.insertBefore(songSwipeCards.next, songSwipeTrack.firstElementChild);
    }

    songSwipeCards.previous = songSwipeTrack.children[0];
    songSwipeCards.current = songSwipeTrack.children[1];
    songSwipeCards.next = songSwipeTrack.children[2];
}

function completeSongSwipe(direction){
    const previewSong = getSongSwipePreview(direction);
    if(!previewSong){
        resetSongSwipeTrack();
        return;
    }

    songSwipeState.isCommitting = true;
    const cardWidth = songSwipeState.cardWidth || songSwipeViewport?.getBoundingClientRect().width || 0;
    const targetOffset = direction === "next" ? -cardWidth : cardWidth;
    setSongSwipeTrackPosition(targetOffset, true);

    const commit = () => {
        songSwipeState.settleTimer = null;
        performSongChange(direction);

        rotateSongSwipeCards(direction);
        resetSongSwipeTrack();
        songSwipeState.isCommitting = false;
        prepareSongSwipeCards(songSwipeState.pendingCurrent || currentPlayerSongPopup);
        songSwipeState.pendingCurrent = null;
    };

    if(reduceAnimations){
        commit();
    }else{
        songSwipeState.settleTimer = window.setTimeout(commit, 285);
    }
}

const move2 = (e) => {
    const deltaX = e.touches[0].clientX - playerGestureStartX;
    const deltaY = e.touches[0].clientY - playerGestureStartY;
    if(!playerGestureDirection){
        playerGestureDirection = getGestureDirection(deltaX, deltaY);
    }
    if(playerGestureDirection !== "vertical"){
        return;
    }

    e.preventDefault();
    currentTouchPos = e.touches[0].clientY - offsetY;
    // Update div pos based on new cursor pos
    if(currentTouchPos > playerDragStartTop && !isPopupOpen && !isLyricsOn){
        moveStarted = true;
        playerMovedDown = true;
        movablePlayer.classList.add("playerMovable");
        bigSongBanner.classList.remove("playerMovable");
        playerMoveTop = currentTouchPos;
        if(!playerMoveFrame){
            playerMoveFrame = requestAnimationFrame(() => {
                applyPlayerDragTop(playerMoveTop);
                playerMoveFrame = null;
            });
        }
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

playerOpenDiv2.addEventListener("touchstart", (e) => {
    e.preventDefault();
    // console.log("touched");
    // Calc the initial offset Values
    if(window.innerWidth < window.innerHeight){
        if(songSwipeState.isCommitting){
            return;
        }
        currentTouchPosSkip = 0;
        prepareSongSwipeCards();
        playerGestureStartX = e.touches[0].clientX;
        playerGestureStartY = e.touches[0].clientY;
        playerGestureDirection = null;
        playerDragStartTop = movablePlayer.getBoundingClientRect().top;
        offsetY = e.touches[0].clientY - playerDragStartTop;
        offsetX = e.touches[0].clientX - movablePlayer.offsetLeft;
        movablePlayer.classList.add("playerMovable");
        bigSongBanner.classList.add("playerMovable");
        setInteractionActive(true);
        document.addEventListener("touchmove", move2, { passive: false });
        document.addEventListener("touchmove", moveSideSkip, { passive: false });
        playerTouchStarted2 = true;
        moveStarted = false;
    }
})

// ----- PLAYER SONG SKIPPING

let currentTouchPosSkip = 0;
const moveSideSkip = (e) =>{
    const deltaX = e.touches[0].clientX - playerGestureStartX;
    const deltaY = e.touches[0].clientY - playerGestureStartY;
    if(!playerGestureDirection){
        playerGestureDirection = getGestureDirection(deltaX, deltaY);
    }
    if(playerGestureDirection === "vertical"){
        currentTouchPosSkip = 0;
        songSwipeState.isDragging = false;
        return;
    }
    if(!playerMovedDown){
        e.preventDefault();
        const rawOffset = e.touches[0].clientX - offsetX;
        const direction = rawOffset < 0 ? "next" : "previous";
        const hasPreview = !!getSongSwipePreview(direction);
        const cardWidth = songSwipeState.cardWidth || window.innerWidth;
        const maxOffset = cardWidth * 0.92;
        currentTouchPosSkip = hasPreview ? Math.max(-maxOffset, Math.min(maxOffset, rawOffset)) : 0;
        songSwipeState.isDragging = true;
        songSwipeState.dragOffset = currentTouchPosSkip;
        setSongSwipeTrackPosition(currentTouchPosSkip, false);
    }else{
        currentTouchPosSkip = 0;
        resetSongSwipeTrack();
    }
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
    if(bugReportScreen.dataset.openedFromSettings !== 'true'){
        document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    }
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
let popupDragStartY = 0;
let popupDragOffset = 0;

const move3 = (e) => {
    popupDragOffset = Math.max(0, e.touches[0].clientY - popupDragStartY);
    currentTouchPos = popupDragOffset;
    moveStarted = true;
    if(popupDragOffset > 0){
        popupScreen.classList.add("playerMovable");
        popupMoveTop = popupDragOffset;
        if(!popupMoveFrame){
            popupMoveFrame = requestAnimationFrame(() => {
                popupScreen.style.transform = `translate3d(0, ${popupMoveTop}px, 0)`;
                popupMoveFrame = null;
            });
        }
    }
    // console.log("moved " + (e.touches[0].clientY - offsetY));
}

popupScreen.addEventListener("touchstart", (e) => {
    if(window.innerWidth < window.innerHeight){
        popupDragStartY = e.touches[0].clientY;
        popupDragOffset = 0;
        popupScreen.style.transform = "translate3d(0, 0, 0)";
        popupScreen.classList.add("playerMovable");
        setInteractionActive(true);
        document.addEventListener("touchmove", move3);
        playerTouchStarted3 = true;
        moveStarted = false;
    }
})

// ----- TOUCH END

document.addEventListener("touchend", () => {
    if(playerTouchStarted){
        document.removeEventListener("touchmove", move);
        cancelScheduledMove(playerMoveFrame);
        playerMoveFrame = null;
        movablePlayer.classList.remove("playerMovable");
        if(currentTouchPos < playerDragStartTop - 125){
            settlePlayerPosition(true);
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            isPlayerOpen = true;
        }else{
            settlePlayerPosition(false);
            triggerMiniPlayerBounce();
            setPlayerNavClosed(false);
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
            isPlayerOpen = false;
        }
        playerTouchStarted = false;
        if(!moveStarted){
            settlePlayerPosition(true);
            setPlayerNavClosed(true);
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
    if(playerTouchStarted2){
        document.removeEventListener("touchmove", move2);
        cancelScheduledMove(playerMoveFrame);
        playerMoveFrame = null;

        if(moveStarted && currentTouchPos > 70){
            settlePlayerPosition(false);
            triggerMiniPlayerBounce();
            setPlayerNavClosed(false);
            document.getElementsByClassName('darkenPlayer')[0].style.opacity = '0';
            isPlayerOpen = false;
        }else if(moveStarted){
            if(isLyricsOn){
                document.getElementsByClassName('darkenPlayer')[0].style.opacity = '1';
            }
            settlePlayerPosition(true);
            isPlayerOpen = true;
        }else{
            movablePlayer.classList.remove("playerMovable");
            bigSongBanner.classList.remove("playerMovable");
        }
    }
    document.removeEventListener("touchmove", moveSideSkip);
    if(songSwipeState.isDragging && !playerMovedDown && !songSwipeState.isCommitting){
        const cardWidth = songSwipeState.cardWidth || window.innerWidth;
        const threshold = cardWidth * 0.22;
        if(Math.abs(currentTouchPosSkip) >= threshold){
            completeSongSwipe(currentTouchPosSkip < 0 ? "next" : "previous");
        }else{
            setSongSwipeTrackPosition(0, true);
            songSwipeState.isDragging = false;
        }
    }
    if(playerTouchStarted3){
        popupScreen.classList.remove("playerMovable");
        document.removeEventListener("touchmove", move3);
        cancelScheduledMove(popupMoveFrame);
        popupMoveFrame = null;
        if(moveStarted){
            if(popupDragOffset <= 100){
                popupScreen.style.transform = "";
            }else{
                closePopup();
            }
        }else{
            popupScreen.style.transform = "";
        }
    }
    playerMovedDown = false;
    playerTouchStarted3 = false;
    playerTouchStarted2 = false;
    playerTouchStarted = false;
    playerGestureDirection = null;
    if(!playerPopupTouchStarted){
        setInteractionActive(false);
    }
})

// ----- CLOSE THE POPUP ADD TO PLAYLIST UL

const closePopupPlBtn = document.querySelector('#closePopupPlBtn');
closePopupPlBtn.addEventListener('click', () => {
    popupScreen.classList.remove("popupPl");
    popupScreen.style.top = "auto";
    popupScreen.style.transform = "";
    setTimeout(() => {
        addToPlBtn.onclick = addToPlFunc;
    }, 100);
})

let playerPopupTouchStarted = false;
let playerPopupStartY = 0;
let playerPopupCurrentY = 0;
let playerPopupStartTop = 0;
let playerPopupCurrentTop = 0;
let playerPopupFrame = null;
let playerPopupStartedFull = false;
let playerPopupStartX = 0;
let playerPopupGestureDirection = null;
let playerPopupStartTarget = null;
let playerPopupDragViewportHeight = 0;
const playerPopupDragThreshold = 8;
let cachedSafeAreaTop = null;

function getPlayerPopupContainerRect(){
    return queuePanel?.closest(".player")?.getBoundingClientRect() || document.documentElement.getBoundingClientRect();
}

function getPlayerPopupViewportHeight(){
    return getPlayerPopupContainerRect().height || window.innerHeight;
}

function getPlayerPopupFullscreenTop(){
    const containerRect = getPlayerPopupContainerRect();
    return Math.max(0, getSafeAreaTopPx() - containerRect.top);
}

function getSafeAreaTopPx(){
    if(cachedSafeAreaTop !== null){
        return cachedSafeAreaTop;
    }

    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.top = "0";
    probe.style.left = "0";
    probe.style.height = "env(safe-area-inset-top)";
    probe.style.width = "0";
    probe.style.pointerEvents = "none";
    probe.style.visibility = "hidden";
    document.body.appendChild(probe);
    cachedSafeAreaTop = probe.getBoundingClientRect().height || window.visualViewport?.offsetTop || 0;
    probe.remove();
    return cachedSafeAreaTop;
}

window.visualViewport?.addEventListener("resize", () => {
    cachedSafeAreaTop = null;
    if(isQueueOpen){
        requestAnimationFrame(syncPlayerPopupViewportOffset);
    }
});

window.addEventListener("orientationchange", () => {
    cachedSafeAreaTop = null;
    if(isQueueOpen){
        requestAnimationFrame(syncPlayerPopupViewportOffset);
    }
});

function syncPlayerPopupViewportOffset(){
    if(!queuePanel || !isQueueOpen){
        return;
    }
    const fullscreenTop = getPlayerPopupFullscreenTop();
    queuePanel.style.setProperty("--player-popup-full-top", `${fullscreenTop}px`);
    if(queuePanel.classList.contains("playerPopupFull")){
        playerPopupCurrentTop = fullscreenTop;
    }
}

function applyPlayerPopupPosition(top){
    if(!queuePanel){
        return;
    }

    const viewportHeight = playerPopupDragViewportHeight || getPlayerPopupViewportHeight();
    const safeTop = Math.max(0, Math.min(top, viewportHeight - 80));
    playerPopupCurrentTop = safeTop;
    queuePanel.style.transform = `translate3d(0, ${safeTop}px, 0)`;
}

function applyPlayerPopupFullscreenPosition(){
    if(!queuePanel){
        return;
    }

    const fullscreenTop = getPlayerPopupFullscreenTop();
    playerPopupCurrentTop = fullscreenTop;
    queuePanel.style.setProperty("--player-popup-full-top", `${fullscreenTop}px`);
    queuePanel.style.transform = "";
}

function clearPlayerPopupDragStyles(){
    if(!queuePanel){
        return;
    }

    queuePanel.classList.remove("playerMovable");
    queuePanel.classList.remove("queuePanelDragging");
    if(playerPopupFrame){
        cancelAnimationFrame(playerPopupFrame);
        playerPopupFrame = null;
    }
}

function canStartPlayerPopupDrag(target){
    if(!queuePanel?.classList.contains("playerPopupFull")){
        return true;
    }

    if(target?.closest(".queueHandle, .queueTabs, .queuePlayingFrom")){
        return true;
    }

    const activeContent = getActivePlayerPopupContent();
    return !!activeContent && activeContent.contains(target) && isPlayerPopupContentAtTop(activeContent);
}

function getActivePlayerPopupContent(){
    return queuePanel?.querySelector(".playerPopupContentActive");
}

function isPlayerPopupContentAtTop(content = getActivePlayerPopupContent()){
    return !!content && content.scrollTop <= 0;
}

function shouldDragPlayerPopupFromContent(deltaY){
    const activeContent = getActivePlayerPopupContent();
    if(!queuePanel?.classList.contains("playerPopupFull") || !activeContent || !activeContent.contains(playerPopupStartTarget)){
        return true;
    }

    return deltaY > 0 && isPlayerPopupContentAtTop(activeContent);
}

function startPlayerPopupDrag(clientX, clientY){
    if(!queuePanel || window.innerWidth > window.innerHeight){
        return;
    }

    document.removeEventListener("touchmove", move2);
    document.removeEventListener("touchmove", moveSideSkip);
    cancelScheduledMove(playerMoveFrame);
    playerMoveFrame = null;
    playerTouchStarted2 = false;
    playerMovedDown = false;
    resetSongSwipeTrack();

    playerPopupTouchStarted = true;
    moveStarted = false;
    playerPopupStartedFull = queuePanel.classList.contains("playerPopupFull");
    playerPopupStartX = clientX;
    playerPopupStartY = clientY;
    playerPopupCurrentY = playerPopupStartY;
    playerPopupGestureDirection = null;
    const panelRect = queuePanel.getBoundingClientRect();
    const containerRect = getPlayerPopupContainerRect();
    playerPopupDragViewportHeight = containerRect.height || window.innerHeight;
    playerPopupStartTop = panelRect.top - containerRect.top;
    playerPopupCurrentTop = playerPopupStartTop;
}

function movePlayerPopupTo(clientX, clientY){
    if(!playerPopupTouchStarted || !queuePanel || window.innerWidth > window.innerHeight){
        return;
    }

    playerPopupCurrentY = clientY;
    const deltaX = clientX - playerPopupStartX;
    const deltaY = playerPopupCurrentY - playerPopupStartY;
    if(!playerPopupGestureDirection){
        playerPopupGestureDirection = getGestureDirection(deltaX, deltaY, playerPopupDragThreshold);
    }
    if(playerPopupGestureDirection !== "vertical"){
        return;
    }

    if(!shouldDragPlayerPopupFromContent(deltaY)){
        return;
    }

    queuePanel.classList.add("playerMovable");
    queuePanel.classList.add("queuePanelDragging");
    setInteractionActive(true);
    moveStarted = true;
    const nextTop = Math.max(0, playerPopupStartTop + deltaY);
    if(playerPopupFrame){
        cancelAnimationFrame(playerPopupFrame);
    }
    playerPopupFrame = requestAnimationFrame(() => {
        applyPlayerPopupPosition(nextTop);
        playerPopupFrame = null;
    });
}

function finishPlayerPopupDrag(){
    if(!playerPopupTouchStarted || !queuePanel){
        return;
    }

    clearPlayerPopupDragStyles();

    if(!moveStarted){
        playerPopupTouchStarted = false;
        playerPopupStartedFull = false;
        playerPopupGestureDirection = null;
        playerPopupStartTarget = null;
        playerPopupDragViewportHeight = 0;
        setInteractionActive(false);
        return;
    }

    const deltaY = playerPopupCurrentY - playerPopupStartY;
    const fullscreenTop = getPlayerPopupFullscreenTop();
    if(deltaY > 110){
        closePlayerPopup();
    }else if(playerPopupStartedFull || deltaY < -70 || playerPopupCurrentTop < fullscreenTop + playerPopupDragViewportHeight * 0.28){
        applyPlayerPopupFullscreenPosition();
        queuePanel.classList.add("playerPopupFull");
    }else{
        queuePanel.style.transform = "";
        queuePanel.classList.remove("playerPopupFull");
        queuePanel.style.removeProperty("--player-popup-full-top");
    }

    playerPopupTouchStarted = false;
    playerPopupStartedFull = false;
    playerPopupGestureDirection = null;
    playerPopupStartTarget = null;
    playerPopupDragViewportHeight = 0;
    moveStarted = false;
    setInteractionActive(false);
}

const movePlayerPopup = (e) => {
    const nextX = e.touches[0].clientX;
    const nextY = e.touches[0].clientY;
    const deltaX = nextX - playerPopupStartX;
    const deltaY = nextY - playerPopupStartY;
    const dragDirection = playerPopupGestureDirection || getGestureDirection(deltaX, deltaY, playerPopupDragThreshold);
    if(playerPopupTouchStarted && (moveStarted || (dragDirection === "vertical" && shouldDragPlayerPopupFromContent(deltaY)))){
        e.preventDefault();
    }
    movePlayerPopupTo(nextX, nextY);
}

const movePlayerPopupMouse = (e) => {
    movePlayerPopupTo(e.clientX, e.clientY);
}

if(queuePanel){
    queuePanel.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        if(!canStartPlayerPopupDrag(e.target)){
            return;
        }
        playerPopupStartTarget = e.target;
        startPlayerPopupDrag(e.touches[0].clientX, e.touches[0].clientY);
        document.addEventListener("touchmove", movePlayerPopup, { passive: false });
    });

    queuePanel.addEventListener("touchend", (e) => {
        e.stopPropagation();
        document.removeEventListener("touchmove", movePlayerPopup);
        finishPlayerPopupDrag();
    });

    queuePanel.addEventListener("touchcancel", (e) => {
        e.stopPropagation();
        document.removeEventListener("touchmove", movePlayerPopup);
        finishPlayerPopupDrag();
    });

    queuePanel.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if(!canStartPlayerPopupDrag(e.target)){
            return;
        }
        e.preventDefault();
        playerPopupStartTarget = e.target;
        startPlayerPopupDrag(e.clientX, e.clientY);
        document.addEventListener("mousemove", movePlayerPopupMouse);
    });

    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", movePlayerPopupMouse);
        finishPlayerPopupDrag();
    });
}

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
    document.getElementById('searchYoursInput').focus();
    renderCrimsonSearchHistory("yours");
}

function resetSearchScreenToNormal(){
    document.getElementById('searchYoursInput').value = "";

    const searchOnBtn = document.querySelector('.searchOnYoursBtn');
    if(searchOnBtn){
        searchOnBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>`;
    }
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

const libraryViewToggle = document.getElementById("libraryViewToggle");

function getLibraryLayoutElements(libraryScreen){
    return Array.from(libraryScreen?.querySelectorAll(
        ".yourPlaylistsH1, .yourPlaylists > li, .yourLPlaylistsH1, .yourLPlaylists > li, .yourFArtistsH1, .yourFArtists"
    ) || []).filter((element) => !element.classList.contains("displayNone"));
}

function animateLibraryLayoutChange(libraryScreen, firstRects){
    const elements = getLibraryLayoutElements(libraryScreen);
    libraryScreen.classList.add("libraryLayoutAnimating");
    elements.forEach((element) => {
        const first = firstRects.get(element);
        if(!first){
            return;
        }
        const last = element.getBoundingClientRect();
        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        const scaleX = first.width && last.width ? first.width / last.width : 1;
        const scaleY = first.height && last.height ? first.height / last.height : 1;
        if(Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1 && Math.abs(scaleX - 1) < .01 && Math.abs(scaleY - 1) < .01){
            return;
        }
        element.getAnimations?.().forEach((animation) => animation.cancel());
        element.animate([
            {transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`, opacity: .78},
            {transform: "translate(0, 0) scale(1, 1)", opacity: 1}
        ], {
            duration: 390,
            easing: "cubic-bezier(.2, .82, .22, 1)",
            fill: "both"
        });
    });
    setTimeout(() => libraryScreen.classList.remove("libraryLayoutAnimating"), 410);
}

function setLibraryView(view, savePreference = true, animateChange = true){
    const isGrid = view === "grid";
    const libraryScreen = document.querySelector(".yoursScreen");
    const shouldAnimate = animateChange && libraryScreen && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const firstRects = new Map();
    if(shouldAnimate){
        getLibraryLayoutElements(libraryScreen).forEach((element) => firstRects.set(element, element.getBoundingClientRect()));
    }
    libraryScreen?.classList.toggle("libraryGridView", isGrid);
    if(shouldAnimate){
        void libraryScreen.offsetWidth;
        animateLibraryLayoutChange(libraryScreen, firstRects);
    }

    if(libraryViewToggle){
        const label = isGrid ? "Switch to column view" : "Switch to grid view";
        libraryViewToggle.innerHTML = isGrid
            ? `<i class="fa-solid fa-list"></i>`
            : `<i class="fa-solid fa-table-cells-large"></i>`;
        libraryViewToggle.setAttribute("aria-label", label);
        libraryViewToggle.setAttribute("title", label);
    }

    if(savePreference){
        try{
            localStorage.setItem("crimsonLibraryView", isGrid ? "grid" : "columns");
        }catch(error){}
    }
}

if(libraryViewToggle){
    let savedLibraryView = "columns";
    try{
        savedLibraryView = localStorage.getItem("crimsonLibraryView") || "columns";
    }catch(error){}

    setLibraryView(savedLibraryView, false, false);
    libraryViewToggle.addEventListener("click", () => {
        const isGrid = document.querySelector(".yoursScreen")?.classList.contains("libraryGridView");
        setLibraryView(isGrid ? "columns" : "grid", true, true);
    });
}

const submitYoursSearchBtn = document.getElementById("submitYoursSearch");
function filterLibraryCollection(items, titleSelector, searchTerm){
    return items.reduce((matchCount, item) => {
        if(item.matches(".skeletonItem, .contentEmptyState")){
            item.classList.add("displayNone");
            return matchCount;
        }
        const title = item.querySelector(titleSelector)?.textContent?.trim().toLowerCase() || "";
        const matches = title.includes(searchTerm) || searchTerm.includes(title);
        item.classList.toggle("displayNone", !matches);
        return matchCount + (matches ? 1 : 0);
    }, 0);
}

function filterYoursLibrary(saveSearchTerm = true){
    const searchInput = document.getElementById('searchYoursInput').value;
    const yourPlaylists = [].slice.call(document.querySelector('.yourPlaylists').children);
    const yourLPlaylists = [].slice.call(document.querySelector('.yourLPlaylists').children);
    const yourFArtists = [].slice.call(document.querySelector('.yourFArtists').children);

    let brP = 0, brL = 0, brA = 0;
    if(searchInput != "" && searchInput != undefined){
        if(saveSearchTerm){
            saveCrimsonSearchHistory("yours", searchInput);
        }

        const normalizedSearch = searchInput.toLowerCase();
        brP = filterLibraryCollection(yourPlaylists, ".songText h2", normalizedSearch);
        brL = filterLibraryCollection(yourLPlaylists, ".songText h2", normalizedSearch);
        brA = filterLibraryCollection(yourFArtists, "h3", normalizedSearch);

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
    }else{
        resetSearchScreenToNormal();
    }
}

submitYoursSearchBtn.addEventListener('click', () => {
    filterYoursLibrary(true);
});

document.getElementById('searchYoursInput').addEventListener('input', () => {
    filterYoursLibrary(false);
});

// ------ Login Popup

let isLoginPopupOn = false;

function openLoginPopup(){
    if(!isLoginPopupOn){
        const loginPopup = document.getElementsByClassName('loginPopup')[0];
        showCrimsonView(loginPopup);
        loginPopup.classList.add('loginPopupOn');
        setTimeout(() => {
            loginPopup.classList.remove('loginPopupOn');
            hideCrimsonView(loginPopup, "loginPopupOn", 250);
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

function openBugReportFromSettings(){
    openBugReport(true);
}

function openBugReport(fromSettings = false){
    showCrimsonView(bugReportScreen);
    bugReportScreen.dataset.openedFromSettings = String(fromSettings);
    if(!fromSettings){
        document.getElementsByClassName(currentScreen)[0].classList.add("mainToSide");
    }

    bugReportScreen.classList.add("bugReportScreenOpen");

    isBugReportScreenOpen = true;
}

function closeBugScreenF(){
    if(bugReportScreen.dataset.openedFromSettings !== 'true'){
        document.getElementsByClassName(currentScreen)[0].classList.remove("mainToSide");
    }

    bugReportScreen.classList.remove("bugReportScreenOpen");
    
    bugReportScreen.classList.remove("playerMovable");
    hideCrimsonView(bugReportScreen, "bugReportScreenOpen", 350);
    delete bugReportScreen.dataset.openedFromSettings;

    isBugReportScreenOpen = false;
}

function noStorage(){
    document.querySelector('.noStorageMessage').style.display = 'flex';
}

function playArtist(){
    toggleContextPlayback("artist");
}

// ----- PLAYLIST SORTING

let playlistToSort = null, defaultPlaylistSort = null;
const sortBtns = document.querySelectorAll('.sortBtn');
sortBtns.forEach((sortBtn) => {
    sortBtn.addEventListener("click", () => {
        playlistToSort = document.querySelector(`.${sortBtn.getAttribute('data-playlisttosort')}`);

        const sortPopupWrapper = document.querySelector('.sortPopupWrapper');
        showCrimsonView(sortPopupWrapper);
        let sortPopup = document.querySelector('.sortPopup');

        let sortBtnRect = sortBtn.getBoundingClientRect();
        const popupRect = sortPopup.getBoundingClientRect();
        let offsetX = Math.round(sortBtnRect.right - popupRect.width);
        let offsetY = Math.round(sortBtnRect.bottom + 8);
        offsetX = Math.max(14, Math.min(offsetX, window.innerWidth - popupRect.width - 14));
        offsetY = Math.max(14, Math.min(offsetY, window.innerHeight - popupRect.height - 14));

        document.documentElement.style.setProperty('--sortPopupTop', `${offsetY}px`);
        document.documentElement.style.setProperty('--sortPopupLeft', `${offsetX}px`);
        requestAnimationFrame(() => {
            document.querySelector('.sortPopupWrapper').classList.add('sortPopupOpen');
        });
    })
})

function closeSortPopup(){
    const sortPopupWrapper = document.querySelector('.sortPopupWrapper');
    sortPopupWrapper.classList.remove('sortPopupOpen');
    hideCrimsonView(sortPopupWrapper, "sortPopupOpen", 250);
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

initializeInactiveCrimsonViews();
